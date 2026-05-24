import { Directive, ElementRef, inject, signal } from '@angular/core'
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
    'data-select-trigger': '',
  },
})
export class SelectTriggerDirective {
  protected selectService = inject(SelectService)
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef)

  constructor() {
    this.selectService.triggerElement = signal(this.elementRef)
  }

  protected onClick() {
    if (this.selectService.isOpen()) {
      this.selectService.close()
    } else {
      this.selectService.open()
    }
  }

  protected onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown' && !this.selectService.isOpen()) {
      this.selectService.open()
      // rAF so that the items have been rendered and can be accessed
      requestAnimationFrame(() => {
        this.selectService.focusedItem.set(this.selectService.items().at(0))
      })
    }
  }
}
