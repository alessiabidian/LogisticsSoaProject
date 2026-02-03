import {Component, inject, OnInit, ChangeDetectorRef} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ApiService, Shipment} from '../services/api';

@Component({
  selector: 'app-shipment-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-4xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-white">Active Shipments</h2>
        <button (click)="refresh()" class="text-purple-400 hover:text-white underline text-sm transition-colors">
          Refresh List
        </button>
      </div>

      <div class="grid gap-4">
        <div *ngFor="let shipment of shipments"
             class="bg-gray-800 p-4 rounded-lg flex justify-between items-center border border-gray-700 hover:border-purple-500/50 transition-all duration-300">

          <div class="flex items-center gap-4">
            <div class="bg-blue-500/10 text-blue-400 p-3 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p class="text-gray-200 font-mono font-bold">{{ shipment.origin }} &rarr; {{ shipment.destination }}</p>
              <p class="text-xs text-gray-500">
                  Tracking: {{ shipment.trackingId.substring(0,8) }}... |
                  <span [class.text-yellow-400]="shipment.status === 'PENDING'"
                        [class.text-green-400]="shipment.status === 'DISPATCHED'">
                    {{ shipment.status }}
                  </span>
              </p>
            </div>
          </div>

          <button (click)="downloadLabel(shipment)"
                  class="flex items-center gap-2 bg-gray-700 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-all text-sm font-bold group cursor-pointer">
            Print Label
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 group-hover:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>

        <div *ngIf="shipments.length === 0" class="text-center py-16 bg-gray-800/50 rounded-xl border border-gray-700 border-dashed">
          <p class="text-gray-500 text-lg">No active shipments.</p>
          <p class="text-gray-600 text-sm mt-1">Dispatch a vehicle to generate a shipping manifest.</p>
        </div>
      </div>
    </div>
  `
})
export class ShipmentListComponent implements OnInit {
  shipments: Shipment[] = [];
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    // 1. Check if we have a token
    const token = localStorage.getItem('log_token');

    // 2. If logged in, FETCH IMMEDIATELY
    if (token) {
      this.refresh();
    }
  }

  refresh() {
    this.api.getShipments().subscribe({
      next: (data) => {
        this.shipments = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error loading shipments", err);
        
        if (err.status === 401) {
          alert("Your session has expired. Please log in again."); // Optional: nice to have
          this.api.logout(); // <--- Redirects to Login
        }
      }
    });
  }

  getLabelUrl(trackingId: string): string {
    return this.api.getLabelUrl(trackingId);
  }

  // Update the parameter to accept the full object
  downloadLabel(shipment: any) { 
    // Now pass the whole object to the API
    this.api.downloadLabel(shipment).subscribe({
      next: (response) => {
        // Handle the PDF Blob
        const blob = new Blob([response.body!], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `waybill-${shipment.trackingId}.pdf`; 
        link.click();
        
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error("Could not download label", err)
    });
  }
}
