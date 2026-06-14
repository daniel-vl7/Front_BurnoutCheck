import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserDetail, UserUpdateRequest, ChangePasswordRequest } from '../models/user.interface';
import { BurnoutStats, UserTestReport } from '../models/test.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.api}/users`;

  getProfile(): Observable<UserDetail> {
    return this.http.get<UserDetail>(`${this.apiUrl}/me`).pipe(
      tap(user => {
        this.authService.currentUser.set(user);
      })
    );
  }

  updateProfile(data: UserUpdateRequest): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/me`, data).pipe(
      tap(user => {
        this.authService.currentUser.set(user);
      })
    );
  }

  changePassword(data: ChangePasswordRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/me/change-password`, data);
  }

  getUsers(skip = 0, limit = 20): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl, { params: { skip, limit } });
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}`);
  }

  getBurnoutStats(): Observable<BurnoutStats> {
    return this.http.get<BurnoutStats>(`${this.apiUrl}/stats/burnout`);
  }

  getTestsReport(dateFrom?: string, dateTo?: string): Observable<UserTestReport[]> {
    const params: Record<string, string> = {};
    if (dateFrom) params['date_from'] = dateFrom;
    if (dateTo) params['date_to'] = dateTo;
    return this.http.get<UserTestReport[]>(`${this.apiUrl}/reports/tests`, { params });
  }
}
