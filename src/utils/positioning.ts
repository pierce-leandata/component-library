import { OffsetSize } from './sizing'

export type Alignment = 'start' | 'center' | 'end'
export type Side = 'top' | 'left' | 'bottom' | 'right'
export type VerticalSide = 'top' | 'bottom'
export interface OverlayPosition<S extends Side = Side> {
  left: string
  top: string
  position: 'absolute' | 'fixed'
  computedSide: S
}

/**
 * Calculate the position an overlay should be placed to fit within the screen given
 * positioning options
 */
export function getOverlayPosition({
  anchorRect,
  wrapperRect,
  overlaySize,
  align,
  side,
  sideOffset = 0,
  appendToBody = false,
  boundingElement,
}: {
  /**
   * The DOMRect for the element this overlay is anchored to.
   */
  anchorRect: DOMRect
  /**
   * The DOMRect for the containing block element (usually an element with `position: relative`)
   * wrapping the anchor and overlay elements.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Display/Containing_block#identifying_the_containing_block
   */
  wrapperRect: DOMRect
  /**
   * The offset width and height of the overlay.
   */
  overlaySize: OffsetSize
  /**
   * How to align the overlay relative to the anchor.
   * The overlay will be kept within the bounds of the window and bounding element
   * (if provided).
   */
  align: Alignment
  /**
   * Which side of the anchor to place the overlay.
   * If there is no room on the chosen side of the overlay and the opposite side has
   * more space, the opposite side will be used and reflected in the `computedSide`
   * returned by this function.
   */
  side: VerticalSide
  /**
   * Additional space between anchor and the overlay.
   *
   * @default 0
   */
  sideOffset?: number
  /**
   * Whether to reparent the overlay onto the `body`.
   */
  appendToBody?: boolean
  /**
   * What element to use as the bounds of the overlay.
   * If not provided, the overlay will be kept on-screen when possible.
   */
  boundingElement?: HTMLElement
}): OverlayPosition<VerticalSide> {
  // origin for the positioning = viewport when appended to body,
  // wrapper otherwise. subtracting the wrapper's rect makes the
  // calculations transform-aware since both rects are post-transform.
  const originLeft = appendToBody ? 0 : (wrapperRect?.left ?? 0)
  const originTop = appendToBody ? 0 : (wrapperRect?.top ?? 0)
  const anchorLeftOffset = anchorRect.left - originLeft
  const anchorTopOffset = anchorRect.top - originTop
  const anchorWidth = anchorRect.width
  const anchorHeight = anchorRect.height
  const overlayWidth = overlaySize?.width ?? 0
  const overlayHeight = overlaySize?.height ?? 0
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight

  const getLeftOffset = (align: 'start' | 'center' | 'end') => {
    if (align === 'start') {
      return anchorLeftOffset
    } else if (align === 'center') {
      return anchorLeftOffset + anchorWidth / 2 - overlayWidth / 2
    } else {
      return anchorLeftOffset + (anchorWidth - overlayWidth)
    }
  }

  const getTopOffset = (side: 'top' | 'bottom') => {
    if (side === 'top') {
      return anchorTopOffset - overlayHeight - sideOffset
    } else {
      return anchorTopOffset + anchorHeight + sideOffset
    }
  }

  const getLeftOffsetWithinBounds = () => {
    const offsetToTry = getLeftOffset(align)
    const availableWidth = boundingElement?.offsetWidth ?? windowWidth
    const boundingElementLeft = boundingElement?.offsetLeft ?? 0

    return Math.min(
      boundingElementLeft + availableWidth - overlayWidth - originLeft,
      Math.max(boundingElementLeft - originLeft, offsetToTry),
    )
  }

  const isFlippedSide = () => {
    const offsetToTry = getTopOffset(side)

    const boundingElementRect = boundingElement?.getBoundingClientRect()
    const availableHeight = boundingElementRect?.height ?? windowHeight
    const boundsTop = boundingElementRect?.top ?? 0

    const isAboveBounds = originTop + offsetToTry < boundsTop
    const isBelowBounds = originTop + offsetToTry + overlayHeight > availableHeight + boundsTop
    const spaceAboveAnchor = anchorRect.top - boundsTop
    const spaceBelowAnchor = boundsTop + availableHeight - anchorRect.bottom

    if (side === 'top' && isAboveBounds && spaceBelowAnchor > spaceAboveAnchor) {
      return true
    }

    if (side === 'bottom' && isBelowBounds && spaceAboveAnchor > spaceBelowAnchor) {
      return true
    }

    return false
  }

  const isFlipped = isFlippedSide()

  const getComputedSide = (): VerticalSide => {
    if (side === 'top' && isFlipped) return 'bottom'
    if (side === 'bottom' && isFlipped) return 'top'

    return side
  }

  const computedSide = getComputedSide()

  const getTopOffsetWithinBounds = () => {
    return getTopOffset(computedSide)
  }

  return {
    left: `${getLeftOffsetWithinBounds()}px`,
    top: `${getTopOffsetWithinBounds()}px`,
    position: appendToBody ? 'fixed' : 'absolute',
    computedSide,
  }
}
