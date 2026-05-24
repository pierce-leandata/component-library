import { effect, ElementRef, Injectable, Signal, signal } from '@angular/core'
import { generateId } from '@utils/utils'

export interface SelectItem {
  value: Signal<string>
  label: Signal<ElementRef<HTMLElement> | undefined>
}

@Injectable()
export class SelectService {
  /** DO NOT SET DIRECTLY. Use `open()` and `close()` methods */
  isOpen = signal(false)
  isOverlayMounted = signal(false)
  value = signal<string | undefined>(undefined)
  items: Signal<readonly SelectItem[]> = signal([])
  focusedItem = signal<SelectItem | undefined>(undefined)
  overlayElement: Signal<ElementRef<HTMLElement> | undefined> = signal(undefined)
  triggerElement: Signal<ElementRef<HTMLElement> | undefined> = signal(undefined)

  readonly overlayId = generateId()

  constructor() {
    effect((onCleanup) => {
      onCleanup(() => {
        window.removeEventListener('keydown', this.onKeyDown)
        window.removeEventListener('focusout', this.onFocusOut)
      })
    })
  }

  open() {
    // must mount before setting to open
    // causes data-state to go from closed -> open, allowing CSS transition styling
    this.isOverlayMounted.set(true)
    requestAnimationFrame(() => {
      this.isOpen.set(true)
    })

    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('focusout', this.onFocusOut)
  }

  async close() {
    this.isOpen.set(false)
    this.focusedItem.set(undefined)

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

    this.focusedItem.set(this.items().at(getNextIndex()))
  }

  private focusPreviousItem() {
    const currentIndex = this.getFocusedItemIndex()
    const getNextIndex = () => {
      if (currentIndex === -1) {
        return this.items().length - 1
      } else {
        return (currentIndex - 1 + this.items().length) % this.items().length
      }
    }

    this.focusedItem.set(this.items().at(getNextIndex()))
  }

  private selectFocusedItem() {
    if (!this.focusedItem()) return

    this.value.set(this.focusedItem()!.value())
    this.close()
  }

  private onKeyDown(e: KeyboardEvent) {
    if (!['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      return
    }

    const items = this.items()
    if (items.length === 0) {
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
        this.focusPreviousItem()
        break
      }
      case 'Enter':
      case ' ': {
        if (this.focusedItem()) {
          e.preventDefault()
          this.selectFocusedItem()
        }
      }
    }
  }

  // Will not fire when clicking on the select trigger if it's already focused
  // Trigger handles closing on click
  private onFocusOut(e: FocusEvent) {
    const overlay = this.overlayElement()?.nativeElement
    const target = e.relatedTarget as Node | null
    if (!overlay?.contains(target)) {
      this.close()
    }
  }
}
