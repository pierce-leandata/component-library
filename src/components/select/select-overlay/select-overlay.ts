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
   *
   * @default 'center'
   */
  align = input<'start' | 'center' | 'end'>('center')
  /**
   * Which side of the trigger to place the overlay
   * If there is no room on the chosen side of the overlay and the opposite side has
   * more space, the opposite side will be used
   *
   * @default 'bottom'
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
    const triggerLeftOffset = triggerRect.left - originLeft
    const triggerTopOffset = triggerRect.top - originTop
    const triggerWidth = triggerRect.width
    const triggerHeight = triggerRect.height
    const overlayWidth = overlaySize?.width ?? 0
    const overlayHeight = overlaySize?.height ?? 0

    const getLeftOffset = (align: 'start' | 'center' | 'end') => {
      if (align === 'start') {
        return triggerLeftOffset
      } else if (align === 'center') {
        return triggerLeftOffset + triggerWidth / 2 - overlayWidth / 2
      } else {
        return triggerLeftOffset + (triggerWidth - overlayWidth)
      }
    }

    const getTopOffset = (side: 'top' | 'bottom') => {
      if (side === 'top') {
        return triggerTopOffset - overlayHeight
      } else {
        return triggerTopOffset + triggerHeight
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
      const spaceAboveTrigger = triggerRect.top
      const spaceBelowTrigger = availableHeight - triggerRect.bottom

      console.log(spaceAboveTrigger, spaceBelowTrigger)

      if (side === 'top' && isAboveWindow && spaceBelowTrigger > spaceAboveTrigger)
        return getTopOffset('bottom')
      if (side === 'bottom' && isBelowWindow && spaceAboveTrigger > spaceBelowTrigger)
        return getTopOffset('top')

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
