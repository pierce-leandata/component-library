import { contentChild, Directive, effect } from '@angular/core'
import { SelectItemGroupLabelDirective } from '../select-item-group-label/select-item-group-label'

@Directive({
  selector: '[pmSelectItemGroup]',
  host: {
    role: 'group',
    '[aria-labelledby]': 'label()?.id',
    'data-select-item-group': '',
  },
})
export class SelectItemGroupDirective {
  protected label = contentChild(SelectItemGroupLabelDirective)

  constructor() {
    effect(() => {
      if (!this.label()) {
        throw new Error(
          'pmSelectItemGroup requires a child element with the pmSelectItemGroupLabel directive for accessibility.',
        )
      }
    })
  }
}
