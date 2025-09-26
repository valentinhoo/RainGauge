import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { toLonLat } from 'ol/proj';

interface NominatimResponse {
  address?: Record<string, string>;
}

interface WaterTariff {
  state: string;
  costPer1000L: number; // INR per 1000 litres
}

@Injectable({
  providedIn: 'root'
})
export class CostLocFetch {

  private waterTariffs: WaterTariff[] = [
    { state: 'Andhra Pradesh', costPer1000L: 7 },
    { state: 'Arunachal Pradesh', costPer1000L: 6 },
    { state: 'Assam', costPer1000L: 7 },
    { state: 'Bihar', costPer1000L: 6 },
    { state: 'Chhattisgarh', costPer1000L: 6 },
    { state: 'Goa', costPer1000L: 15 },
    { state: 'Gujarat', costPer1000L: 7 },
    { state: 'Haryana', costPer1000L: 7 },
    { state: 'Himachal Pradesh', costPer1000L: 8 },
    { state: 'Jharkhand', costPer1000L: 6 },
    { state: 'Karnataka', costPer1000L: 8 },
    { state: 'Kerala', costPer1000L: 6 },
    { state: 'Madhya Pradesh', costPer1000L: 6 },
    { state: 'Maharashtra', costPer1000L: 7 },
    { state: 'Manipur', costPer1000L: 6 },
    { state: 'Meghalaya', costPer1000L: 6 },
    { state: 'Mizoram', costPer1000L: 6 },
    { state: 'Nagaland', costPer1000L: 6 },
    { state: 'Odisha', costPer1000L: 6 },
    { state: 'Punjab', costPer1000L: 8 },
    { state: 'Rajasthan', costPer1000L: 9 },
    { state: 'Sikkim', costPer1000L: 6 },
    { state: 'Tamil Nadu', costPer1000L: 8 },
    { state: 'Telangana', costPer1000L: 7 },
    { state: 'Tripura', costPer1000L: 6 },
    { state: 'Uttar Pradesh', costPer1000L: 7 },
    { state: 'Uttarakhand', costPer1000L: 7 },
    { state: 'West Bengal', costPer1000L: 8 },
    { state: 'Andaman & Nicobar', costPer1000L: 8 },
    { state: 'Chandigarh', costPer1000L: 8 },
    { state: 'Dadra & Nagar Haveli and Daman & Diu', costPer1000L: 8 },
    { state: 'Delhi', costPer1000L: 10 },
    { state: 'Jammu & Kashmir', costPer1000L: 7 },
    { state: 'Ladakh', costPer1000L: 7 },
    { state: 'Lakshadweep', costPer1000L: 10 },
    { state: 'Puducherry', costPer1000L: 8 }
  ];
  private stateMap: Record<string, string> = {
    'Andaman and Nicobar Islands': 'Andaman & Nicobar',
    'Jammu and Kashmir': 'Jammu & Kashmir',
    'Delhi': 'Delhi',
    'Lakshadweep Islands': 'Lakshadweep',
    'Puducherry': 'Puducherry',
    'National Capital Territory of Delhi': 'Delhi',
    'Telangana State': 'Telangana',
    'Dadra and Nagar Haveli': 'Dadra & Nagar Haveli and Daman & Diu',
    'Daman and Diu': 'Dadra & Nagar Haveli and Daman & Diu'
  };

  constructor(private http: HttpClient) {}
  private getState(x: number, y: number, isWebMercator: boolean = true): Observable<string> {
    let lat = y;
    let lon = x;

    if (isWebMercator) {
      [lon, lat] = toLonLat([x, y]);
    }

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    return this.http.get<NominatimResponse>(url).pipe(
      map(res => {
        console.log('Raw Nominatim response:', res);
        let state = res.address?.['state'] || res.address?.['region'] || '';
        if (this.stateMap[state]) {
          state = this.stateMap[state];
        }
        console.log('Detected state:', state);
        return state;
      }),
      catchError(err => {
        console.error('Nominatim API error:', err);
        return of('');
      })
    );
  }
  private lookupTariff(state: string): number {
    const entry = this.waterTariffs.find(
      w => w.state.toLowerCase() === state.toLowerCase()
    );
    const cost = entry ? entry.costPer1000L : 0;
    console.log('Matched tariff:', cost);
    return cost;
  }

  public getWaterCost(x: number, y: number, isWebMercator: boolean = true): Observable<number> {
    return this.getState(x, y, isWebMercator).pipe(
      map(state => this.lookupTariff(state))
    );
  }
}
