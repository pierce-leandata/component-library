import {
  Component,
  computed,
  contentChildren,
  effect,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core'
import { SelectItemComponent } from '@components/select/select-item/select-item'
import { SelectService } from '@components/select/select.service'

@Component({
  selector: 'pm-select-overlay',
  templateUrl: './select-overlay.html',
  styleUrl: './select-overlay.scss',
})
export class SelectOverlayComponent {
  protected selectService = inject(SelectService)

  private items = contentChildren(SelectItemComponent, { descendants: true })
  private overlayElement = viewChild<ElementRef<HTMLElement>>('overlayElement')

  positioning = computed<{ left: string; top: string }>(() => {
    const triggerRect = this.selectService.triggerRect()

    if (!triggerRect || !this.selectService.appendToBody()) {
      return {
        left: '',
        top: '',
      }
    }

    return {
      left: `${triggerRect.left}px`,
      top: `${triggerRect.y + triggerRect.height}px`,
    }
  })

  constructor() {
    effect(() => this.selectService.items.set(this.items()))
    effect(() => this.selectService.overlayElement.set(this.overlayElement()))
    effect(() => {
      const el = this.overlayElement()?.nativeElement
      if (el && this.selectService.appendToBody()) {
        document.body.appendChild(el)
      }
    })
  }

  protected clearFocusedItem() {
    this.selectService.focusedItem.set(undefined)
  }
}
