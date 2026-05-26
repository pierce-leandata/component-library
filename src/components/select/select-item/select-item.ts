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

  // prefer listening to mousemove events instead of mouseenter
  // mouseenter can cause extraneous focuses
  //
  // i.e. searching while mouse is hovered over the overlay:
  // the mouse "enters" a different select item than the one you focused by typing,
  // causing it to focus, which is a confusing experience
  onMouseMove() {
    if (this.selectService.focusedItem()?.value() === this.value()) return

    this.selectService.focusItem({
      value: this.value,
      label: this.label,
      searchValue: this.searchValue,
    })
  }
}
