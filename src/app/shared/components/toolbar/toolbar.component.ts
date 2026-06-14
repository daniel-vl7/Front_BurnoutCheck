import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.css'
})
export class ToolbarComponent {
  @Input() variant: 'public' | 'private' = 'private';

  protected readonly authService = inject(AuthService);

  private readonly allUserNavItems = [
    { label: 'INICIO', icon: 'home', route: '/home' },
    { label: 'PERFIL', icon: 'person', route: '/profile' },
    { label: 'TEST', icon: 'assignment', route: '/test/start' },
    { label: 'RESULTADOS', icon: 'bar_chart', route: '/results' },
    { label: 'RECOMENDACION', icon: 'groups', route: '/recommendation' }
  ];

  private readonly adminOnlyNavItems = [
    { label: 'PERFIL', icon: 'person', route: '/profile' },
    { label: 'DASHBOARD', icon: 'dashboard', route: '/dashboard' }
  ];

  get isAdmin(): boolean {
    return this.authService.currentUser()?.role === 'admin';
  }

  get navItems() {
    return this.isAdmin ? this.adminOnlyNavItems : this.allUserNavItems;
  }
}
