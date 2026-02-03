import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, BehaviorSubject} from 'rxjs';

// --- Domain Models ---
export interface Vehicle {
  id: number;
  licensePlate: string;
  model: string;
  capacityKg: number;
  fuelLevel: number;
  available: boolean;
}

export interface Shipment {
  id: number;
  trackingId: string;
  status: string;
  vehicleId: number;
  origin: string;
  destination: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private gatewayUrl = 'http://localhost:8080';
  private keycloakUrl = 'http://localhost:8180/realms/logistics-realm/protocol/openid-connect/token';

  // --- STATE MANAGEMENT ---
  private isLoggedInSubject = new BehaviorSubject<boolean>(!!localStorage.getItem('log_token'));
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  // --- STATE ---
  private _token = '';
  private _username = '';

  setCredentials(token: string, username: string) {
    this._token = token;
    this._username = username;
    localStorage.setItem('log_token', token);
    localStorage.setItem('log_username', username);

    // Notify everyone: WE ARE LOGGED IN
    this.isLoggedInSubject.next(true);
  }

  private getToken(): string {
    return this._token || localStorage.getItem('log_token') || '';
  }

  private getUsername(): string {
    return this._username || localStorage.getItem('log_username') || 'guest';
  }

  login(username: string, password: string): Observable<any> {
    const body = new URLSearchParams();
    body.set('client_id', 'logistics-client'); // FIXED: logistics-client
    body.set('username', username);
    body.set('password', password);
    body.set('grant_type', 'password');

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post(this.keycloakUrl, body.toString(), { headers });
  }

  logout() {
    localStorage.removeItem('log_token');
    localStorage.removeItem('log_username');
    this._token = '';
    this._username = '';
    
    // Notify everyone: WE ARE LOGGED OUT
    this.isLoggedInSubject.next(false);
    
    // Redirect
    window.location.href = '/';
  }

  // --- Fleet / Inventory ---
  getVehicles(): Observable<Vehicle[]> {
    const headers = this.getAuthHeaders(); 
    return this.http.get<Vehicle[]>(`${this.gatewayUrl}/api/vehicles`, { headers });
  }

  // --- Analytics ---
  /*trackView(eventName: string) {
    return this.http.post(`${this.gatewayUrl}/api/analytics/view`, {
      eventName: eventName,
      userId: this.getUsername()
    }, { responseType: 'text' });
  }*/

  /*getAnalyticsStats(): Observable<{[key: string]: number}> {
    return this.http.get<{[key: string]: number}>(`${this.gatewayUrl}/api/analytics/stats`);
  }*/

    // --- Analytics ---
  getAnalyticsStats(): Observable<{[key: string]: number}> {
    // This hits the Gateway -> Analytics Service -> Kafka Consumer
    return this.http.get<{[key: string]: number}>(`${this.gatewayUrl}/api/analytics/stats`);
  }

  // --- Shipments ---
  getShipments(): Observable<Shipment[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Shipment[]>(`${this.gatewayUrl}/api/shipments`, { headers });
  }

  // --- Dispatch ---
  dispatchShipment(vehicleId: number, origin: string, destination: string, weight: number) {
    const headers = this.getAuthHeaders();
    const payload = {
        vehicleId, origin, destination, weight, packageCount: 1
    };
    return this.http.post(`${this.gatewayUrl}/api/shipments/dispatch`, payload, { headers, responseType: 'text' });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
}