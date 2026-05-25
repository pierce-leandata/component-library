import {
  Component,
  computed,
  contentChildren,
  effect,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core'
import { SelectItemComponent } from '@components/select/select-item/select-item'
import { SelectService } from '@components/select/select.service'
import { trackOffsetSize } from '@utils/sizing'

@Component({
  selector: 'pm-select-overlay',
  templateUrl: './select-overlay.html',
  styleUrl: './select-overlay.scss',
})
export class SelectOverlayComponent {
  align = input<'start' | 'center' | 'end'>('center')
  side = input<'top' | 'bottom'>('bottom')

  protected selectService = inject(SelectService)

  private items = contentChildren(SelectItemComponent, { descendants: true })
  private overlayElement = viewChild<ElementRef<HTMLElement>>('overlayElement')
  // use the overlay element's offset size for calculations. these values
  // ignore CSS transforms, so the user can use transforms without breaking
  // the positioning
  private overlaySize = trackOffsetSize(this.overlayElement)

  positioning = computed<Record<string, string | undefined>>(() => {
    // use the `getBoundingClientRect` reference of the trigger because we
    // want to attach to the trigger no matter how it got to where it is
    const triggerRect = this.selectService.triggerRect()
    const overlaySize = this.overlaySize()
    const appendToBody = this.selectService.appendToBody()
    const align = this.align()
    const side = this.side()

    if (!triggerRect) {
      return {
        left: '',
        top: '',
      }
    }

    const getX = () => {
      const overlayWidth = overlaySize?.width ?? 0
      const triggerWidth = triggerRect?.width ?? 0
      if (appendToBody) {
        const triggerLeft = triggerRect?.left ?? 0
        if (align === 'start') {
          return { left: `${triggerLeft}px` }
        } else if (align === 'center') {
          return { left: `${triggerLeft + triggerWidth / 2 - overlayWidth / 2}px` }
        } else {
          return { left: `${triggerLeft + (triggerWidth - overlayWidth)}px` }
        }
      } else {
        if (align === 'start') {
          return { left: '0px' }
        } else if (align === 'center') {
          return { left: `${triggerWidth / 2 - overlayWidth / 2}px` }
        } else {
          return { right: '0px' }
        }
      }
    }

    const getY = () => {
      if (appendToBody) {
        const triggerTop = triggerRect?.top ?? 0
        const triggerHeight = triggerRect?.height ?? 0
        const overlayHeight = overlaySize?.height ?? 0

        if (side === 'top') {
          return { top: `${triggerTop - overlayHeight}px` }
        } else {
          return { top: `${triggerTop + triggerHeight}px` }
        }
      } else {
        if (side === 'top') {
          return { bottom: '100%' }
        } else {
          return { top: '100%' }
        }
      }
    }

    return {
      ...getX(),
      ...getY(),
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
