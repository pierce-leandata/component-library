import { Component, computed, signal } from '@angular/core'
import { SelectOverlayComponent } from '@components/select/select-overlay/select-overlay'
import { SelectComponent } from '@components/select/select/select'
import { SelectTriggerDirective } from '@components/select/select-trigger/select-trigger'
import { SelectItemComponent } from '@components/select/select-item/select-item'
import { SelectValueComponent } from '@components/select/select-value/select-value'
import { SelectTriggerIconDirective } from '@components/select/select-trigger-icon/select-trigger-icon'

@Component({
  selector: 'pm-app-root',
  imports: [
    SelectComponent,
    SelectOverlayComponent,
    SelectTriggerDirective,
    SelectTriggerIconDirective,
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

  protected sideOffset = signal(0)

  protected triggerTransform = computed(
    () => `translate(${this.translateX()}px, ${this.translateY()}px)`,
  )

  protected readonly options: { label: string; value: string }[] = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
    { label: 'Date', value: 'date' },
    { label: 'Elderberry', value: 'elderberry' },
    { label: 'Fig', value: 'fig' },
    { label: 'Grape', value: 'grape' },
    { label: 'Honeydew', value: 'honeydew' },
    { label: 'Iceberg Lettuce', value: 'iceberg-lettuce' },
    { label: 'Jackfruit', value: 'jackfruit' },
    { label: 'Kiwi', value: 'kiwi' },
    { label: 'Lemon', value: 'lemon' },
    { label: 'Mango', value: 'mango' },
    { label: 'Nectarine', value: 'nectarine' },
    { label: 'Orange', value: 'orange' },
    { label: 'Papaya', value: 'papaya' },
    { label: 'Quince', value: 'quince' },
    { label: 'Raspberry', value: 'raspberry' },
    { label: 'Strawberry', value: 'strawberry' },
    { label: 'Tangerine', value: 'tangerine' },
  ]
}
