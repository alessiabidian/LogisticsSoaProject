import {Component, EventEmitter, Input, Output, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ApiService} from '../services/api';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <nav class="bg-gray-900 border-b border-gray-800 shadow-2xl relative z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-20">
          
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
              <span class="text-white font-bold text-xl">L</span>
            </div>
            <span class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Logistics App<span class="text-purple-500"></span>
            </span>
          </div>

          <div class="flex items-center gap-6">
            
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700">
              <span class="relative flex h-3 w-3">
                <span [class]="wsConnected ? 'animate-ping bg-green-400' : 'bg-red-400'" class="absolute inline-flex h-full w-full rounded-full opacity-75"></span>
                <span [class]="wsConnected ? 'bg-green-500' : 'bg-red-500'" class="relative inline-flex rounded-full h-3 w-3"></span>
              </span>
              <span class="text-xs font-mono text-gray-400 uppercase tracking-wider">
                {{ wsConnected ? 'System Online' : 'Offline' }}
              </span>
            </div>

            <div class="h-8 w-px bg-gray-700"></div>

            <div *ngIf="isLoggedIn" class="flex items-center gap-4 animate-fade-in">
              <div class="text-right hidden sm:block">
                <p class="text-sm font-bold text-white leading-none">Admin User</p>
                <p class="text-xs text-purple-400 mt-1">HQ Command</p>
              </div>
              <button (click)="logout()" class="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors" title="Disconnect">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>

            <div *ngIf="!isLoggedIn" class="flex items-center gap-2 animate-fade-in">
              <input [(ngModel)]="username" type="text" placeholder="ID" class="w-24 bg-gray-800 border-none rounded text-sm text-white focus:ring-1 focus:ring-purple-500">
              <input [(ngModel)]="password" type="password" placeholder="Key" class="w-24 bg-gray-800 border-none rounded text-sm text-white focus:ring-1 focus:ring-purple-500">
              <button (click)="login()" class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded shadow-lg shadow-purple-500/20 transition-all">
                Connect
              </button>
            </div>

          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class NavbarComponent implements OnInit {
  @Input() wsConnected = false;
  @Output() tokenChange = new EventEmitter<string>();
  @Output() usernameChange = new EventEmitter<string>();

  isLoggedIn = false;
  username = '';
  password = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    // --- SYNC WITH SERVICE ---
    // This allows the Navbar to react if the token expires in the background
    this.api.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
    });

    // Handle initial load (legacy support for Shell component)
    const storedToken = localStorage.getItem('log_token');
    if (storedToken) {
       this.tokenChange.emit(storedToken);
    }
  }

  login() {
    this.api.login(this.username, this.password).subscribe({
      next: (resp) => {
        // 1. Tell the API Service we are logged in (Updates BehaviorSubject)
        this.api.setCredentials(resp.access_token, this.username);
        
        // 2. Emit events for the parent component (Shell)
        this.tokenChange.emit(resp.access_token);
        this.usernameChange.emit(this.username);
      },
      error: () => alert('Access Denied: Invalid Credentials')
    });
  }

  logout() {
    this.api.logout();
  }
}