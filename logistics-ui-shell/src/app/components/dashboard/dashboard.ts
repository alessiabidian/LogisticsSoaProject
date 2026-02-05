import {Component, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {ApiService} from '../services/api';
import {interval, startWith, Subscription, switchMap} from 'rxjs';
import {CommonModule} from '@angular/common';

// Helper interface for the UI
interface CityStat {
  name: string;
  count: number;
  percentage: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-5xl mx-auto px-4">
      <div class="mb-10">
        <h2 class="text-3xl font-bold text-white mb-2">Dispatch Analytics</h2>
        <p class="text-gray-400">Total shipments received per city via Kafka</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let item of stats() | keyvalue" 
             class="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-lg hover:border-purple-500 transition-all">
          
          <div class="flex flex-col">
            <span class="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Destination City</span>
            <span class="text-2xl font-bold text-white mb-4">{{ item.key }}</span>
            
            <div class="flex items-baseline gap-2">
              <span class="text-5xl font-black text-purple-500">{{ item.value }}</span>
              <span class="text-gray-400 text-sm font-medium">Dispatches</span>
            </div>
          </div>
        </div>

        <div *ngIf="(stats() | keyvalue).length === 0" 
             class="col-span-full py-20 text-center bg-gray-800/20 border-2 border-dashed border-gray-700 rounded-2xl">
          <p class="text-gray-500 text-lg font-medium">No dispatch data yet.</p>
          <p class="text-gray-600 text-sm">Perform a dispatch in the 'Active Shipments' tab to see results.</p>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats = signal<{[key: string]: number}>({});
  private api = inject(ApiService);
  private refreshSub!: Subscription;

  ngOnInit() {
    this.refreshSub = interval(2000)
      .pipe(
        startWith(0),
        switchMap(() => this.api.getAnalyticsStats())
      )
      .subscribe({
        next: (data) => this.stats.set(data),
        error: (err) => console.error('Analytics Error', err)
      });
  }

  ngOnDestroy() {
    if (this.refreshSub) this.refreshSub.unsubscribe();
  }
}