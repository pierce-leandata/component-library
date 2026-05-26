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
  value: Signal<string>
  label: Signal<ElementRef<HTMLElement> | undefined>
}

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

  triggerRect = trackBoundingRect(this.triggerElement, {
    listenTo: {
      width: true,
      height: true,
      x: true,
      y: true,
    },
  })

  wrapperRect = trackBoundingRect(this.wrapperElement, {
    listenTo: {
      x: true,
      y: true,
    },
  })

  readonly overlayId = generateId()

  constructor() {
    this.destroyRef.onDestroy(() => {
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
  }) {
    // must mount before setting to open
    // causes data-state to go from closed -> open, allowing CSS transition styling
    this.isOverlayMounted.set(true)

    requestAnimationFrame(() => {
      const selectedItemIndex = this.items().findIndex((item) => item.value() === this.value())
      const itemToFocus = options?.focusItem ?? Math.max(0, selectedItemIndex)
      this.focusItem(itemToFocus, { scrollIntoViewBlock: 'center' })
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
      item?.label()?.nativeElement.scrollIntoView({ block: options.scrollIntoViewBlock })
    }
  }

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
    if (!['ArrowDown', 'ArrowUp', 'Enter', ' ', 'Tab', 'Escape', 'Home', 'End'].includes(e.key)) {
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
