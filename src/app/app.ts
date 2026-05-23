import { Component, signal } from '@angular/core'
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
}
