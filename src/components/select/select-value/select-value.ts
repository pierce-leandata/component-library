import { Component, computed, inject, input } from '@angular/core'
import { SelectService } from '@components/select/select.service'
import { Classes, Styles } from '@utils/types'
import { generateId, getClassString, getStyleObject } from '@utils/utils'

@Component({
  selector: 'pm-select-value',
  templateUrl: './select-value.html',
})
export class SelectValueComponent {
  /**
   * Classes to apply to nested elements.
   */
  classes = input<Classes<'value' | 'placeholder'>>()
  /**
   * Styles to apply to nested elements.
   */
  styles = input<Styles<'value' | 'placeholder'>>()

  private selectService = inject(SelectService)

  protected selectedHtml = computed(() =>
    this.selectService
      .items()
      .find((item) => item.value() === this.selectService.value())
      ?.html(),
  )

  protected valueClass = computed(() => getClassString(this.classes(), 'value'))
  protected placeholderClass = computed(() => getClassString(this.classes(), 'placeholder'))

  protected valueStyle = computed(() => getStyleObject(this.styles(), 'value'))
  protected placeholderStyle = computed(() => getStyleObject(this.styles(), 'placeholder'))

  id = generateId()
}
