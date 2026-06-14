import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../core/services/user.service';
import { UserTestReport } from '../../../core/models/test.interface';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './historial.component.html',
  styleUrl: './historial.component.css'
})
export class HistorialComponent implements OnInit {
  private readonly userService = inject(UserService);

  testReports = signal<UserTestReport[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  dateFrom = signal('');
  dateTo = signal('');
  currentPage = signal(1);
  expandedIds = signal<Set<number>>(new Set());

  readonly totalPages = computed(() => Math.ceil(this.testReports().length / PAGE_SIZE));
  readonly pagedReports = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.testReports().slice(start, start + PAGE_SIZE);
  });

  ngOnInit(): void {
    this.loadTests();
  }

  loadTests(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.expandedIds.set(new Set());

    this.userService.getTestsReport(
      this.dateFrom() || undefined,
      this.dateTo() || undefined
    ).subscribe({
      next: (reports) => {
        const filtered = reports
          .map(u => ({ ...u, tests: u.tests.filter(t => t.prediction && t.probability != null) }))
          .filter(u => u.tests.length > 0);
        this.testReports.set(filtered);
        this.currentPage.set(1);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Error al cargar el historial.');
        this.isLoading.set(false);
      }
    });
  }

  clearFilter(): void {
    this.dateFrom.set('');
    this.dateTo.set('');
    this.loadTests();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  toggleExpand(userId: number): void {
    this.expandedIds.update(set => {
      const next = new Set(set);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  }

  isExpanded(userId: number): boolean {
    return this.expandedIds().has(userId);
  }
}
