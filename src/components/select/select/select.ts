import { Component, inject, model } from '@angular/core'
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

  private selectService = inject(SelectService)

  protected overlayId = this.selectService.overlayId

  constructor() {
    this.selectService.isOpen = this.isOpen
    this.selectService.value = this.value
  }
}
