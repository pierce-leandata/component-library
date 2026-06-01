import { Directive, ElementRef, forwardRef, inject, model } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { SelectService } from '@components/select/select.service'

@Directive({
  selector: '[pmSelect]',
  providers: [
    SelectService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectDirective),
      multi: true,
    },
  ],
  host: {
    'data-select': '',
  },
})
export class SelectDirective implements ControlValueAccessor {
  isOpen = model(false)
  isDisabled = model(false)
  isReadOnly = model(false)
  isRequired = model(false)
  value = model<string>()

  private selectService = inject(SelectService)
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef)

  constructor() {
    this.selectService.isOpen = this.isOpen
    this.selectService.isDisabled = this.isDisabled
    this.selectService.isReadOnly = this.isReadOnly
    this.selectService.isRequired = this.isRequired
    this.selectService.value = this.value
    this.selectService.wrapperElement.set(this.elementRef)
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
