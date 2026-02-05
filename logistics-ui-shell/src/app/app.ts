import {Component, inject, OnInit} from '@angular/core';
import {RouterModule, RouterOutlet} from '@angular/router';
import {RxStompService} from './components/services/rx-stomp';
import {ApiService} from './components/services/api';
import {CommonModule} from '@angular/common';
import {NavbarComponent} from './components/navbar/navbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, NavbarComponent, RouterOutlet, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-900 font-sans text-white">

      <app-navbar
        [wsConnected]="(wsState$ | async) === 1" 
        (tokenChange)="onAuthChange($event)"
        (usernameChange)="onUserChange($event)">
      </app-navbar>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div class="flex justify-center gap-4 mb-10 bg-gray-800/50 p-1.5 rounded-full w-fit mx-auto backdrop-blur-sm">
           <a routerLink="/" 
              class="px-6 py-2 rounded-full font-bold text-gray-400 hover:text-white transition-all" 
              routerLinkActive="bg-purple-600 text-white shadow-lg" 
              [routerLinkActiveOptions]="{exact: true}">
              Control Tower
           </a>
           <a routerLink="/fleet" 
              class="px-6 py-2 rounded-full font-bold text-gray-400 hover:text-white transition-all" 
              routerLinkActive="bg-purple-600 text-white shadow-lg">
              Fleet Status
           </a>
           <a routerLink="/shipments" 
              class="px-6 py-2 rounded-full font-bold text-gray-400 hover:text-white transition-all" 
              routerLinkActive="bg-purple-600 text-white shadow-lg">
              Active Shipments
           </a>
        </div>

        <router-outlet></router-outlet>

      </main>

      <div class="fixed bottom-5 right-5 flex flex-col gap-2 pointer-events-none z-50">
        <div *ngFor="let notif of notifications" 
             class="bg-gray-800 border-l-4 border-purple-500 text-white px-6 py-4 rounded shadow-2xl animate-slide-in flex items-center gap-3">
             
            <div class="bg-purple-500/20 p-2 rounded-full text-purple-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p class="text-xs font-bold text-gray-400 uppercase tracking-wider">System Alert</p>
              <p class="text-sm font-medium text-gray-200">{{ notif }}</p>
            </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-slide-in { animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
  `]
})
export class AppComponent implements OnInit {
  private rxStomp = inject(RxStompService);
  private api = inject(ApiService);

  wsState$ = this.rxStomp.connected$;
  
  notifications: string[] = [];
  tempToken = '';

  ngOnInit() {
    // Listen for Shipment Updates
    this.rxStomp.watch('/topic/shipments').subscribe(msg => {
      const content = this.tryParse(msg.body);
      
      setTimeout(() => {
          this.notifications.push(`Update: ${content}`);
          setTimeout(() => this.notifications.shift(), 6000);
      }, 0);

      window.dispatchEvent(new CustomEvent('order-update'));
    });
  }

  onAuthChange(token: string) { this.tempToken = token; this.updateApi(); }
  
  onUserChange(user: string) {
    this.api.setCredentials(this.tempToken, user);
  }
  
  updateApi() { /* triggered by inputs */ }

  private tryParse(str: string): string {
    try {
        const json = JSON.parse(str);
        return json.status ? `Shipment ${json.trackingId} is now ${json.status}` : str;
    } catch (e) {
        return str;
    }
  }
}