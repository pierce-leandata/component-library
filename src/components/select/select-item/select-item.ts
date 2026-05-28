import {
  afterNextRender,
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core'
import { SelectService } from '@components/select/select.service'
import { extractTextFromHtml, generateId } from '@utils/utils'

@Directive({
  selector: '[pmSelectItem]',
  host: {
    'data-select-item': '',
    role: 'option',
    '[id]': 'id',
    '[attr.data-focused]': 'isFocused()',
    '[attr.data-selected]': 'isSelected()',
    '[attr.aria-selected]': 'isSelected()',
    '(click)': 'onSelect()',
    '(keydown)': 'onKeyDown($event)',
    '(mousemove)': 'onMouseMove()',
    '[tabindex]': '-1',
  },
})
export class SelectItemDirective {
  readonly value = input.required<string>()

  protected selectService = inject(SelectService)
  readonly label = inject<ElementRef<HTMLElement>>(ElementRef)
  readonly destroyRef = inject(DestroyRef)

  readonly searchValue = signal('')
  readonly html = signal(this.label.nativeElement.innerHTML)
  protected isSelected = computed(() => this.selectService.value() === this.value())
  protected isFocused = computed(() => this.selectService.focusedItem()?.value() === this.value())

  protected id = generateId()

  constructor() {
    afterNextRender(() => this.updateSearchValueAndHtml())

    const observer = new MutationObserver(() => this.updateSearchValueAndHtml())

    observer.observe(this.label.nativeElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    })

    this.destroyRef.onDestroy(() => {
      observer.disconnect()
    })
  }

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
      html: this.html,
    })
  }

  private updateSearchValueAndHtml() {
    this.searchValue.set(extractTextFromHtml(this.label.nativeElement))
    this.html.set(this.label.nativeElement.innerHTML)
  }
}
