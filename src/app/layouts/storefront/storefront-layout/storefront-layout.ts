import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteHeader } from '../../../shared/components/site-header/site-header';
import { SiteFooter } from '../../../shared/components/site-footer/site-footer';

@Component({
  selector: 'app-storefront-layout',
  imports: [RouterOutlet, SiteHeader, SiteFooter],
  templateUrl: './storefront-layout.html',
  styleUrl: './storefront-layout.css',
})
export class StorefrontLayout {

}
