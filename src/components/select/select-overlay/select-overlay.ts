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
  /**
   * How to align the overlay relative to the trigger
   * The overlay will be kept within the bounds of the window if the chosen alignment
   * would cause the overlay to go off-screen
   */
  align = input<'start' | 'center' | 'end'>('center')
  /**
   * Which side of the trigger to place the overlay
   * If there is no room on the chosen side of the overlay, the opposite side will be used
   */
  side = input<'top' | 'bottom'>('bottom')

  protected selectService = inject(SelectService)

  private items = contentChildren(SelectItemComponent, { descendants: true })
  private overlayElement = viewChild<ElementRef<HTMLElement>>('overlayElement')
  // use the overlay element's offset size for calculations. these values
  // ignore CSS transforms, so the user can use transforms without breaking
  // the positioning
  private overlaySize = trackOffsetSize(this.overlayElement)

  positioning = computed<{ left: string; top: string }>(() => {
    // use the `getBoundingClientRect` reference of the trigger because we
    // want to attach to the trigger no matter how it got to where it is
    const triggerRect = this.selectService.triggerRect()
    const wrapperRect = this.selectService.wrapperRect()
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

    // origin for the positioning = viewport when appended to body,
    // wrapper otherwise. subtracting the wrapper's rect makes the
    // calculations transform-aware since both rects are post-transform.
    const originLeft = appendToBody ? 0 : (wrapperRect?.left ?? 0)
    const originTop = appendToBody ? 0 : (wrapperRect?.top ?? 0)
    const triggerLeft = triggerRect.left - originLeft
    const triggerTop = triggerRect.top - originTop
    const triggerWidth = triggerRect.width
    const triggerHeight = triggerRect.height
    const overlayWidth = overlaySize?.width ?? 0
    const overlayHeight = overlaySize?.height ?? 0

    const getLeftOffset = (align: 'start' | 'center' | 'end') => {
      if (align === 'start') {
        return triggerLeft
      } else if (align === 'center') {
        return triggerLeft + triggerWidth / 2 - overlayWidth / 2
      } else {
        return triggerLeft + (triggerWidth - overlayWidth)
      }
    }

    const getTopOffset = (side: 'top' | 'bottom') => {
      if (side === 'top') {
        return triggerTop - overlayHeight
      } else {
        return triggerTop + triggerHeight
      }
    }

    const getLeftOffsetWithinWindow = () => {
      const offsetToTry = getLeftOffset(align)
      const availableWidth = document.documentElement.clientWidth

      return Math.min(
        availableWidth - originLeft - overlayWidth,
        Math.max(-1 * originLeft, offsetToTry),
      )
    }

    const getTopOffsetWithinWindow = () => {
      const offsetToTry = getTopOffset(side)

      const availableHeight = document.documentElement.clientHeight
      const isAboveWindow = offsetToTry + originTop < 0
      const isBelowWindow = offsetToTry + originTop + overlayHeight > availableHeight

      if (side === 'top' && isAboveWindow) return getTopOffset('bottom')
      if (side === 'bottom' && isBelowWindow) return getTopOffset('top')

      return offsetToTry
    }

    return {
      left: `${getLeftOffsetWithinWindow()}px`,
      top: `${getTopOffsetWithinWindow()}px`,
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
