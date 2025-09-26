import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {Coordinate} from 'ol/coordinate';
import {CostLocFetch} from './cost-loc-fetch';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Arcalc} from './arcalc';
import {GroundwaterAquiferService} from './groundwater-aquifer';
import {toLonLat} from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import {Polygon} from 'ol/geom';

@Injectable({
  providedIn: 'root'
})
export class Compute {
  roofArea!: number;
  cord!: Coordinate;
  rooftypecoef!: number;
  daily!: any;
  montly!: { [key: string]: number };
  yearly!: { [key: string]: number };
  freeSpaceArea!: number;
  bill!: number;
  usage!: number;
  costPL!: number;
  vector!:VectorLayer;

  constructor(private router: Router, private cost: CostLocFetch, private ar: Arcalc,private groundwaterService:GroundwaterAquiferService) {
  }

  dailyData() {
    let labels: any[] = [];
    let data: any[] = [];
    for (let dailyKey in this.daily) {
      labels.push(this.daily[dailyKey].date);
      data.push(this.rainTolitres(this.daily[dailyKey].value));
    }
    return {labels, data};
  }

  monthlyData() {
    let mlabels: any[] = [];
    let mdata: any[] = [];
    for (let mon in this.montly) {
      mlabels.push(mon);
      mdata.push(this.rainTolitres(this.montly[mon]));
    }
    return {mlabels, mdata};
  }

  calcEnvImpactIndia() {
    const harvestedLitres = this.calcYearly();
    const avgEnergyPer1000L = 0.6; // kWh per 1000 L
    const co2PerKWh = 0.82;        // kg CO2 per kWh
    const groundwaterOffset = 0.6; // 60% of harvested water reduces groundwater use

    const energyKWh = harvestedLitres / 1000 * avgEnergyPer1000L;
    const co2Kg = energyKWh * co2PerKWh;
    const groundwaterSaved = harvestedLitres * groundwaterOffset;

    return {
      WaterSaved: harvestedLitres,
      GroundwaterSaved: groundwaterSaved,
      EnergySaved: energyKWh,
      CO2Avoided: co2Kg
    };
  }

  setValues(r: any, f: any, c: any, t: any, d: any, m: any, y: any, bill: number, usage: number,vector:VectorLayer) {
    this.roofArea = r
    this.freeSpaceArea = f;
    this.cord = c;
    this.rooftypecoef = t;
    this.daily = d;
    this.montly = m;
    this.yearly = y;
    this.bill = bill;
    this.usage = usage;
    this.vector=vector;
    this.fetchCost()
    this.router.navigate(['/overview']);
    console.log(this.daily);
  }

  calcYearly() {
    const year: number = Object.values(this.yearly)[0];
    return this.rainTolitres(year);
  }

  fetchCost() {
    this.cost.getWaterCost(this.cord[0], this.cord[1]).subscribe(costPer1000L => {
      console.log('Water tariff (INR per 1000L):', costPer1000L);
      this.costPL = costPer1000L;
    });
  }

  rainTolitres(rain: number) {
    let water;
    if (this.roofArea == 0 || this.roofArea == undefined) {
      const x = rain * this.roofArea * this.rooftypecoef * 0.9
      water = Number(x.toFixed(2));
      return water;
    } else {
      const x = rain * this.roofArea * 0.8;
      water = Number(x.toFixed(2));
      return water;
    }
  }

  computeYearlySavings(): Observable<number> {
    return this.cost.getWaterCost(this.cord[0], this.cord[1]).pipe(
      map(costPer1000L => {
        this.costPL = costPer1000L;
        const yearlyWaterLitres = this.calcYearly(); // litres
        const yearlySavings = (yearlyWaterLitres / 1000) * this.costPL; // INR
        return Number(yearlySavings.toFixed(2));
      })
    );
  }

  getArSys() {
    let m = []
    for (let montlyKey in this.montly) {
      m.push(this.montly[montlyKey]);
    }
    return this.ar.getRecommendation(this.roofArea, m, this.freeSpaceArea);
  }

  savingspie()
  {
    const waterUsedL = this.usage;          // Last month water usage
    const waterHarvestedL = this.calcYearly()/12// Harvested water

    let chartData: number[];
    let chartLabels: string[];
    chartData = [waterUsedL, waterHarvestedL];
    chartLabels = ['Used Water', 'Harvested'];
    console.log(chartData,chartLabels)
    return {chartData,chartLabels};
  }

  getaquifer() {
    return toLonLat(this.cord);
  }
  getusage()
  {
    return this.usage;
  }
  getVectorLayer()
  {
    return this.vector;
  }
}
