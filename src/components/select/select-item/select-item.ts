import { Component, computed, ElementRef, inject, input, viewChild } from '@angular/core'
import { SelectService } from '@components/select/select.service'
import { extractTextFromHtml, generateId } from '@utils/utils'

@Component({
  selector: 'pm-select-item',
  templateUrl: './select-item.html',
})
export class SelectItemComponent {
  readonly value = input.required<string>()

  protected selectService = inject(SelectService)

  protected isSelected = computed(() => this.selectService.value() === this.value())
  protected isFocused = computed(() => this.selectService.focusedItem()?.value() === this.value())
  readonly searchValue = computed(() =>
    this.label() ? extractTextFromHtml(this.label()!.nativeElement) : '',
  )

  readonly label = viewChild<ElementRef<HTMLElement>>('label')

  protected id = generateId()

  onSelect() {
    this.selectService.close()
    this.selectService.value.set(this.value())
  }

  onKeyDown(e: KeyboardEvent) {
    if (['Enter', ' '].includes(e.key)) {
      this.onSelect()
    }
  }

  onMouseEnter() {
    this.selectService.focusItem({
      value: this.value,
      label: this.label,
      searchValue: this.searchValue,
    })
  }
}
