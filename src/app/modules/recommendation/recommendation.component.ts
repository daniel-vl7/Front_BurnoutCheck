import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { RecommendationService } from '../../core/services/recommendation.service';
import { RecommendationCardComponent } from '../../shared/components/recommendation-card/recommendation-card.component';
import { Recommendation } from '../../core/models/test.interface';

@Component({
  selector: 'app-recommendation',
  standalone: true,
  imports: [CommonModule, RecommendationCardComponent],
  templateUrl: './recommendation.component.html',
  styleUrl: './recommendation.component.scss'
})
export class RecommendationComponent implements OnInit {
  private readonly recommendationService = inject(RecommendationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  recommendations = signal<Recommendation[]>([]);
  errorMessage = signal<string>('');

  readonly isLoading = computed(() => this.recommendationService.isLoading());
  readonly hasError = computed(() => this.recommendationService.hasError());

  ngOnInit(): void {
    this.loadRecommendations();
  }

  private loadRecommendations(): void {
    this.subscribeToFetch(this.recommendationService.getLastTestRecommendations());
  }

  retry(): void {
    this.errorMessage.set('');
    this.subscribeToFetch(this.recommendationService.retryFetch());
  }

  private subscribeToFetch(observable: Observable<Recommendation[]>): void {
    observable
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (recommendations) => {
          this.recommendations.set(recommendations);
          this.errorMessage.set('');
        },
        error: (error) => {
          console.error('Error al cargar recomendaciones:', error);
          this.errorMessage.set('Error al cargar las recomendaciones. Por favor, inténtalo de nuevo.');
        }
      });
  }

  goToTest(): void {
    this.router.navigate(['/test/start']);
  }

  goToHome(): void {
    this.router.navigate(['/home']);
  }
}
