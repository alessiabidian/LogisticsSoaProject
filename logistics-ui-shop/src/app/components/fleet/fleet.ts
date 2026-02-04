import {ChangeDetectorRef, Component, inject, OnDestroy, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {ApiService, Vehicle} from '../services/api';

@Component({
  selector: 'app-fleet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="!hasToken" class="text-center py-20 bg-gray-800 rounded-xl border border-red-500/30">
        <h3 class="text-xl font-bold text-white mb-2">Authentication Required</h3>
        <p class="text-gray-400">Please connect via the Control Tower (Top Right) to access Fleet Data.</p>
    </div>

    <div *ngIf="hasToken && vehicles.length === 0" class="text-center py-20 text-gray-600">
        <div class="animate-pulse flex flex-col items-center">
            <div class="h-4 w-4 bg-purple-500 rounded-full mb-2"></div>
            <p>Loading Fleet Status...</p>
        </div>
    </div>

    <div *ngIf="hasToken && vehicles.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      
      <div *ngFor="let vehicle of vehicles; trackBy: trackById"
           (click)="openModal(vehicle)"
           class="group relative bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1 cursor-pointer">

        <div class="h-48 bg-gray-700 relative overflow-hidden flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 text-gray-600 group-hover:text-purple-500/50 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 012-2v0m12 0a2 2 0 012 2v0m-2-2a2 2 0 012-2v0" />
          </svg>
          
          <div class="absolute bottom-4 left-4">
             <span [class]="vehicle.available ? 'bg-green-600' : 'bg-red-600'" 
                   class="px-2 py-1 text-xs font-bold rounded uppercase tracking-wider text-white">
                {{ vehicle.available ? 'Ready for Dispatch' : 'In Transit' }}
             </span>
          </div>
        </div>

        <div class="p-6">
          <div class="flex justify-between items-start mb-2">
            <h3 class="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">{{ vehicle.model }}</h3>
            <span class="text-lg font-bold text-white">{{ vehicle.licensePlate }}</span>
          </div>

          <p class="text-gray-400 text-sm mb-6">Capacity: {{ vehicle.capacityKg }} kg</p>

          <div class="flex items-center justify-between mt-auto">
            <div class="text-sm">
              <span class="text-gray-500">Fuel:</span>
              <span class="text-gray-300 font-bold ml-1">{{ vehicle.fuelLevel }}%</span>
            </div>
            <span class="text-purple-400 text-sm font-bold group-hover:translate-x-1 transition-transform">Dispatch &rarr;</span>
          </div>
        </div>
      </div>
    </div>

    <div *ngIf="selectedVehicle" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" (click)="closeModal()">
      <div class="bg-gray-800 rounded-2xl max-w-lg w-full overflow-hidden border border-gray-700 shadow-2xl relative" (click)="$event.stopPropagation()">

        <div class="h-24 bg-purple-900/50 relative p-6">
          <h2 class="text-3xl font-extrabold text-white">{{ selectedVehicle.licensePlate }}</h2>
          <span class="text-gray-300">{{ selectedVehicle.model }}</span>
          <button (click)="closeModal()" class="absolute top-4 right-4 text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="p-8 relative">
          
          <div class="space-y-4 mb-6">
             <div>
               <label class="text-xs text-gray-500 uppercase tracking-wider block mb-1">Origin City</label>
               <input [(ngModel)]="dispatchData.origin" type="text" class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-purple-500 outline-none" placeholder="e.g. Cluj-Napoca">
             </div>
             
             <div>
               <label class="text-xs text-gray-500 uppercase tracking-wider block mb-1">Destination City</label>
               <input [(ngModel)]="dispatchData.destination" type="text" class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-purple-500 outline-none" placeholder="e.g. Bucharest">
             </div>

             <div>
               <label class="text-xs text-gray-500 uppercase tracking-wider block mb-1">Shipment Weight (kg)</label>
               <input [(ngModel)]="dispatchData.weight" type="number" class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-purple-500 outline-none" placeholder="0">
             </div>
          </div>

          <button 
            (click)="onDispatch()"
            [disabled]="!selectedVehicle.available"
            class="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
            <span *ngIf="selectedVehicle.available">Confirm Dispatch</span>
            <span *ngIf="!selectedVehicle.available">Vehicle Busy</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.2s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class FleetComponent implements OnInit {
  vehicles: Vehicle[] = [];
  selectedVehicle: Vehicle | null = null;
  
  hasToken = false; 

  // Data holder for the form
  dispatchData = {
      origin: 'Cluj-Napoca',
      destination: '',
      weight: 100
  };

  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    // 2. Check for token immediately
    const token = localStorage.getItem('log_token');
    this.hasToken = !!token;

    if (this.hasToken) {
      this.refresh();
    }
  }

  /*
  openModal(vehicle: Vehicle) {
    this.selectedVehicle = vehicle;
    this.api.trackView('view_vehicle_' + vehicle.id).subscribe();
  }
    */

  openModal(vehicle: Vehicle) {
    this.selectedVehicle = vehicle;
  }

  closeModal() {
    this.selectedVehicle = null;
  }

  trackById(index: number, vehicle: Vehicle) {
    return vehicle.id;
  }

  refresh() {
    if (!this.hasToken) return; // Guard clause

    this.api.getVehicles().subscribe({
      next: (data) => {
        this.vehicles = data.sort((a, b) => a.id - b.id);
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Could not fetch fleet", err)
    });
  }

  onDispatch() {
    if(!this.selectedVehicle) return;

    this.api.dispatchShipment(
        this.selectedVehicle.id,
        this.dispatchData.origin,
        this.dispatchData.destination,
        this.dispatchData.weight,
        this.selectedVehicle.licensePlate
    ).subscribe({
      next: () => {
        alert('Shipment Dispatched! Vehicle is now en route.');
        if(this.selectedVehicle) this.selectedVehicle.available = false;
        this.closeModal();
      },
      error: (err) => alert('Dispatch failed: ' + err.message)
    });
  }
}