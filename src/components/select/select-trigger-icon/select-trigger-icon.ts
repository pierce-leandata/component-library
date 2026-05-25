import { computed, Directive, inject } from '@angular/core'
import { SelectService } from '../select.service'

@Directive({
  selector: '[pmSelectTriggerIcon]',
  host: {
    '[style]': 'style()',
    'data-select-trigger-icon': '',
  },
})
export class SelectTriggerIconDirective {
  private selectService = inject(SelectService)

  protected style = computed(() => (this.selectService.isOpen() ? 'rotate: 180deg' : ''))
}
