import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-contact-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './contact-page.html',
  styleUrl: './contact-page.css'
})
export class ContactPage {

  submitted = false;

  form = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  };

  submit(): void {
    this.submitted = true;
  }
}
