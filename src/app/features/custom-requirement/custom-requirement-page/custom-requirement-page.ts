import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-custom-requirement-page',
  imports: [FormsModule],
  templateUrl: './custom-requirement-page.html',
  styleUrl: './custom-requirement-page.css'
})
export class CustomRequirementPage {

  submitted = false;

  form = {
    name: '',
    email: '',
    phone: '',
    requirementType: '',
    projectSize: '',
    preferredSize: '',
    material: '',
    colour: '',
    budget: '',
    location: '',
    details: ''
  };

  submit(): void {
    this.submitted = true;
  }
}
