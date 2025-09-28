import {AfterViewInit, Component, ElementRef, HostListener, inject, Renderer2, signal, ViewChild} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatToolbar, MatToolbarRow } from '@angular/material/toolbar';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatGridList, MatGridTile } from '@angular/material/grid-list';
import { Compute } from '../services/compute';
import { MatIcon } from '@angular/material/icon';
import Chart from 'chart.js/auto';
import { RechargeRecommendation } from '../services/arcalc';
import { GroundwaterAquiferService, GroundwaterInfo } from '../services/groundwater-aquifer';
import { toLonLat } from 'ol/proj';
import { LineString, Polygon } from 'ol/geom';
import { getLength } from 'ol/sphere';
import VectorLayer from 'ol/layer/Vector';
import { Feature } from 'ol';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions, MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef, MatRow, MatRowDef,
  MatTable
} from '@angular/material/table';
import {CdkTableDataSourceInput} from '@angular/cdk/table';
import {NgForOf} from '@angular/common';
import {MatDivider} from '@angular/material/divider';
import {MatList, MatListItem} from '@angular/material/list';
import {LangService} from '../services/lang-service';

export interface SVGDimensions {
  length: number;   // meters
  breadth: number;  // meters
  depth: number;    // meters
  radius: number;   // meters, only for circular shafts/barrels
  systemType: string;
}

export interface RainwaterComponentCost {
  name: string;          // Component type
  description: string;   // Generic description
  quantity: number;      // meters or units
  cost: number;          // INR
}
export interface DialogData {
 rain:RainwaterComponentCost;
 ar:RechargeRecommendation;
 bool:boolean;
}
// WeatherService to call Weatherstack API
export class WeatherService {
  private apiKey = 'ddd6d38a14fc1a419502c1dbb41c9d6b';
  private baseUrl = 'http://api.weatherstack.com/';

  constructor(private http: HttpClient) {}

  getCurrentWeather(location: string): Observable<any> {
    const url = `${this.baseUrl}current?access_key=${this.apiKey}&query=${encodeURIComponent(location)}`;
    return this.http.get(url);
  }

  getHistoricalWeather(location: string, date: string): Observable<any> {
    const url = `${this.baseUrl}historical?access_key=${this.apiKey}&query=${encodeURIComponent(location)}&historical_date=${date}`;
    return this.http.get(url);
  }

  getLast7DaysHistorical(location: string): Observable<any[]> {
    const dates = this.getLast7DaysDates();
    const requests = dates.map(date => this.getHistoricalWeather(location, date));
    return forkJoin(requests);
  }

  private getLast7DaysDates(): string[] {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }
}

@Component({
  selector: 'app-overview-display',
  imports: [
    MatToolbarRow,
     MatToolbar,
    MatGridList,
    MatGridTile,
    MatIconButton,
    MatIcon
  ],
  templateUrl: './overview-display.html',
  styleUrl: './overview-display.css'
})
export class OverviewDisplay implements AfterViewInit {
  yeary = signal<number | null>(1000);
  savings = signal<number | null>(20000);
  ROI = signal<number | null>(300);
  PaybackPeriod = signal<number | null>(3);
  arReco = signal<RechargeRecommendation | null>(null);
  groundwater = signal<GroundwaterInfo | null>(null);
  rainCost=signal<number|null>(null);
  rainL=signal<number | null>(null);
  c=signal<number  >(4);
  r=signal<string >('3:1');
  bool:boolean = false;
  rain!:RainwaterComponentCost[];
  @ViewChild('arcontainer') div!: ElementRef;
  @ViewChild('rtr') rdiv!: ElementRef;
  readonly dialog = inject(MatDialog);

  @HostListener('window:resize', ['$event'])
  onResize(event: UIEvent) {
    const width = (event.target as Window).innerWidth;
    this.updateGrid(width);
  }

  private updateGrid(width: number) {
    if (width < 600) {
      // phone portrait
      this.c.set(2);
      this.r.set('1.5:1');
    } else if (width >= 600 && width < 1024) {
      // tablet or phone landscape
      this.c.set(2);
      this.r.set('1.5:1');
    } else {
      // desktop
      this.c.set(4);
      this.r.set('3:1');
    }
  }
  openDialog(): void {
    const dialogRef = this.dialog.open(DialogOverviewExampleDialog, {
      data: {rain:this.rain,ar:this.arReco(),bool:this.bool},
    });

    dialogRef.afterClosed().subscribe(result => {

    });
  }
  env = signal<{
    WaterSaved: any,
    GroundwaterSaved: any,
    EnergySaved: any,
    CO2Avoided: any
  } | null>({ WaterSaved: 0, GroundwaterSaved: 0, EnergySaved: 0, CO2Avoided: 0 });

  private weatherService: WeatherService;

  constructor(
    public lang:LangService,
    public compute: Compute,
    private groundwaterService: GroundwaterAquiferService,
    private renderer: Renderer2,
    private http: HttpClient
  ) {
    // Initialize WeatherService with HttpClient
    this.weatherService = new WeatherService(this.http);

  }

  formatEnvNumber(value: number): string {
    let absValue = Math.abs(Math.floor(value)); // remove decimals
    let formatted = '';

    if (absValue >= 1_000_000_000) {
      formatted = Math.floor(absValue / 1_000_000_000) + 'B';
    } else if (absValue >= 1_000_000) {
      formatted = Math.floor(absValue / 1_000_000) + 'M';
    } else if (absValue >= 1_000) {
      formatted = Math.floor(absValue / 1_000) + 'K';
    } else {
      formatted = absValue.toString();
    }

    return formatted;
  }

  ngAfterViewInit() {
    this.updateGrid(window.innerWidth); // set initial values
    this.yeary.set(this.compute.calcYearly());
    this.compute.computeYearlySavings().subscribe(savings => {
      console.log('Yearly savings (INR):', savings);
      this.savings.set(savings);
      this.compute.dailyData();
    });
    const { labels, data } = this.compute.dailyData();
    console.log(labels, data);
    const ctx = document.getElementById('acquisitions') as HTMLCanvasElement;
    const ctm = document.getElementById('monthlybar') as HTMLCanvasElement;
    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Litres Per day',
            data,
            fill: true,
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: 'rgba(54, 162, 235, 1)',
          }
        ]
      },
      options: {
        layout: { padding: { bottom: 45 } },
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, grid: { color: 'rgba(200,200,200,0.1)' } }
        },
        plugins: {
          legend: { display: false },
          tooltip: { mode: 'index', intersect: false, yAlign: 'top' }
        }
      }
    });

    const { mlabels, mdata } = this.compute.monthlyData();
    new Chart(ctm, {
      type: 'bar',
      data: {
        labels: mlabels,
        datasets: [
          {
            label: 'Monthly Rainfall (L)',
            data: mdata,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        layout: { padding: { bottom: 45 } },
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, ticks: { padding: 5 } },
          y: { beginAtZero: true, grid: { color: 'rgba(200,200,200,0.1)' } }
        },
        plugins: {
          tooltip: { yAlign: 'top' },
          legend: { display: false }
        }
      }
    });

    this.env.set(this.compute.calcEnvImpactIndia());
    console.log(this.compute.getArSys());
    const e = this.compute.getArSys();
    // this.ROI.set(Number(((this.savings()! / e.estimatedCostINR) * 100).toFixed(2)));
    // this.PaybackPeriod.set(Math.floor(e.estimatedCostINR / this.savings()!));
    this.arReco.set(e);

    const dim: SVGDimensions = { length: e.length, breadth: e.breadth, depth: e.depth, radius: e.radius, systemType: e.systemType };
    const svgString = this.generateSVG(dim, this.div.nativeElement.clientWidth || 400, this.div.nativeElement.clientHeight || 400);
    this.div.nativeElement.innerHTML = svgString;

    const { chartData, chartLabels } = this.compute.savingspie();
    const chartColors = ['#36a2f6', 'rgba(255,112,67,0.86)']; // blue vs orange
    const ctd = document.getElementById('waterDonut') as HTMLCanvasElement;

    new Chart(ctd, {
      type: 'doughnut',
      data: {
        labels: chartLabels,
        datasets: [{
          data: chartData,
          backgroundColor: chartColors,
          borderColor: '#FFFFFF',
          borderWidth: 2
        }]
      },
      options: {
        layout: { padding: { bottom: 45 } },
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.raw as number;
                const total = chartData.reduce((a, b) => a + b, 0);
                const percent = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} L (${percent}%)`;
              }
            }
          }
        }
      },
      plugins: [{
        id: 'customCanvasBackgroundColor',
        beforeDraw: (chart) => {
          const cts = chart.canvas.getContext('2d');
          cts!.save();
          cts!.globalCompositeOperation = 'destination-over';
          cts!.fillStyle = 'transparent';
          cts!.fillRect(0, 0, chart.width, chart.height);
          cts!.restore();
        }
      }]
    });

    const c = this.compute.getaquifer();
    this.groundwaterService.getByLatLon(c[1], c[0], 6).subscribe(data => {
      if (!data) return;
      this.groundwater.set(data);
      console.log(data);

      const ctp = document.getElementById('groundwaterChart') as HTMLCanvasElement;

      const waterLevels = data.waterLevels!;
      const waterQuality = data.waterQuality!;

      new Chart(ctp, {
        type: 'line',
        data: {
          labels: waterLevels.map(w => w.date),
          datasets: [
            {
              label: 'Water Level (m BGL)',
              data: waterLevels.map(w => w.level_m_bgl),
              borderColor: 'rgba(54, 162, 235, 1)',
              backgroundColor: 'rgba(54, 162, 235, 0.3)',
              fill: true,
              tension: 0.3,
              yAxisID: 'yLevel'
            },
            {
              label: 'TDS (mg/L)',
              data: waterQuality.map(w => w.tds_mg_l),
              borderColor: 'rgba(255, 159, 64, 1)',
              fill: false,
              tension: 0.3,
              yAxisID: 'yTDS'
            },
            {
              label: 'pH',
              data: waterQuality.map(w => w.pH),
              borderColor: 'rgba(75, 192, 192, 1)',
              fill: false,
              tension: 0.3,
              yAxisID: 'yPH'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          scales: {
            yLevel: {
              type: 'linear',
              position: 'left',
              title: { display: true, text: 'Water Level (m BGL)' },
              beginAtZero: false
            },
            yTDS: {
              type: 'linear',
              position: 'right',
              title: { display: true, text: 'TDS (mg/L)' },
              beginAtZero: true,
              grid: { drawOnChartArea: false }
            },
            yPH: {
              type: 'linear',
              position: 'right',
              title: { display: true, text: 'pH' },
              beginAtZero: false,
              min: 0,
              max: 14,
              grid: { drawOnChartArea: false },
              offset: true
            },
            x: { title: { display: true, text: 'Month' } }
          },
          plugins: {
            tooltip: { mode: 'index', intersect: false },
            legend: { position: 'top' }
          }
        }
      });
    });
    const cords = this.compute.getVectorLayer();
    const t=this.drawPolygonInContainer(cords!,this.rdiv);
    const rain=this.estimateRainwaterSystem(t!,this.compute.usage);
    console.log(rain)
    this.rain=rain;
    this.rainCost.set(rain[4].cost);
    const r = (this.savings()!/rain[4].cost)*100;
    this.ROI.set(Number(r.toFixed(2)));
    this.PaybackPeriod.set(Math.floor(rain[4].cost / this.savings()!));
    this.rainL.set(rain[5].cost);

    // Load Chatling chatbot script dynamically only for this component
    this.loadChatlingChatbot();
  }

  loadChatlingChatbot() {
    // Set global config for Chatling
    (window as any).chtlConfig = { chatbotId: "5111694812" };

    // Create script element
    const script = this.renderer.createElement('script');
    script.src = 'https://chatling.ai/js/embed.js';
    script.async = true;
    script.defer = true;
    script.setAttribute('data-id', '5111694812');

    // Append script to document body
    this.renderer.appendChild(document.body, script);
  }

  // New method to fetch weather report and format for chatbot integration
  getWeatherReportForChatbot(loc_1: string): Observable<string> {
    return this.weatherService.getCurrentWeather(loc_1).pipe(
      map(currentData => {
        const temp = currentData.current.temperature;
        const weatherDesc = currentData.current.weather_descriptions.join(', ');
        const rainChance = currentData.current.precip; // precipitation in mm, >0 means rain possibility
        const rainMessage = rainChance > 0
          ? `There is a possibility of rain (precipitation: ${rainChance} mm).`
          : 'No rain expected currently.';

        // Heavy rain or flood warning threshold example (can be adjusted)
        let floodWarning = '';
        if (rainChance > 30) {
          floodWarning = 'Heavy rain detected – please take precautions for potential flooding.';
        }

        return `Weather in ${loc_1}: ${weatherDesc}, temperature is ${temp}°C. ${rainMessage} ${floodWarning}`;
      })
    );
  }

  estimateRainwaterSystem(
    roofPerimeter: number,   // meters
    monthlyWaterL: number    // liters per month
  ): RainwaterComponentCost[] {
    if(monthlyWaterL==0)monthlyWaterL=15000;
    const gutter = { description: 'UPVC rainwater gutter (220 mm height)', costPerM: 350 };
    const pipe = { description: '110 mm UPVC downpipe', costPerM: 180 };
    const filter = { description: 'Basic first-flush diverter', costPerUnit: 2000 };
    const tank = { description: 'HDPE water storage tank', costPer1000L: 6000 };

     const targetStorageL = monthlyWaterL * 0.8;

     let tankCapacityL = Math.ceil(targetStorageL); // total liters required
    const x = Math.round(tankCapacityL / 1000);
    const tankCost = x* tank.costPer1000L;
    tankCapacityL = x*1000;

    // 3️⃣ Quantities
    const gutterQty = roofPerimeter;               // meters
    const pipeQty = Math.ceil(roofPerimeter / 10); // 1 downpipe per 10 m of gutter
    const filterQty = 1;                           // usually 1 filter
    const tankQtyTotal = x;            // liters

    // 4️⃣ Costs
    const gutterCost = gutterQty * gutter.costPerM;
    const pipeCost = pipeQty * pipe.costPerM;
    const filterCost = filterQty * filter.costPerUnit;
    const totalCost = gutterCost + pipeCost + filterCost + tankCost;

    return [
      { name: 'Gutter', description: gutter.description, quantity: gutterQty, cost: Number(gutterCost.toFixed(2)) },
      { name: 'Downpipe', description: pipe.description, quantity: pipeQty, cost: Number(pipeCost.toFixed(2)) },
      { name: 'First-flush filter', description: filter.description, quantity: filterQty, cost: Number(filterCost.toFixed(2)) },
      { name: 'Storage Tank', description: `${tank.description} (~${tankCapacityL} L total)`, quantity: tankQtyTotal, cost: Number(tankCost.toFixed(2)) },
      { name: 'Total', description: '—', quantity: 0, cost: Number(totalCost.toFixed(2)) },
      { name: 'x', description: '—', quantity: 0, cost: tankCapacityL }
    ];
  }

  drawPolygonInContainer(layer: VectorLayer, container: ElementRef) {
    const features: Feature<any>[] = layer.getSource()!.getFeatures();
    if (!features.length) return;

    const geom = features[0].getGeometry() as Polygon;
    const coords = geom.getCoordinates()[0];

    const svgNS = "http://www.w3.org/2000/svg";
    const svgWidth = container.nativeElement.clientWidth || 200;
    const svgHeight = container.nativeElement.clientHeight || 200;
    container.nativeElement.innerHTML = '';

    const xs = coords.map(c => c[0]);
    const ys = coords.map(c => c[1]);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    const maxX = Math.max(...xs), maxY = Math.max(...ys);
    const scaleX = (svgWidth - 20) / (maxX - minX);
    const scaleY = (svgHeight - 20) / (maxY - minY);

    const points = coords.map(c => ({
      x: (c[0] - minX) * scaleX + 10,
      y: svgHeight - ((c[1] - minY) * scaleY + 10)
    }));

    let total = 0;
    const sides: { length: number, midX: number, midY: number }[] = [];
    for (let i = 0; i < coords.length - 1; i++) {
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const length = Math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2);
      const midX = (points[i].x + points[i + 1].x) / 2;
      const midY = (points[i].y + points[i + 1].y) / 2;
      sides.push({ length, midX, midY });
      total = total + length;
    }
    console.log(total);

    const svgEl = document.createElementNS(svgNS, 'svg');
    svgEl.setAttribute('width', svgWidth.toString());
    svgEl.setAttribute('height', svgHeight.toString());
    svgEl.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
    svgEl.setAttribute('style', 'background: transparent; display:block;');

    const polygon = document.createElementNS(svgNS, 'polygon');
    polygon.setAttribute('points', points.map(p => `${p.x},${p.y}`).join(' '));
    polygon.setAttribute('stroke', 'blue');
    polygon.setAttribute('fill', 'rgba(0,0,255,0.3)');
    polygon.setAttribute('stroke-width', '2');
    svgEl.appendChild(polygon);

    sides.forEach(s => {
      const text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', s.midX.toString());
      text.setAttribute('y', s.midY.toString());
      text.setAttribute('fill', 'white');
      text.setAttribute('font-size', '12');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('alignment-baseline', 'middle');
      text.textContent = `${s.length.toFixed(2)} m`;
      svgEl.appendChild(text);
    });

    container.nativeElement.appendChild(svgEl);
    return total;
  }

  generateSVG(dim: SVGDimensions, containerWidth: number, containerHeight: number): string {
  if(this.c()==2)
  {
    const padding = 1;
    const width = containerWidth+20 ;
    const height = containerHeight ;

    const sideWidth = width / 2 - 10;
    const topWidth = width / 2 - 10;

    const maxLength = dim.length || dim.radius * 2 || 1;
    const maxBreadth = dim.breadth || dim.radius * 2 || 1;
    const maxDepth = dim.depth || 1;

    const scaleSide = Math.min(sideWidth / maxLength, height / maxDepth);
    const scaleTop = Math.min(topWidth / maxLength, height / maxBreadth);

    let fillColor = 'rgba(58,152,225,0.86)';
    if (dim.systemType.includes('Pit')) fillColor = 'rgba(58,152,225,0.86)';
    else if (dim.systemType.includes('Shaft')) fillColor = 'rgba(58,152,225,0.86)';
    else if (dim.systemType.includes('Barrel')) fillColor = 'rgba(58,152,225,0.86)';

    const sideX = padding + (sideWidth - (dim.length || dim.radius * 2) * scaleSide) / 2;
    const sideY = padding + 10;
    const sideHeight = (dim.depth || 1) * scaleSide;
    const sideRectWidth = (dim.length || dim.radius * 2) * scaleSide;

    const sideView = `
    <rect x="${sideX}" y="${sideY}" width="${sideRectWidth}" height="${sideHeight}" fill="${fillColor}" stroke="white" stroke-width="2"/>
    <text x="${sideX + sideRectWidth / 2}" y="${sideY + sideHeight + 15}" font-size="12" text-anchor="middle" fill="white">Length: ${dim.length || dim.radius * 2} m</text>
    <text x="${sideX - 10}" y="${sideY + sideHeight / 2}" font-size="12" fill="white" transform="rotate(-90, ${sideX - 10}, ${sideY + sideHeight / 2})">Depth: ${dim.depth || dim.radius * 2} m</text>
    <text x="${sideX + sideRectWidth / 2}" y="${sideY + sideHeight + 35}" font-size="14" text-anchor="middle" fill="white">Side View</text>
  `;

    const topX = padding + sideWidth + 20;
    const topY = padding + 10;
    const topRectWidth = (dim.length || dim.radius * 2) * scaleTop;
    const topRectHeight = (dim.breadth || dim.radius * 2) * scaleTop;

    const topView = `
    <rect x="${topX}" y="${topY}" width="${topRectWidth}" height="${topRectHeight}" fill="${fillColor}" stroke="white" stroke-width="2"/>
    <text x="${topX + topRectWidth / 2}" y="${topY + topRectHeight + 15}" font-size="12" text-anchor="middle" fill="white">Length: ${dim.length || dim.radius * 2} m</text>
    <text x="${topX + topRectWidth + 10}" y="${topY + topRectHeight / 2}" font-size="12" fill="white" text-anchor="start">Breadth: ${dim.breadth || dim.radius * 2} m</text>
    <text x="${topX + topRectWidth / 2}" y="${topY + topRectHeight + 35}" font-size="14" text-anchor="middle" fill="white">Top View</text>
  `;

    return `
    <svg width="${containerWidth+140}" height="${containerHeight}" viewBox="0 0 ${containerWidth} ${containerHeight}" xmlns="http://www.w3.org/2000/svg" style="background: transparent;">
      ${sideView}
      ${topView}
    </svg>
  `;
  }
  else{
    const padding = 40;
    const width = containerWidth - 3 * padding;
    const height = containerHeight - 3 * padding;

    const sideWidth = width / 2 - 10;
    const topWidth = width / 2 - 10;

    const maxLength = dim.length || dim.radius * 2 || 1;
    const maxBreadth = dim.breadth || dim.radius * 2 || 1;
    const maxDepth = dim.depth || 1;

    const scaleSide = Math.min(sideWidth / maxLength, height / maxDepth);
    const scaleTop = Math.min(topWidth / maxLength, height / maxBreadth);

    let fillColor = 'rgba(58,152,225,0.86)';
    if (dim.systemType.includes('Pit')) fillColor = 'rgba(58,152,225,0.86)';
    else if (dim.systemType.includes('Shaft')) fillColor = 'rgba(58,152,225,0.86)';
    else if (dim.systemType.includes('Barrel')) fillColor = 'rgba(58,152,225,0.86)';

    const sideX = padding + (sideWidth - (dim.length || dim.radius * 2) * scaleSide) / 2;
    const sideY = padding + 10;
    const sideHeight = (dim.depth || 1) * scaleSide;
    const sideRectWidth = (dim.length || dim.radius * 2) * scaleSide;

    const sideView = `
    <rect x="${sideX}" y="${sideY}" width="${sideRectWidth}" height="${sideHeight}" fill="${fillColor}" stroke="white" stroke-width="2"/>
    <text x="${sideX + sideRectWidth / 2}" y="${sideY + sideHeight + 15}" font-size="12" text-anchor="middle" fill="white">Length: ${dim.length || dim.radius * 2} m</text>
    <text x="${sideX - 10}" y="${sideY + sideHeight / 2}" font-size="12" fill="white" transform="rotate(-90, ${sideX - 10}, ${sideY + sideHeight / 2})">Depth: ${dim.depth || dim.radius * 2} m</text>
    <text x="${sideX + sideRectWidth / 2}" y="${sideY + sideHeight + 35}" font-size="14" text-anchor="middle" fill="white">Side View</text>
  `;

    const topX = padding + sideWidth + 20;
    const topY = padding + 10;
    const topRectWidth = (dim.length || dim.radius * 2) * scaleTop;
    const topRectHeight = (dim.breadth || dim.radius * 2) * scaleTop;

    const topView = `
    <rect x="${topX}" y="${topY}" width="${topRectWidth}" height="${topRectHeight}" fill="${fillColor}" stroke="white" stroke-width="2"/>
    <text x="${topX + topRectWidth / 2}" y="${topY + topRectHeight + 15}" font-size="12" text-anchor="middle" fill="white">Length: ${dim.length || dim.radius * 2} m</text>
    <text x="${topX + topRectWidth + 10}" y="${topY + topRectHeight / 2}" font-size="12" fill="white" text-anchor="start">Breadth: ${dim.breadth || dim.radius * 2} m</text>
    <text x="${topX + topRectWidth / 2}" y="${topY + topRectHeight + 35}" font-size="14" text-anchor="middle" fill="white">Top View</text>
  `;

    return `
    <svg width="${containerWidth}" height="${containerHeight}" viewBox="0 0 ${containerWidth} ${containerHeight}" xmlns="http://www.w3.org/2000/svg" style="background: transparent;">
      ${sideView}
      ${topView}
    </svg>
  `;
  }
  }

  rainopen()
  {
    this.bool=true;
    this.openDialog();
  }

  Aropen()
  {
    this.bool=false;
    this.openDialog();
  }
}



@Component({
  selector: 'dialog-overview-example-dialog',
  templateUrl: 'dialog.html',
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatDivider,
    MatList,
    MatListItem,

  ],
})
export class DialogOverviewExampleDialog {
  readonly dialogRef = inject(MatDialogRef<DialogOverviewExampleDialog>);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  rain:RainwaterComponentCost[];
  constructor() {
this.rain= this.data.rain as unknown as RainwaterComponentCost[];
  }


   onNoClick(): void {
    this.dialogRef.close();
  }
}
