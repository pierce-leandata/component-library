import { Component, computed, ElementRef, inject, input, viewChild } from '@angular/core'
import { SelectService } from '@components/select/select.service'

@Component({
  selector: 'pm-select-item',
  templateUrl: './select-item.html',
})
export class SelectItemComponent {
  value = input.required<string>()

  selectService = inject(SelectService)

  isSelected = computed(() => this.selectService.value() === this.value())
  isFocused = computed(() => this.selectService.focusedItem()?.value() === this.value())

  readonly label = viewChild<ElementRef<HTMLElement>>('label')

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
    this.selectService.focusedItem.set({ value: this.value, label: this.label })
  }
}
