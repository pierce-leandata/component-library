import { Component, effect, ElementRef, inject, input, model, viewChild } from '@angular/core'
import { SelectService } from '@components/select/select.service'

@Component({
  selector: 'pm-select',
  templateUrl: './select.html',
  providers: [SelectService],
})
export class SelectComponent {
  isOpen = model(false)
  value = model<string>()
  appendToBody = input<boolean>(false)

  selectService = inject(SelectService)

  private wrapperElement = viewChild<ElementRef<HTMLElement>>('wrapper')

  constructor() {
    this.selectService.isOpen = this.isOpen
    this.selectService.value = this.value
    this.selectService.appendToBody = this.appendToBody

    effect(() => this.selectService.wrapperElement.set(this.wrapperElement()))
  }
}
