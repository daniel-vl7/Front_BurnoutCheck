import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../core/services/user.service';
import { UserTestReport, BurnoutStats } from '../../../core/models/test.interface';

type FlatRow = {
  genero: string;
  facultad: string;
  practicasprepro: string;
  prediction: string;
};

type GroupedBar = { label: string; si: number; no: number };

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, NgTemplateOutlet, RouterLink, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent implements OnInit {
  private readonly userService = inject(UserService);

  reports = signal<UserTestReport[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');

  burnoutStats = signal<BurnoutStats | null>(null);
  isLoadingStats = signal(false);
  statsError = signal('');

  readonly pieSlices = computed(() => {
    const stats = this.burnoutStats();
    if (!stats || stats.total_completed_tests === 0) return null;
    const yesAngle = (stats.burnout_yes / stats.total_completed_tests) * 360;
    return {
      yes: toArc(50, 50, 40, 0, yesAngle),
      no: toArc(50, 50, 40, yesAngle, 360)
    };
  });

  readonly rows = computed<FlatRow[]>(() =>
    this.reports().flatMap(u =>
      u.tests
        .filter(t => t.prediction && t.probability != null)
        .map(t => ({
          genero: t.genero,
          facultad: t.facultad,
          practicasprepro: t.practicasprepro,
          prediction: t.prediction
        }))
    )
  );

  // Gráfico 1: Distribución por género (torta)
  readonly generoPie = computed(() => buildPie(countBy(this.rows(), r => r.genero)));

  // Gráfico 2: Distribución por facultad (barras horizontales)
  readonly facultadData = computed(() => countBy(this.rows(), r => r.facultad));
  readonly maxFacultad = computed(() => Math.max(1, ...Object.values(this.facultadData())));

  // Gráfico 3: Burnout por género (barras agrupadas)
  readonly burnoutPorGenero = computed(() => buildGrouped(this.rows(), r => r.genero, r => r.prediction === 'SI', r => r.prediction === 'N'));
  readonly maxBurnoutGenero = computed(() => maxGrouped(this.burnoutPorGenero()));

  // Gráfico 4: Prácticas preprofesionales (torta)
  readonly practicasPie = computed(() => buildPie(countBy(this.rows(), r => r.practicasprepro)));

  // Gráfico 5: Burnout por facultad (barras agrupadas)
  readonly burnoutPorFacultad = computed(() => buildGrouped(this.rows(), r => r.facultad, r => r.prediction === 'SI', r => r.prediction === 'N'));
  readonly maxBurnoutFacultad = computed(() => maxGrouped(this.burnoutPorFacultad()));

  // Gráfico 6: Burnout por prácticas (barras agrupadas)
  readonly burnoutPorPracticas = computed(() => buildGrouped(this.rows(), r => r.practicasprepro, r => r.prediction === 'SI', r => r.prediction === 'N'));
  readonly maxBurnoutPracticas = computed(() => maxGrouped(this.burnoutPorPracticas()));

  ngOnInit(): void {
    this.loadData();
    this.loadBurnoutStats();
  }

  loadBurnoutStats(): void {
    this.isLoadingStats.set(true);
    this.statsError.set('');
    this.userService.getBurnoutStats().subscribe({
      next: (stats) => { this.burnoutStats.set(stats); this.isLoadingStats.set(false); },
      error: () => { this.statsError.set('Error al cargar las estadísticas.'); this.isLoadingStats.set(false); }
    });
  }

  loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.userService.getTestsReport().subscribe({
      next: (data) => {
        this.reports.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Error al cargar los datos.');
        this.isLoading.set(false);
      }
    });
  }

  objectEntries(obj: Record<string, number>): [string, number][] {
    return Object.entries(obj);
  }

  barHeight(value: number, max: number, maxPx = 160): number {
    return max === 0 ? 4 : Math.max(4, Math.round((value / max) * maxPx));
  }

  shortLabel(label: string): string {
    const idx = label.indexOf('(');
    return idx !== -1 ? label.slice(0, idx).trim() : label;
  }
}

function countBy<T>(arr: T[], key: (item: T) => string): Record<string, number> {
  return arr.reduce((acc, item) => {
    const k = key(item);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function buildGrouped<T>(
  arr: T[],
  groupKey: (item: T) => string,
  isSi: (item: T) => boolean,
  isNo: (item: T) => boolean
): GroupedBar[] {
  const labels = [...new Set(arr.map(groupKey))].sort();
  return labels.map(label => {
    const sub = arr.filter(r => groupKey(r) === label);
    return { label, si: sub.filter(isSi).length, no: sub.filter(isNo).length };
  });
}

function maxGrouped(groups: GroupedBar[]): number {
  return Math.max(1, ...groups.flatMap(g => [g.si, g.no]));
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: +(cx + r * Math.cos(rad)).toFixed(4), y: +(cy + r * Math.sin(rad)).toFixed(4) };
}

function toArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

function buildPie(data: Record<string, number>): { label: string; count: number; path: string; color: string }[] {
  const COLORS = ['#6366f1', '#f43f5e', '#22c55e', '#f59e0b', '#0ea5e9', '#a855f7', '#14b8a6'];
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  let startAngle = 0;
  return Object.entries(data).map(([label, count], i) => {
    const angle = (count / total) * 360;
    const endAngle = startAngle + angle;
    const start = polarToCartesian(50, 50, 40, endAngle);
    const end = polarToCartesian(50, 50, 40, startAngle);
    const largeArc = angle > 180 ? 1 : 0;
    const path = `M 50 50 L ${start.x} ${start.y} A 40 40 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
    startAngle = endAngle;
    return { label, count, path, color: COLORS[i % COLORS.length] };
  });
}
