import { Component, computed, inject } from '@angular/core'
import { SelectService } from '@components/select/select.service'

@Component({
  selector: 'pm-select-value',
  templateUrl: './select-value.html',
})
export class SelectValueComponent {
  private selectService = inject(SelectService)

  protected selectedHtml = computed(
    () =>
      this.selectService
        .items()
        .find((item) => item.value() === this.selectService.value())
        ?.label()?.nativeElement.innerHTML,
  )
}
