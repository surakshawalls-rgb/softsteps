import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-access-denied',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-access-denied.html',
  styleUrl: './admin-access-denied.css',
})
export class AdminAccessDeniedPage {
  readonly membershipVerificationFailed: boolean;

  constructor(route: ActivatedRoute) {
    this.membershipVerificationFailed = route.snapshot.queryParamMap.get('reason') === 'verification';
  }
}
