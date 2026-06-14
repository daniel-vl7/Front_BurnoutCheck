import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, RegisterRequest, TokenResponse } from '../models/auth.interface';
import { User, UserDetail } from '../models/user.interface';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);
  private readonly apiUrl = `${environment.api}/auth`;

  // Signal para mantener el estado del usuario actual
  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);

  constructor() {
    // Verificar si hay token al inicializar el servicio
    if (this.tokenService.hasToken()) {
      this.isAuthenticated.set(true);
      this.loadCurrentUser();
    }
  }

  login(credentials: LoginRequest): Observable<UserDetail> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        this.tokenService.setToken(response.access_token);
        this.isAuthenticated.set(true);
      }),
      switchMap(() => this.http.get<UserDetail>(`${environment.api}/users/me`)),
      tap(user => this.currentUser.set(user))
    );
  }

  register(data: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, data);
  }

  logout(): void {
    this.tokenService.removeToken();
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  loadCurrentUser(): void {
    if (!this.tokenService.hasToken()) {
      return;
    }

    this.http.get<UserDetail>(`${environment.api}/users/me`).subscribe({
      next: (user) => {
        this.currentUser.set(user);
      },
      error: () => {
        this.logout();
      }
    });
  }
}
