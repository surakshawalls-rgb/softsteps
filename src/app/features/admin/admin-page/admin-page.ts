import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MESSAGE_TEMPLATES } from '../data/message-templates';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.css',
})
export class AdminPage {
  readonly templates = MESSAGE_TEMPLATES;
}
