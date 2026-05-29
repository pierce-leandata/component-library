import { Directive } from '@angular/core'
import { generateId } from '@utils/utils'

@Directive({
  selector: '[pmSelectItemGroupLabel]',
  host: {
    role: 'presentation',
    '[id]': 'id',
    'data-select-item-group-label': '',
  },
})
export class SelectItemGroupLabelDirective {
  id = generateId()
}
