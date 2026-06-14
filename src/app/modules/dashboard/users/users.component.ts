import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.interface';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);

  users = signal<User[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  deletingId = signal<number | null>(null);
  confirmDeleteId = signal<number | null>(null);
  currentPage = signal(1);

  readonly currentUserId = computed(() => this.authService.currentUser()?.id);
  readonly totalPages = computed(() => Math.ceil(this.users().length / PAGE_SIZE));
  readonly pagedUsers = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.users().slice(start, start + PAGE_SIZE);
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.userService.getUsers(0, 100).subscribe({
      next: (users) => {
        this.users.set(users);
        this.currentPage.set(1);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Error al cargar los usuarios.');
        this.isLoading.set(false);
      }
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  requestDelete(userId: number): void {
    this.confirmDeleteId.set(userId);
  }

  cancelDelete(): void {
    this.confirmDeleteId.set(null);
  }

  confirmDelete(userId: number): void {
    this.deletingId.set(userId);
    this.confirmDeleteId.set(null);

    this.userService.deleteUser(userId).subscribe({
      next: () => {
        this.users.update(list => list.filter(u => u.id !== userId));
        // Ajustar página si quedó vacía
        const newTotal = Math.ceil((this.users().length) / PAGE_SIZE);
        if (this.currentPage() > newTotal) this.currentPage.set(Math.max(1, newTotal));
        this.deletingId.set(null);
      },
      error: () => {
        this.errorMessage.set('Error al eliminar el usuario.');
        this.deletingId.set(null);
      }
    });
  }
}
