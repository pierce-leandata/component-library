import {
  DestroyRef,
  ElementRef,
  inject,
  Injectable,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core'
import { trackBoundingRect } from '@utils/sizing'
import { generateId } from '@utils/utils'

export interface SelectItem {
  id: string
  value: Signal<string>
  label: ElementRef<HTMLElement>
  searchValue: Signal<string>
  html: Signal<string>
}

const SEARCH_CLEAR_DELAY = 1000 as const

@Injectable()
export class SelectService {
  destroyRef = inject(DestroyRef)

  // ---- forwarded from select props ---- //

  /** DO NOT SET DIRECTLY. Use `open()` and `close()` methods */
  isOpen = signal(false)
  value = signal<string | undefined>(undefined)
  appendToBody: Signal<boolean> = signal<boolean>(false)

  // ------------------------------------- //

  isOverlayMounted = signal(false)
  items: WritableSignal<readonly SelectItem[]> = signal([])
  /** DO NOT SET DIRECTLY. Use `focusItem()` method instead. */
  focusedItem = signal<SelectItem | undefined>(undefined)
  overlayElement: WritableSignal<ElementRef<HTMLElement> | undefined> = signal(undefined)
  triggerElement: WritableSignal<ElementRef<HTMLElement> | undefined> = signal(undefined)
  wrapperElement: WritableSignal<ElementRef<HTMLElement> | undefined> = signal(undefined)

  readonly triggerRect = trackBoundingRect(this.triggerElement, {
    listenTo: {
      width: true,
      height: true,
      x: true,
      y: true,
    },
  })

  readonly wrapperRect = trackBoundingRect(this.wrapperElement, {
    listenTo: {
      x: true,
      y: true,
    },
  })

  readonly overlayId = generateId()

  private searchString = ''
  private lastSearchTimestamp = 0
  private isCyclingSearch = false
  private isSearchResetCancelled = false

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.isSearchResetCancelled = true
      window.removeEventListener('keydown', this.onKeyDown)
      window.removeEventListener('focusout', this.onFocusOut)
    })
  }

  open(options?: {
    /**
     * Index of the item to focus. If omitted, the currently selected item will be focused.
     * If no item is currently selected, the first item will be focused.
     */
    focusItem?: number
    /**
     * Whether to allow focusing on any item after opening.
     *
     * @default true
     */
    shouldFocus?: boolean
  }) {
    // must mount before setting to open
    // causes data-state to go from closed -> open, allowing CSS transition styling
    this.isOverlayMounted.set(true)

    requestAnimationFrame(() => {
      const shouldFocus = options?.shouldFocus ?? true
      if (shouldFocus) {
        const selectedItemIndex = this.getSelectedItemIndex()
        const itemToFocus = options?.focusItem ?? Math.max(0, selectedItemIndex)
        this.focusItem(itemToFocus, { scrollIntoViewBlock: 'center' })
      }

      this.isOpen.set(true)
    })

    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('focusout', this.onFocusOut)
  }

  async close() {
    this.isOpen.set(false)
    this.focusItem(undefined)

    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('focusout', this.onFocusOut)

    // rAF forces us to wait until the rerender after setting isOpen to false,
    // so animations are allowed to start before checking for animations
    requestAnimationFrame(async () => {
      // wait for animations to complete before unmounting the overlay
      const animationPromises =
        this.overlayElement()
          ?.nativeElement.getAnimations()
          .map((a) => a.finished) ?? []

      await Promise.all(animationPromises)

      this.isOverlayMounted.set(false)
    })
  }

  focusItem(
    indexOrItem?: number | SelectItem,
    options?: {
      /**
       * How to position the item scrolled into view.
       * If omitted, the item will not be scrolled into view.
       *
       * @see https://developer.mozilla.org/docs/Web/API/Element/scrollIntoView
       */
      scrollIntoViewBlock?: ScrollLogicalPosition
    },
  ) {
    const item = typeof indexOrItem === 'number' ? this.items().at(indexOrItem) : indexOrItem
    this.focusedItem.set(item)

    if (options?.scrollIntoViewBlock) {
      item?.label.nativeElement.scrollIntoView({ block: options.scrollIntoViewBlock })
    }
  }

  isSearchableKey(e: KeyboardEvent) {
    // Space selects the currently focused item, so it's not searchable
    return e.key.length === 1 && e.key !== ' ' && !e.ctrlKey && !e.altKey
  }

  async searchFor(char: string) {
    const normalize = (str: string | undefined) => {
      return str?.toLocaleLowerCase().normalize('NFD') ?? ''
    }

    const wasCyclingSearch = this.isCyclingSearch
    this.isCyclingSearch = normalize(char) === normalize(this.searchString)

    // if no longer cycling, clear the search string so the user can immediately begin searching for a new item
    // ARIA APG example has a 1 typed character buffer before this, but that seems like worse behavior to me
    if (wasCyclingSearch && !this.isCyclingSearch) {
      this.searchString = ''
      this.lastSearchTimestamp = performance.now()
    }

    // cycle through options that start with the same character if repeatedly pressing the character
    if (this.isCyclingSearch) {
      this.lastSearchTimestamp = performance.now()

      const indicesOfItemsStartingWithChar = this.items().reduce((acc, item, index) => {
        if (normalize(item.searchValue()).startsWith(normalize(char))) {
          return [...acc, index]
        }
        return acc
      }, [] as number[])

      const hasMatches = indicesOfItemsStartingWithChar.length > 0
      const focusedItemIndex = this.getFocusedItemIndex()

      // if not currently focusing on one of the matching items, focus on the first
      if (hasMatches && !indicesOfItemsStartingWithChar.includes(focusedItemIndex)) {
        const nextItemIndex = indicesOfItemsStartingWithChar.find(
          (index) => index > focusedItemIndex,
        )
        this.focusItem(nextItemIndex ?? indicesOfItemsStartingWithChar.at(0))
      } else if (hasMatches) {
        // index of the matching indices array that has the focusedItemIndex
        const indicesFocusedItemIndex = indicesOfItemsStartingWithChar.findIndex(
          (index) => index === focusedItemIndex,
        )
        // go to the next index from the matching indices array, wrapping if necessary
        const nextItemIndex = indicesOfItemsStartingWithChar.at(
          (indicesFocusedItemIndex + 1) % indicesOfItemsStartingWithChar.length,
        )
        this.focusItem(nextItemIndex, { scrollIntoViewBlock: 'nearest' })
      }
    } else {
      // user is not pressing the same character repeatedly, add a character to the search string
      // and continue search

      this.searchString = this.searchString + char
      this.lastSearchTimestamp = performance.now()

      const focusedItemIndex = this.getFocusedItemIndex()

      let itemToFocus: SelectItem | null = null
      // find the next item that matches, starting from the currently focused index
      // start at 1 to skip the currently focused item
      // if there is no focused item, focusedItemIndex = -1 and we start from index 0
      for (let i = 1; i < this.items().length; i++) {
        const index = (focusedItemIndex + i) % this.items().length
        const item = this.items().at(index)
        if (item && normalize(item.searchValue()).startsWith(normalize(this.searchString))) {
          itemToFocus = item
          break
        }
      }

      if (itemToFocus) {
        this.focusItem(itemToFocus, { scrollIntoViewBlock: 'nearest' })
      }
    }

    await new Promise((res) => setTimeout(res, SEARCH_CLEAR_DELAY))

    const timeSinceLastSearchStringUpdate = performance.now() - this.lastSearchTimestamp
    if (!this.isSearchResetCancelled && timeSinceLastSearchStringUpdate >= SEARCH_CLEAR_DELAY) {
      this.searchString = ''
    }
  }

  /**
   * Get the index of the currently selected item. If no item is selected, returns -1
   */
  private getSelectedItemIndex() {
    return this.items().findIndex((item) => item.value() === this.value())
  }

  /**
   * Get the index of the currently focused item. If no item is focused, returns -1
   */
  private getFocusedItemIndex() {
    return this.items().findIndex((item) => item.value() === this.focusedItem()?.value())
  }

  private focusNextItem() {
    const currentIndex = this.getFocusedItemIndex()
    const getNextIndex = () => {
      if (currentIndex === -1) {
        return 0
      } else {
        return (currentIndex + 1) % this.items().length
      }
    }

    this.focusItem(getNextIndex(), { scrollIntoViewBlock: 'nearest' })
  }

  private focusPreviousItem() {
    const currentIndex = this.getFocusedItemIndex()
    const getPreviousIndex = () => {
      if (currentIndex === -1) {
        return this.items().length - 1
      } else {
        return (currentIndex - 1 + this.items().length) % this.items().length
      }
    }

    this.focusItem(getPreviousIndex(), { scrollIntoViewBlock: 'nearest' })
  }

  private selectFocusedItem() {
    if (!this.focusedItem()) return

    this.value.set(this.focusedItem()!.value())
    this.close()
  }

  private onKeyDown = (e: KeyboardEvent) => {
    const isSearchableKey = this.isSearchableKey(e)
    if (
      ![
        'ArrowDown',
        'ArrowUp',
        'Enter',
        ' ',
        'Tab',
        'Escape',
        'Home',
        'End',
        'PageUp',
        'PageDown',
      ].includes(e.key) &&
      !isSearchableKey
    ) {
      return
    }

    if (isSearchableKey) {
      e.preventDefault()
      this.searchFor(e.key)
      return
    }

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        this.focusNextItem()
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        if (e.altKey) {
          this.selectFocusedItem()
          this.triggerElement()?.nativeElement.focus()
        } else {
          this.focusPreviousItem()
        }
        break
      }
      case 'Enter':
      case ' ': {
        e.preventDefault()
        this.selectFocusedItem()
        break
      }
      // Intentionally do not prevent default
      case 'Tab': {
        this.selectFocusedItem()
        break
      }
      case 'Escape': {
        e.preventDefault()
        this.close()
        break
      }
      case 'Home': {
        e.preventDefault()
        this.focusItem(0, { scrollIntoViewBlock: 'nearest' })
        break
      }
      case 'End': {
        e.preventDefault()
        this.focusItem(-1, { scrollIntoViewBlock: 'nearest' })
        break
      }
      case 'PageUp': {
        e.preventDefault()
        const focusedItemIndex = this.getFocusedItemIndex()
        this.focusItem(Math.max(0, focusedItemIndex - 10), { scrollIntoViewBlock: 'nearest' })
        break
      }
      case 'PageDown': {
        e.preventDefault()
        const focusedItemIndex = this.getFocusedItemIndex()
        this.focusItem(Math.min(this.items().length - 1, focusedItemIndex + 10), {
          scrollIntoViewBlock: 'nearest',
        })
        break
      }
    }
  }

  // Will not fire when clicking on the select trigger if it's already focused
  // Trigger handles closing on click
  private onFocusOut = (e: FocusEvent) => {
    const overlay = this.overlayElement()?.nativeElement
    const target = e.relatedTarget as Node | null
    if (!overlay?.contains(target)) {
      this.close()
    }
  }
}
