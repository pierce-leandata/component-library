import { Component, computed, signal } from '@angular/core'
import { SelectOverlayComponent } from '@components/select/select-overlay/select-overlay'
import { SelectComponent } from '@components/select/select/select'
import { SelectTriggerDirective } from '@components/select/select-trigger/select-trigger'
import { SelectItemComponent } from '@components/select/select-item/select-item'
import { SelectValueComponent } from '@components/select/select-value/select-value'

@Component({
  selector: 'pm-app-root',
  imports: [
    SelectComponent,
    SelectOverlayComponent,
    SelectTriggerDirective,
    SelectItemComponent,
    SelectValueComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('test')

  protected align = signal<'start' | 'center' | 'end'>('center')
  protected side = signal<'top' | 'bottom'>('bottom')

  protected readonly alignOptions = ['start', 'center', 'end'] as const
  protected readonly sideOptions = ['top', 'bottom'] as const

  protected translateX = signal(0)
  protected translateY = signal(0)

  protected triggerTransform = computed(
    () => `translate(${this.translateX()}px, ${this.translateY()}px)`,
  )
}
