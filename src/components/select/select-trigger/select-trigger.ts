import { Directive, ElementRef, inject } from '@angular/core'
import { SelectService } from '@components/select/select.service'

@Directive({
  selector: 'button[pmSelectTrigger]',
  host: {
    type: 'button',
    '(click)': 'onClick()',
    '(keydown)': 'onKeyDown($event)',
    '[attr.aria-expanded]': 'selectService.isOpen()',
    '[attr.aria-controls]': 'selectService.overlayId',
    '[attr.aria-haspopup]': '"listbox"',
    '[attr.aria-activedescendant]': 'selectService.focusedItem()?.label()?.nativeElement?.id',
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
    if (this.selectService.isOpen()) {
      this.selectService.close()
    } else {
      this.selectService.open()
    }
  }

  protected onKeyDown(e: KeyboardEvent) {
    // SelectService handles keyboard navigation when the overlay is open
    if (this.selectService.isOpen()) {
      return
    }

    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
      return
    }

    e.preventDefault()

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
}
