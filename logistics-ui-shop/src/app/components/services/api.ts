import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';

// Matches Backend Vehicle Entity
export interface Vehicle {
  id: number;
  licensePlate: string;
  model: string;
  capacityKg: number;
  fuelLevel: number;
  available: boolean; // Replaces 'quantity'
}

// Matches Backend Shipment Entity
export interface Shipment {
  id: number;
  trackingId: string;
  status: string; // PENDING, DISPATCHED, DELIVERED
  vehicleId: number;
  origin: string;
  destination: string;
  weight: number;
  licensePlate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private gatewayUrl = 'http://localhost:8080';
  private keycloakUrl = 'http://localhost:8180/realms/logistics-realm/protocol/openid-connect/token';

  // --- STATE ---
  private _token = '';
  private _username = '';

  setCredentials(token: string, username: string) {
    this._token = token;
    this._username = username;
    localStorage.setItem('log_token', token);
    localStorage.setItem('log_username', username);
  }

  logout() {
    // 1. Clear the stored secrets
    this._token = '';
    this._username = '';
    localStorage.removeItem('log_token');
    localStorage.removeItem('log_username');

    // 2. Force the browser to go back to the Login Page
    // This effectively resets the app state
    window.location.href = '/'; 
  }

  /*
  downloadLabel(trackingId: string) {
    const headers = this.getAuthHeaders();
    return this.http.get(
      `${this.gatewayUrl}/api/shipments/label/${trackingId}`,
      {
        headers,
        responseType: 'blob', // <--- IMPORTANT: Tells Angular this is a file
        observe: 'response'   // We need the full response to check headers if needed
      }
    );
  }*/

  // --- PDF Download via FaaS ---
  downloadLabel(shipment: any) {
    //const headers = this.getAuthHeaders();
    
    return this.http.post(
      `http://localhost:8084/api/waybills/generate-download`, 
      {
        trackingId: shipment.trackingId,
        origin: shipment.origin,
        destination: shipment.destination,
        weight: shipment.weight,
        licensePlate: shipment.licensePlate//'CJ-88-SOA'
      },
      { 
        //headers, 
        responseType: 'blob', 
        observe: 'response'
      }
    );
  }

  // Helper to get token from memory OR storage
  private getToken(): string {
    return this._token || localStorage.getItem('log_token') || '';
  }

  private getUsername(): string {
    return this._username || localStorage.getItem('log_username') || 'guest';
  }

  login(username: string, password: string): Observable<any> {
    const body = new URLSearchParams();
    body.set('client_id', 'logistics-client');
    body.set('username', username);
    body.set('password', password);
    body.set('grant_type', 'password');

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post(this.keycloakUrl, body.toString(), { headers });
  }

  // --- Fleet ---
  getVehicles(): Observable<Vehicle[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Vehicle[]>(`${this.gatewayUrl}/api/vehicles`, { headers });
  }

  // --- Analytics ---
  trackView(eventName: string) {
    return this.http.post(`${this.gatewayUrl}/api/analytics/view`, {
      eventName: eventName,
      userId: this.getUsername()
    }, { responseType: 'text' });
  }

  // --- Shipments ---
  getShipments(): Observable<Shipment[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Shipment[]>(`${this.gatewayUrl}/api/shipments`, { headers });
  }

  getLabelUrl(trackingId: string): string {
    // Calls Function Service via Gateway to generate PDF label
    return `${this.gatewayUrl}/api/labels/${trackingId}`;
  }

  // --- Dispatch ---
  dispatchShipment(vehicleId: number, origin: string, destination: string, weight: number, licensePlate: string) {
    const headers = this.getAuthHeaders();
    const payload = {
        vehicleId,
        origin,
        destination,
        weight,
        packageCount: 1,
        licensePlate: licensePlate
    };

    return this.http.post(
        `${this.gatewayUrl}/api/shipments/dispatch`,
        { vehicleId, origin, destination, weight, packageCount: 1, licensePlate: licensePlate },
        { headers, responseType: 'text' }
    );
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    if (!token) console.warn('No token found in ApiService or LocalStorage');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
}
