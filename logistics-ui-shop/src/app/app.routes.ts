import { Routes } from '@angular/router';
import { FleetComponent } from './components/fleet/fleet';
import { ShipmentListComponent } from './components/shipment-list/shipment-list';

// These routes will be loaded inside the Shell
export const routes: Routes = [
  { path: '', redirectTo: 'fleet', pathMatch: 'full' },
  { path: 'fleet', component: FleetComponent },
  { path: 'shipments', component: ShipmentListComponent },
];
