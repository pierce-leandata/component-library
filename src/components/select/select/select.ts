import { Component, inject, input, model } from '@angular/core'
import { SelectService } from '@components/select/select.service'

@Component({
  selector: 'pm-select',
  templateUrl: './select.html',
  styleUrl: './select.scss',
  providers: [SelectService],
})
export class SelectComponent {
  isOpen = model(false)
  value = model<string>()
  appendToBody = input<boolean>(false)

  selectService = inject(SelectService)

  constructor() {
    this.selectService.isOpen = this.isOpen
    this.selectService.value = this.value
    this.selectService.appendToBody = this.appendToBody
  }
}
