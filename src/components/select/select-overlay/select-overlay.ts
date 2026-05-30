import {
  computed,
  contentChildren,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core'
import { SelectService } from '@components/select/select.service'
import { trackOffsetSize } from '@utils/sizing'
import { SelectItemDirective } from '../select-item/select-item'
import { Alignment, getOverlayPosition, OverlayPosition, VerticalSide } from '@utils/positioning'

@Component({
  selector: 'pm-select-overlay',
  templateUrl: './select-overlay.html',
})
export class SelectOverlayComponent {
  /**
   * How to align the overlay relative to the trigger.
   * The overlay will be kept within the bounds of the window and bounding element
   * (if provided).
   *
   * @default 'center'
   */
  align = input<Alignment>('center')
  /**
   * Which side of the trigger to place the overlay.
   * If there is no room on the chosen side of the overlay and the opposite side has
   * more space, the opposite side will be used.
   *
   * @default 'bottom'
   */
  side = input<VerticalSide>('bottom')
  /**
   * Additional space between trigger and the overlay.
   *
   * @default 0
   */
  sideOffset = input(0)
  /**
   * What element to use as the bounds of the overlay.
   * If not provided, the overlay will be kept on-screen when possible.
   */
  boundingElement = input<HTMLElement>()
  /**
   * Whether to reparent the overlay onto the `body`.
   */
  appendToBody = input<boolean>(false)

  protected selectService = inject(SelectService)

  private items = contentChildren(SelectItemDirective, { descendants: true })
  private overlayElement = viewChild<ElementRef<HTMLElement>>('overlayElement')
  // use the overlay element's offset size for calculations. these values
  // ignore CSS transforms, so the user can use transforms without breaking
  // the positioning
  private overlaySize = trackOffsetSize(this.overlayElement)

  positioning = computed<OverlayPosition<VerticalSide>>(() => {
    // use the `getBoundingClientRect` reference of the trigger because we
    // want to attach to the trigger no matter how it got to where it is
    const triggerRect = this.selectService.triggerRect()
    const wrapperRect = this.selectService.wrapperRect()
    const overlaySize = this.overlaySize()
    const appendToBody = this.appendToBody()
    const align = this.align()
    const side = this.side()
    const sideOffset = this.sideOffset()
    const boundingElement = this.boundingElement()

    if (!triggerRect || !wrapperRect || !overlaySize) {
      return {
        left: '',
        top: '',
        position: 'absolute',
        computedSide: side,
      }
    }

    return getOverlayPosition({
      anchorRect: triggerRect,
      wrapperRect,
      overlaySize,
      align,
      side,
      sideOffset,
      appendToBody,
      boundingElement,
    })
  })

  constructor() {
    effect(() => this.selectService.items.set(this.items()))
    effect(() => this.selectService.overlayElement.set(this.overlayElement()))
    effect(() => {
      const el = this.overlayElement()?.nativeElement
      if (el && this.appendToBody()) {
        document.body.appendChild(el)
      }
    })
  }
}
