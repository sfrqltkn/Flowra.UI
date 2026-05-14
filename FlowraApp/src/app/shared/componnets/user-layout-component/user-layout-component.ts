import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-user-layout-component',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './user-layout-component.html',
  styleUrl: './user-layout-component.scss',
})
export class UserLayoutComponent {

}
