import { Component, contentChildren, effect, ElementRef, inject, viewChild } from '@angular/core'
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

  constructor() {
    effect(() => this.selectService.items.set(this.items()))
    effect(() => this.selectService.overlayElement.set(this.overlayElement()))
  }

  protected clearFocusedItem() {
    this.selectService.focusedItem.set(undefined)
  }
}
