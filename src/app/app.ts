import { Component, computed, signal } from '@angular/core'
import { SelectOverlayComponent } from '@components/select/select-overlay/select-overlay'
import { SelectComponent } from '@components/select/select/select'
import { SelectTriggerDirective } from '@components/select/select-trigger/select-trigger'
import { SelectItemDirective } from '@components/select/select-item/select-item'
import { SelectItemGroupDirective } from '@components/select/select-item-group/select-item-group'
import { SelectItemGroupLabelDirective } from '@components/select/select-item-group-label/select-item-group-label'
import { SelectValueComponent } from '@components/select/select-value/select-value'
import { SelectTriggerIconDirective } from '@components/select/select-trigger-icon/select-trigger-icon'
import { NgTemplateOutlet } from '@angular/common'

@Component({
  selector: 'pm-app-root',
  imports: [
    SelectComponent,
    SelectOverlayComponent,
    SelectTriggerDirective,
    SelectTriggerIconDirective,
    SelectItemDirective,
    SelectItemGroupDirective,
    SelectItemGroupLabelDirective,
    SelectValueComponent,
    NgTemplateOutlet,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: {
    '[class.use-trigger-width]': 'useTriggerWidth()',
  },
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

  protected useTriggerWidth = signal(false)

  protected appendToBody = signal(false)
  protected useBoundingElement = signal(false)

  protected triggerTransform = computed(
    () => `translate(${this.translateX()}px, ${this.translateY()}px)`,
  )

  protected readonly optionGroups: {
    name: string
    options: { label: string; value: string }[]
  }[] = [
    {
      name: 'Berries',
      options: [
        { label: 'Blackberry', value: 'blackberry' },
        { label: 'Blueberry', value: 'blueberry' },
        { label: 'Cranberry', value: 'cranberry' },
        { label: 'Elderberry', value: 'elderberry' },
        { label: 'Raspberry', value: 'raspberry' },
        { label: 'Strawberry', value: 'strawberry' },
      ],
    },
    {
      name: 'Citrus',
      options: [
        { label: 'Grapefruit', value: 'grapefruit' },
        { label: 'Kumquat', value: 'kumquat' },
        { label: 'Lemon', value: 'lemon' },
        { label: 'Lime', value: 'lime' },
        { label: 'Orange', value: 'orange' },
        { label: 'Tangerine', value: 'tangerine' },
      ],
    },
    {
      name: 'Stone Fruits',
      options: [
        { label: 'Apricot', value: 'apricot' },
        { label: 'Cherry', value: 'cherry' },
        { label: 'Date', value: 'date' },
        { label: 'Nectarine', value: 'nectarine' },
        { label: 'Peach', value: 'peach' },
        { label: 'Plum', value: 'plum' },
      ],
    },
    {
      name: 'Tropical',
      options: [
        { label: 'Banana', value: 'banana' },
        { label: 'Coconut', value: 'coconut' },
        { label: 'Dragon Fruit', value: 'dragon-fruit' },
        { label: 'Durian', value: 'durian' },
        { label: 'Guava', value: 'guava' },
        { label: 'Jackfruit', value: 'jackfruit' },
        { label: 'Lychee', value: 'lychee' },
        { label: 'Mango', value: 'mango' },
        { label: 'Papaya', value: 'papaya' },
        { label: 'Passion Fruit', value: 'passion-fruit' },
        { label: 'Pineapple', value: 'pineapple' },
        { label: 'Starfruit', value: 'starfruit' },
      ],
    },
    {
      name: 'Melons',
      options: [
        { label: 'Cantaloupe', value: 'cantaloupe' },
        { label: 'Honeydew', value: 'honeydew' },
        { label: 'Melon', value: 'melon' },
      ],
    },
    {
      name: 'Other',
      options: [
        { label: 'Apple', value: 'apple' },
        { label: 'Avocado', value: 'avocado' },
        { label: 'Fig', value: 'fig' },
        { label: 'Grape', value: 'grape' },
        { label: 'Iceberg Lettuce', value: 'iceberg-lettuce' },
        { label: 'Kiwi', value: 'kiwi' },
        { label: 'Pear', value: 'pear' },
        { label: 'Persimmon', value: 'persimmon' },
        { label: 'Pomegranate', value: 'pomegranate' },
        { label: 'Quince', value: 'quince' },
        { label: 'Rhubarb', value: 'rhubarb' },
        { label: 'Tomato', value: 'tomato' },
      ],
    },
  ]
}
