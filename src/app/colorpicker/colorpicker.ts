import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core'

const LOCAL_STORAGE_KEY = 'pm-colorpicker-hue' as const

@Component({
  selector: 'pm-colorpicker',
  templateUrl: './colorpicker.html',
  styleUrl: './colorpicker.scss',
})
export class ColorpickerComponent {
  private destroyRef = inject(DestroyRef)

  protected hue = signal(this.getStoredOrDefaultHue())
  protected huePct = computed(() => (this.hue() / 360) * 100)

  protected isDragPicking = signal(false)
  protected isDragPickingReady = signal(false)
  protected isClickPicking = signal(false)
  protected isPointerDown = signal(false)
  protected isPicking = computed(() => this.isDragPicking() || this.isClickPicking())

  protected clipPath = computed(() => {
    if (!this.isPicking()) return ''

    const huePct = this.huePct()
    const curveStartOffset = 25
    const curveInset = 20

    return `
      shape(
        from -20% 0,
        line to ${huePct - curveStartOffset}% 0,
        curve to ${huePct}% ${curveInset}% with ${huePct - curveStartOffset / 2}% 0 / ${huePct - curveStartOffset / 2}% ${curveInset}%,
        curve to ${huePct + curveStartOffset}% 0 with ${huePct + curveStartOffset / 2}% ${curveInset}% / ${huePct + curveStartOffset / 2}% 0,
        line to 120% 0,
        line to 120% 100%,
        line to ${huePct + curveStartOffset}% 100%,
        curve to ${huePct}% ${100 - curveInset}% with ${huePct + curveStartOffset / 2}% 100% / ${huePct + curveStartOffset / 2}% ${100 - curveInset}%,
        curve to ${huePct - curveStartOffset}% 100% with ${huePct - curveStartOffset / 2}% ${100 - curveInset}% / ${huePct - curveStartOffset / 2}% 100%,
        line to -20% 100%
      )
    `
  })

  protected picker = viewChild<ElementRef<HTMLDivElement>>('picker')

  constructor() {
    afterNextRender(() => {
      const storedHue = window.localStorage.getItem(LOCAL_STORAGE_KEY)
      if (storedHue) {
        this.setHue(Number(storedHue))
      }
    })

    window.addEventListener('pointermove', this.onPointerMove.bind(this))
    window.addEventListener('pointerup', this.onPointerUp.bind(this))
    window.addEventListener('pointerdown', this.onBodyPointerDown.bind(this))
    window.addEventListener('storage', this.onStorageChange.bind(this))

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('pointermove', this.onPointerMove.bind(this))
      window.removeEventListener('pointerup', this.onPointerUp.bind(this))
      window.removeEventListener('pointerdown', this.onBodyPointerDown.bind(this))
      window.removeEventListener('storage', this.onStorageChange.bind(this))
    })
  }

  onBodyPointerDown(e: PointerEvent) {
    if (!this.picker()?.nativeElement.contains(e.target as HTMLElement)) {
      this.closePicker()
    }
  }

  onPointerDown(e: PointerEvent) {
    if (!this.isPicking()) {
      this.isDragPickingReady.set(true)
    } else if (this.isClickPicking()) {
      this.setHueFromPointerEvent(e)
    }

    this.isPointerDown.set(true)
  }

  onPointerMove(e: PointerEvent) {
    if (this.isDragPickingReady()) {
      this.isDragPickingReady.set(false)
      this.isDragPicking.set(true)
    }

    if (this.isPointerDown()) {
      this.setHueFromPointerEvent(e)
    }
  }

  onPointerUp() {
    this.isPointerDown.set(false)
    this.isDragPickingReady.set(false)

    if (this.isDragPicking()) {
      // click event fires after pointerup, and will set `isClickPicking` to `true`
      // if no longer drag picking. wait until after the click event is fired to
      // stop drag picking
      requestAnimationFrame(() => this.isDragPicking.set(false))
    }
  }

  onClick() {
    if (!this.isPicking()) {
      this.isClickPicking.set(true)
    }
  }

  closePicker() {
    this.isClickPicking.set(false)
    this.isDragPicking.set(false)
  }

  onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this.closePicker()
    } else if (['Enter', ' '].includes(e.key) && this.isClickPicking()) {
      e.preventDefault()
      this.closePicker()
    } else if (['ArrowRight', 'ArrowDown'].includes(e.key) && this.isClickPicking()) {
      e.preventDefault()
      this.setHue(this.hue() + 5)
    } else if (['ArrowLeft', 'ArrowUp'].includes(e.key) && this.isClickPicking()) {
      e.preventDefault()
      this.setHue(this.hue() - 5)
    }
  }

  private getStoredOrDefaultHue() {
    return Number(
      window.localStorage.getItem(LOCAL_STORAGE_KEY) ??
        document.documentElement.computedStyleMap().get('--primary-base-hue')?.toString(),
    )
  }

  private onStorageChange(e: StorageEvent) {
    if (e.key === LOCAL_STORAGE_KEY) {
      this.setHue(this.getStoredOrDefaultHue())
    }
  }

  private setHue(hue: number) {
    const boundHue = this.boundHue(hue)
    this.hue.set(boundHue)
    document.documentElement.style.setProperty('--primary-base-hue', `${boundHue}`)
    window.localStorage.setItem(LOCAL_STORAGE_KEY, boundHue.toString())
  }

  private setHueFromPointerEvent(e: PointerEvent) {
    const picker = this.picker()?.nativeElement
    if (picker) {
      const pickerRect = picker.getBoundingClientRect()
      const hue = ((e.x - pickerRect.left) / pickerRect.width) * 360
      this.setHue(hue)
    }
  }

  private boundHue(hue: number) {
    return Math.min(360, Math.max(0, hue))
  }
}
