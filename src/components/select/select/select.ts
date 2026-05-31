import { Component, effect, ElementRef, forwardRef, inject, model, viewChild } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { SelectService } from '@components/select/select.service'

@Component({
  selector: 'pm-select',
  templateUrl: './select.html',
  providers: [
    SelectService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
})
export class SelectComponent implements ControlValueAccessor {
  isOpen = model(false)
  isDisabled = model(false)
  isReadOnly = model(false)
  isRequired = model(false)
  value = model<string>()

  private selectService = inject(SelectService)

  private wrapperElement = viewChild<ElementRef<HTMLElement>>('wrapper')

  constructor() {
    this.selectService.isOpen = this.isOpen
    this.selectService.isDisabled = this.isDisabled
    this.selectService.isReadOnly = this.isReadOnly
    this.selectService.isRequired = this.isRequired
    this.selectService.value = this.value

    effect(() => this.selectService.wrapperElement.set(this.wrapperElement()))
  }

  writeValue(value: string | undefined) {
    this.value.set(value)
  }

  registerOnChange(fn: (value: string | undefined) => void) {
    this.selectService._onChange = fn
  }

  registerOnTouched(fn: () => void) {
    this.selectService._onTouched = fn
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled)
  }
}
