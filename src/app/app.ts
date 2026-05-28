import { Component, computed, signal } from '@angular/core'
import { SelectOverlayComponent } from '@components/select/select-overlay/select-overlay'
import { SelectComponent } from '@components/select/select/select'
import { SelectTriggerDirective } from '@components/select/select-trigger/select-trigger'
import { SelectItemDirective } from '@components/select/select-item/select-item'
import { SelectValueComponent } from '@components/select/select-value/select-value'
import { SelectTriggerIconDirective } from '@components/select/select-trigger-icon/select-trigger-icon'

@Component({
  selector: 'pm-app-root',
  imports: [
    SelectComponent,
    SelectOverlayComponent,
    SelectTriggerDirective,
    SelectTriggerIconDirective,
    SelectItemDirective,
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
    { label: 'Apricot', value: 'apricot' },
    { label: 'Avocado', value: 'avocado' },
    { label: 'Banana', value: 'banana' },
    { label: 'Blackberry', value: 'blackberry' },
    { label: 'Blueberry', value: 'blueberry' },
    { label: 'Cantaloupe', value: 'cantaloupe' },
    { label: 'Cherry', value: 'cherry' },
    { label: 'Coconut', value: 'coconut' },
    { label: 'Cranberry', value: 'cranberry' },
    { label: 'Date', value: 'date' },
    { label: 'Dragon Fruit', value: 'dragon-fruit' },
    { label: 'Durian', value: 'durian' },
    { label: 'Elderberry', value: 'elderberry' },
    { label: 'Fig', value: 'fig' },
    { label: 'Grape', value: 'grape' },
    { label: 'Grapefruit', value: 'grapefruit' },
    { label: 'Guava', value: 'guava' },
    { label: 'Honeydew', value: 'honeydew' },
    { label: 'Iceberg Lettuce', value: 'iceberg-lettuce' },
    { label: 'Jackfruit', value: 'jackfruit' },
    { label: 'Kiwi', value: 'kiwi' },
    { label: 'Kumquat', value: 'kumquat' },
    { label: 'Lemon', value: 'lemon' },
    { label: 'Lime', value: 'lime' },
    { label: 'Lychee', value: 'lychee' },
    { label: 'Mango', value: 'mango' },
    { label: 'Melon', value: 'melon' },
    { label: 'Nectarine', value: 'nectarine' },
    { label: 'Orange', value: 'orange' },
    { label: 'Papaya', value: 'papaya' },
    { label: 'Passion Fruit', value: 'passion-fruit' },
    { label: 'Peach', value: 'peach' },
    { label: 'Pear', value: 'pear' },
    { label: 'Persimmon', value: 'persimmon' },
    { label: 'Pineapple', value: 'pineapple' },
    { label: 'Plum', value: 'plum' },
    { label: 'Pomegranate', value: 'pomegranate' },
    { label: 'Quince', value: 'quince' },
    { label: 'Raspberry', value: 'raspberry' },
    { label: 'Rhubarb', value: 'rhubarb' },
    { label: 'Strawberry', value: 'strawberry' },
    { label: 'Starfruit', value: 'starfruit' },
    { label: 'Tangerine', value: 'tangerine' },
    { label: 'Tomato', value: 'tomato' },
  ].sort(() => Math.random() - 0.5)
}
