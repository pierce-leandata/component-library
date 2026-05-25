import { effect, ElementRef, signal, Signal } from '@angular/core'

type DOMRectWithoutToJSON = Omit<DOMRect, 'toJSON'>

export interface OffsetSize {
  width: number
  height: number
}

/**
 * Reactively track an element's `offsetWidth` and `offsetHeight`.
 *
 * These values ignore CSS transforms, making them suitable for positioning
 * calculations that should not be affected by transitions like `scale`.
 *
 * Updates are driven by `ResizeObserver`.
 *
 * @param element signal for an element ref
 * @returns up-to-date offset size signal
 */
export function trackOffsetSize(
  element: Signal<ElementRef<HTMLElement> | undefined>,
): Signal<OffsetSize | null> {
  const size = signal<OffsetSize | null>(null)

  effect((onCleanup) => {
    const el = element()?.nativeElement
    if (!el) {
      return
    }

    const update = () => {
      size.set({ width: el.offsetWidth, height: el.offsetHeight })
    }

    update()

    const observer = new ResizeObserver(update)
    observer.observe(el)

    onCleanup(() => observer.disconnect())
  })

  return size.asReadonly()
}

/**
 * Get an up-to-date reference to the DOMRect of an element, listening
 * only to changes in properties you specify.
 *
 * DOMRect properties are not guaranteed to be up-to-date if they are not
 * explicitly provided in `options.listenTo`
 *
 * @param element signal for an element ref
 * @returns up-to-date DOMRect signal
 */
export function trackBoundingRect(
  element: Signal<ElementRef<HTMLElement> | undefined>,
  options: {
    /**
     * Which properties of the DOMRect to listen for changes in
     * Must be provided, so the DOMRect signal is only updated when the
     * values you care about are updated
     */
    listenTo: Partial<Record<keyof DOMRectWithoutToJSON, boolean>>
  },
) {
  const rect = signal<DOMRect | null>(null)

  effect((onCleanup) => {
    if (!element()?.nativeElement) {
      return
    }

    let animationId: number

    const updateRect = () => {
      const newRect = element()!.nativeElement.getBoundingClientRect()

      const previousRect = rect()
      const hasValueChanged =
        !previousRect ||
        (Object.keys(options.listenTo) as (keyof DOMRectWithoutToJSON)[]).some(
          (key) => options.listenTo[key] && previousRect[key] !== newRect[key],
        )

      if (hasValueChanged) {
        rect.set(newRect)
      }

      animationId = self.requestAnimationFrame(updateRect)
    }

    updateRect()

    onCleanup(() => {
      self.cancelAnimationFrame(animationId)
    })
  })

  return rect.asReadonly()
}
