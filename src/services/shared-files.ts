import {Injectable, signal} from '@angular/core';
import {Coordinate} from 'ol/coordinate';

@Injectable({
  providedIn: 'root'
})
export class SharedFiles {
  roofArea= signal<number|null>(null);
  freeSpaceArea=signal<number|null>(null);
  cord=signal<Coordinate|null>(null)
  rooftypecoef=signal<number|null>(null);
  daily=signal<any|null>(null)
  montly=signal<any|null>(null)
  yearly=signal<any|null>(null)

  setValues(r:any,f:any,c:any,t:any,d:any,m:any,y:any)
  {
    this.roofArea.set(r);
    this.freeSpaceArea.set(f);
    this.cord.set(c);
    this.rooftypecoef.set(t);
    this.daily.set(d);
    this.montly.set(m);
    this.yearly.set(y);
  }
}
