import { effect, ElementRef, Injectable, Signal, signal } from '@angular/core'
import { generateId } from '@utils/utils'

export interface SelectItem {
  value: Signal<string>
  label: Signal<ElementRef<HTMLElement> | undefined>
}

@Injectable()
export class SelectService {
  isOpen = signal(false)
  value = signal<string | undefined>(undefined)
  items: Signal<readonly SelectItem[]> = signal([])
  focusedItem = signal<SelectItem | undefined>(undefined)
  overlayElement: Signal<ElementRef<HTMLElement> | undefined> = signal(undefined)
  triggerElement: Signal<ElementRef<HTMLElement> | undefined> = signal(undefined)

  readonly overlayId = generateId()

  constructor() {
    effect((onCleanup) => {
      if (!this.isOpen()) {
        this.focusedItem.set(undefined)
        return
      }

      const onKeyDown = (e: KeyboardEvent) => this.onKeyDown(e)
      const onFocusOut = (e: FocusEvent) => this.onFocusOut(e)
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('focusout', onFocusOut)
      onCleanup(() => {
        window.removeEventListener('keydown', onKeyDown)
        window.removeEventListener('focusout', onFocusOut)
      })
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
    this.isOpen.set(false)
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

  private onFocusOut(e: FocusEvent) {
    const overlay = this.overlayElement()?.nativeElement
    const trigger = this.triggerElement()?.nativeElement
    const target = e.relatedTarget as Node | null
    if (!overlay?.contains(target) && !trigger?.contains(target)) {
      this.isOpen.set(false)
    }
  }
}
