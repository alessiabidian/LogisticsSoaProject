import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard';
import { loadRemoteModule } from '@angular-architects/module-federation';

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent
  },
  {
    path: 'fleet',
    loadComponent: () =>
        loadRemoteModule({
            type: 'module',
            remoteEntry: 'http://localhost:4201/remoteEntry.js', // Points to UI-SHOP
            exposedModule: './FleetComponent' // Matches Shop exposure
        }).then(m => m.FleetComponent)
  },
  {
    path: 'shipments',
    loadComponent: () =>
        loadRemoteModule({
            type: 'module',
            remoteEntry: 'http://localhost:4201/remoteEntry.js', // Points to UI-SHOP
            exposedModule: './ShipmentListComponent' // Matches Shop exposure
        }).then(m => m.ShipmentListComponent)
  }
];