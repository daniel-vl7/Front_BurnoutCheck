import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TestService } from './test.service';
import { environment } from '../../../environments/environment';
import { Recommendation, TestResult } from '../models/test.interface';

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {
  private readonly http = inject(HttpClient);
  private readonly testService = inject(TestService);
  private readonly apiUrl = `${environment.api}/tests`;

  readonly recommendations = signal<Recommendation[]>([]);
  readonly hasRecommendations = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly hasError = signal<boolean>(false);

  getLastTestRecommendations(): Observable<Recommendation[]> {
    return new Observable<Recommendation[]>(observer => {
      this.isLoading.set(true);
      this.hasError.set(false);

      this.testService.getMyTests().subscribe({
        next: (tests) => {
          if (tests.length === 0) {
            this.recommendations.set([]);
            this.hasRecommendations.set(false);
            this.isLoading.set(false);
            observer.next([]);
            observer.complete();
            return;
          }

          const lastTest = tests
            .filter(test => test.status === 'completed')
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

          if (!lastTest) {
            this.recommendations.set([]);
            this.hasRecommendations.set(false);
            this.isLoading.set(false);
            observer.next([]);
            observer.complete();
            return;
          }

          this.testService.getTestResult(lastTest.id).subscribe({
            next: (result: TestResult) => {
              const recs = result.recommendations || [];
              this.recommendations.set(recs);
              this.hasRecommendations.set(recs.length > 0);
              this.isLoading.set(false);
              observer.next(recs);
              observer.complete();
            },
            error: (error) => {
              this.recommendations.set([]);
              this.hasRecommendations.set(false);
              this.isLoading.set(false);
              this.hasError.set(true);
              observer.error(error);
            }
          });
        },
        error: (error) => {
          this.recommendations.set([]);
          this.hasRecommendations.set(false);
          this.isLoading.set(false);
          this.hasError.set(true);
          observer.error(error);
        }
      });
    });
  }

  retryFetch(): Observable<Recommendation[]> {
    this.hasError.set(false);
    return this.getLastTestRecommendations();
  }
}
