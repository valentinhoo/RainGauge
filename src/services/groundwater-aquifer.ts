import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap, catchError, map } from 'rxjs';

export interface WaterLevelPoint {
  date: string;
  level_m_bgl: number;
}

export interface WaterQualitySample {
  date: string;
  pH?: number;
  tds_mg_l?: number;
  notes?: string;
}

export interface AquiferRecord {
  name: string;
  type: string;
  description?: string;
  typicalStates: string[];
}

export interface GroundwaterInfo {
  state?: string;
  district?: string;
  aquifers: AquiferRecord[];
  waterLevels?: WaterLevelPoint[];
  waterQuality?: WaterQualitySample[];
  note?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GroundwaterAquiferService {

  constructor(private http: HttpClient) {}

  private AQUIFER_CATALOG: AquiferRecord[] = [
    { name: 'Indo-Gangetic Alluvium', type: 'Alluvial', typicalStates: ['Uttar Pradesh','Bihar','Punjab','Haryana','Delhi','West Bengal','Jharkhand','Chhattisgarh','Rajasthan','Uttarakhand'], description: 'Extensive unconsolidated sands.' },
    { name: 'Deccan Traps / Basalt', type: 'Basalt', typicalStates: ['Maharashtra','Karnataka','Goa','Gujarat'], description: 'Layered volcanic basalts with fractures.' },
    { name: 'Peninsular Crystalline', type: 'Hard Rock', typicalStates: ['Tamil Nadu','Karnataka','Andhra Pradesh','Telangana','Madhya Pradesh','Rajasthan','Odisha'], description: 'Fractured granite/gneiss.' },
    { name: 'Coastal Sedimentary', type: 'Coastal', typicalStates: ['Kerala','Tamil Nadu','Andhra Pradesh','Odisha','West Bengal','Gujarat'], description: 'Shallow coastal aquifers.' },
    { name: 'Aravalli Crystalline', type: 'Hard Rock', typicalStates: ['Rajasthan','Haryana'], description: 'Fractured rocks in Aravalli region.' },
    { name: 'Western Ghats Basalts', type: 'Basalt', typicalStates: ['Kerala','Karnataka','Maharashtra'], description: 'Volcanic basalt flows along Western Ghats.' },
    { name: 'Eastern Ghats Crystalline', type: 'Hard Rock', typicalStates: ['Odisha','Andhra Pradesh','Tamil Nadu'], description: 'Fractured metamorphic rocks.' },
    { name: 'Coastal Alluvium', type: 'Alluvial', typicalStates: ['Gujarat','Maharashtra','Kerala','Tamil Nadu','Andhra Pradesh','Odisha'], description: 'Alluvial deposits along coasts.' },
    { name: 'Brahmaputra Alluvium', type: 'Alluvial', typicalStates: ['Assam','Arunachal Pradesh'], description: 'Floodplain sediments of Brahmaputra valley.' },
    { name: 'Godavari-Krishna Alluvium', type: 'Alluvial', typicalStates: ['Telangana','Andhra Pradesh','Maharashtra'], description: 'River valley alluvium.' }
  ];

  private AREA_INDEX: { [state: string]: { [districtLower: string]: string[] } } = {
    'uttar pradesh': { 'all': ['Indo-Gangetic Alluvium'] },
    'bihar': { 'all': ['Indo-Gangetic Alluvium'] },
    'punjab': { 'all': ['Indo-Gangetic Alluvium'] },
    'haryana': { 'all': ['Indo-Gangetic Alluvium','Aravalli Crystalline'] },
    'delhi': { 'all': ['Indo-Gangetic Alluvium'] },
    'west bengal': { 'all': ['Indo-Gangetic Alluvium','Coastal Sedimentary'] },
    'jharkhand': { 'all': ['Indo-Gangetic Alluvium'] },
    'chhattisgarh': { 'all': ['Indo-Gangetic Alluvium'] },
    'rajasthan': { 'all': ['Indo-Gangetic Alluvium','Aravalli Crystalline','Peninsular Crystalline'] },
    'uttarakhand': { 'all': ['Indo-Gangetic Alluvium'] },
    'maharashtra': { 'all': ['Deccan Traps / Basalt','Western Ghats Basalts','Godavari-Krishna Alluvium','Coastal Alluvium'] },
    'karnataka': { 'all': ['Deccan Traps / Basalt','Peninsular Crystalline','Western Ghats Basalts'] },
    'goa': { 'all': ['Deccan Traps / Basalt'] },
    'gujarat': { 'all': ['Deccan Traps / Basalt','Coastal Alluvium'] },
    'tamil nadu': { 'all': ['Peninsular Crystalline','Coastal Sedimentary','Eastern Ghats Crystalline'] },
    'kerala': { 'all': ['Coastal Sedimentary','Western Ghats Basalts','Coastal Alluvium'] },
    'andhra pradesh': { 'all': ['Peninsular Crystalline','Coastal Sedimentary','Eastern Ghats Crystalline','Godavari-Krishna Alluvium'] },
    'telangana': { 'all': ['Peninsular Crystalline','Godavari-Krishna Alluvium'] },
    'madhya pradesh': { 'all': ['Peninsular Crystalline'] },
    'odisha': { 'all': ['Peninsular Crystalline','Coastal Sedimentary','Eastern Ghats Crystalline','Coastal Alluvium'] },
    'assam': { 'all': ['Brahmaputra Alluvium'] },
    'arunachal pradesh': { 'all': ['Brahmaputra Alluvium'] }
  };

  getByLatLon(lat: number, lon: number, months: number = 6): Observable<GroundwaterInfo> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    return this.http.get<any>(url).pipe(
      map(resp => {
        const state = resp.address?.state || '';
        const district = resp.address?.county || resp.address?.city || '';
        return { state, district };
      }),
      switchMap(({ state, district }) => {
        const aquiferNames = this.lookupAquifers(state, district);
        const aquifers = aquiferNames.map(name => this.catalogFind(name)).filter(Boolean) as AquiferRecord[];
        return of({
          state,
          district,
          aquifers,
          waterLevels: this.generateSyntheticWaterLevel(months, state, district, aquifers),
          waterQuality: this.generateSyntheticWaterQuality(months, state, district),
          note: 'Hardcoded / demo groundwater info.'
        } as GroundwaterInfo);
      }),
      catchError(err => {
        console.error('Error fetching reverse geocode:', err);
        return of({
          state: undefined,
          district: undefined,
          aquifers: [],
          note: 'Reverse geocoding failed; returning empty info.'
        } as GroundwaterInfo);
      })
    );
  }

  private lookupAquifers(state: string, district: string): string[] {
    const s = state.trim().toLowerCase();
    const d = district.trim().toLowerCase();
    if (this.AREA_INDEX[s] && this.AREA_INDEX[s][d]) return this.AREA_INDEX[s][d];
    if (this.AREA_INDEX[s]) return this.AREA_INDEX[s]['all'];
    return ['Indo-Gangetic Alluvium'];
  }

  private catalogFind(name: string | undefined): AquiferRecord | null {
    if (!name) return null;
    const n = name.toLowerCase();
    return this.AQUIFER_CATALOG.find(a => a.name.toLowerCase().includes(n)) || null;
  }

  private generateSyntheticWaterLevel(months: number, state?: string, district?: string, aquifers?: AquiferRecord[]): WaterLevelPoint[] {
    const now = new Date();
    const out: WaterLevelPoint[] = [];
    const seed = this.hashString((state||'') + (district||''));
    const base = 5 + (seed % 10);
    for (let i = months-1; i>=0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
      const value = +(base + Math.sin(i+seed)*0.6).toFixed(2);
      out.push({ date: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, level_m_bgl: value });
    }
    return out;
  }

  private generateSyntheticWaterQuality(months: number, state?: string, district?: string): WaterQualitySample[] {
    const now = new Date();
    const out: WaterQualitySample[] = [];
    const seed = this.hashString((state||'') + (district||''));
    for (let i = months-1; i>=0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth()-i,1);
      const pH = +(7 + ((seed%5)-2)*0.05 + Math.sin(i+seed)*0.1).toFixed(2);
      const tds = 200 + (seed%400) + Math.round(Math.cos(i+seed)*15);
      out.push({ date: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, pH, tds_mg_l: tds });
    }
    return out;
  }

  private hashString(s: string): number {
    let h = 0; for (let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i); h|=0;} return Math.abs(h);
  }
}
