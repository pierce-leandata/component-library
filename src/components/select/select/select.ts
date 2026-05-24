import { Component, inject, model } from '@angular/core'
import { SelectService } from '@components/select/select.service'
import { trackBoundingRect } from '@utils/bounding-rect'

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

  protected triggerRect = trackBoundingRect(this.selectService.triggerElement, {
    listenTo: {
      width: true,
      height: true,
      x: true,
      y: true,
    },
  })
  protected overlayId = this.selectService.overlayId

  constructor() {
    this.selectService.isOpen = this.isOpen
    this.selectService.value = this.value
  }
}
