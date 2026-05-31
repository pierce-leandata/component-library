import { Directive, ElementRef, inject } from '@angular/core'
import { SelectService } from '@components/select/select.service'

@Directive({
  selector: 'button[pmSelectTrigger]',
  host: {
    type: 'button',
    '(click)': 'onClick()',
    '(keydown)': 'onKeyDown($event)',
    '(blur)': 'onBlur($event)',
    '[attr.aria-expanded]': 'selectService.isOpen()',
    '[attr.aria-controls]': 'selectService.overlayId',
    '[attr.aria-haspopup]': '"listbox"',
    '[attr.aria-activedescendant]': 'selectService.focusedItem()?.label?.nativeElement?.id',
    '[attr.aria-readonly]': 'selectService.isReadOnly()',
    '[attr.data-readonly]': 'selectService.isReadOnly()',
    '[disabled]': 'selectService.isDisabled()',
    '[attr.data-disabled]': 'selectService.isDisabled()',
    '[attr.aria-required]': 'selectService.isRequired()',
    'data-select-trigger': '',
  },
})
export class SelectTriggerDirective {
  protected selectService = inject(SelectService)
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef)

  constructor() {
    this.selectService.triggerElement.set(this.elementRef)
  }

  protected onClick() {
    if (this.selectService.isDisabled() || this.selectService.isReadOnly()) return

    if (this.selectService.isOpen()) {
      this.selectService.close()
    } else {
      this.selectService.open()
    }
  }

  protected onKeyDown(e: KeyboardEvent) {
    if (this.selectService.isDisabled() || this.selectService.isReadOnly()) return

    // SelectService handles keyboard navigation when the overlay is open
    if (this.selectService.isOpen()) {
      return
    }

    const isSearchableKey = this.selectService.isSearchableKey(e)

    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key) && !isSearchableKey) {
      return
    }

    e.preventDefault()

    if (isSearchableKey) {
      // prevents select service from also searching for the typed key when the listeners are attached
      e.stopPropagation()
      this.selectService.open({ shouldFocus: false })
      // rAF so that the overlay can render and the items array will be populated
      requestAnimationFrame(() => {
        this.selectService.searchFor(e.key)
      })
      return
    }

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        this.selectService.open()
        break
      case 'Home':
        this.selectService.open({ focusItem: 0 })
        break
      case 'End':
        this.selectService.open({ focusItem: -1 })
    }
  }

  protected onBlur(e: FocusEvent) {
    if (this.selectService.isDisabled() || this.selectService.isReadOnly()) return

    const target = e.relatedTarget as Node | null
    const wrapper = this.selectService.wrapperElement()?.nativeElement
    if (!wrapper?.contains(target)) {
      this.selectService._onTouched()
    }
  }
}
