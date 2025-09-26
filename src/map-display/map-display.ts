import {Component, inject, OnInit, signal} from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import {XYZ} from 'ol/source';
import {MatButtonModule, MatFabButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {fromLonLat} from 'ol/proj';
import {Draw} from 'ol/interaction';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import {Polygon} from 'ol/geom';
import {Coordinate} from 'ol/coordinate';
import {getArea} from 'ol/sphere';

import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import {MatInputModule} from '@angular/material/input';
import {FormsModule} from '@angular/forms';
import {MatSelectModule} from '@angular/material/select';
import {RainfallFetchService} from '../services/rainfall-fetch-service';
import {Router} from '@angular/router';
import {SharedFiles} from '../services/shared-files';
import {Compute} from '../services/compute';

export interface DialogData {
  Rarea: any;
  Rcoord: Coordinate;
  Farea: any;
  Fcoord: Coordinate;
  layer:VectorLayer;
}

@Component({
  selector: 'app-map-display',
  imports: [
    MatFabButton,
    MatIcon
  ],
  templateUrl: './map-display.html',
  styleUrl: './map-display.css'
})
export class MapDisplay implements OnInit {
  readonly dialog = inject(MatDialog);
  map!: Map;
  roofLayer!:VectorLayer;
  freeSpaceLayer!:VectorLayer;
  drawObj!:Draw;
  roofArea!:number;
  roofCords!:Coordinate;
  freeSpaceArea!:number;
  freeSpaceCords!:Coordinate;
  dRoof:boolean=true
  text= signal<string|null>("Draw polygon around your roof");
  a:boolean=false;
  b:boolean=false;
  c:boolean=false;

  openDialog(): void {
    const dialogRef = this.dialog.open(dialogC, {
      disableClose:true,
      data: {
        Rarea: this.roofArea,
        Rcoord: this.roofCords,
        Farea: this.freeSpaceArea,
        Fcoord: this.freeSpaceCords,
        layer:this.roofLayer
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result) {
        this.redoAll()
      }
      else return;
    });
  }
  zoomIN()
  {
    const view = this.map.getView();
    view.setZoom(view.getZoom()! + 1);
  }
  zoomOUT()
  {
    const view = this.map.getView();
    view.setZoom(view.getZoom()! - 1);
  }
  constructor() {}

  ngOnInit() {
    this.map = new Map({
      controls: [],
      target: 'map',
      layers: [
        new TileLayer<XYZ>(
          {
            source: new XYZ({
              url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
              maxZoom: 18,
            })
          },
        ),
        new TileLayer<XYZ>(
          {
            source: new XYZ({
              url: 'https://{a-c}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png'
            })
          },//Labels for the map (source better ones)
        ),
      ],
      view: new View({
        center: [0, 0],
        zoom: 2
      }),
    });
    this.getCurrentLocation();
    this.startdrawRoof();

  }


  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lon = position.coords.longitude;
        const lat = position.coords.latitude;

        const view = this.map.getView();
        view.setCenter(fromLonLat([lon, lat]));
        view.setZoom(20);
      }, (error) => {
        console.error('Geolocation error:', error);
      });
    } else {
      console.error('Geolocation not supported by this browser.');
    }
  }

  startdrawRoof()
  {
    this.text.set("Draw Polygon around your roof");
    const Source = new VectorSource();
    const vector = new VectorLayer(
      {
        source: Source
      }
    )
    this.roofLayer=vector;
    const draw = new Draw({
      source: Source,
      type:'Polygon',

    })
    this.drawObj=draw;
    this.drawObj.on('drawend',(event)=>
    {
      this.map.removeInteraction(this.drawObj);
      const geo=event.feature.getGeometry() as Polygon;
      this.roofArea = geo.getArea();
      this.roofCords=geo.getFirstCoordinate()
      console.log(this.roofArea,this.roofCords);
      this.startdrawFreeSpace();
      this.a=true;
    })
    this.map.addLayer(vector);
    this.map.addInteraction(draw);
  }
  startdrawFreeSpace()
  {
    this.c=true;
    this.text.set("Draw Polygon around Free Space available");
    const Source = new VectorSource();
    const vector = new VectorLayer(
      {
        source: Source
      }
    )
    this.freeSpaceLayer=vector;
    const draw = new Draw({
      source: Source,
      type:'Polygon',

    })
    this.drawObj=draw;
    this.drawObj.on('drawend',(event)=>
    {
      this.map.removeInteraction(this.drawObj);
      const geo=event.feature.getGeometry() as Polygon;
      this.freeSpaceArea =geo.getArea();
      this.freeSpaceCords=geo.getFirstCoordinate();
      console.log(this.freeSpaceArea,this.freeSpaceCords);
      this.b=true;
    })
    this.map.addLayer(vector);
    this.map.addInteraction(draw);
  }
  skip()
  {
    this.openDialog();
  }
  redo()
  {
    this.a=false;
    this.b = false;
    this.c = false;
    this.map.removeInteraction(this.drawObj);
    this.map.removeLayer(this.roofLayer);
    this.map.removeLayer(this.freeSpaceLayer);
    this.startdrawRoof();

  }
  confirm()
  {
    this.openDialog();
  }
  redoAll()
  {
    this.map.removeLayer(this.roofLayer);
    this.map.removeLayer(this.freeSpaceLayer);
    this.dRoof=true;
    this.startdrawFreeSpace();
  }

}

interface list
{
  value:number;
  name:string;
}
@Component({
  selector: 'dialogC',
  templateUrl: 'dialogC.html',
  styleUrl:'dialogC.css',
  imports: [
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatSelectModule,
    MatDialogClose,
  ],
})
export class dialogC {
  constructor(private Rain:RainfallFetchService,private shared:Compute,private router:Router) {
  }
  readonly dialogRef = inject(MatDialogRef<dialogC>);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  roofMaterials:list[]=
    [
      { value: 0.90, name: 'Corrugated Galvanized Iron (CGI)' },
      { value: 0.80, name: 'Asbestos Sheets' },
      { value: 0.70, name: 'Concrete (RCC)' },
      { value: 0.75, name: 'Clay Tiles' },
      { value: 0.70, name: 'Concrete Tiles' },
      { value: 0.75, name: 'Mangalore Tiles' },
      { value: 0.70, name: 'Slate Stones' },
      { value: 0.55, name: 'Thatch (Grass or Palm Leaves)' },
      { value: 0.85, name: 'Metal Sheet Roof with Insulation' },
      { value: 0.65, name: 'Terrace Garden / Green Roof' },
      { value: 0.70, name: 'Bitumen / Tar Roof' },
      { value: 0.65, name: 'Solar Panel Roof (on RCC)' },
      { value: 0.75, name: 'PVC Sheet Roof' },
      { value: 0.80, name: 'Fibre Cement Sheet Roof' }
    ]



  onNoClick(): void {
    this.dialogRef.close();
  }
  confirm(coe:number,bill:number,usage:number)
  {
    const D:Date=new Date('2025-09-21');
    const rainfallData = this.Rain.fetchRainfall(this.data.Rcoord[0], this.data.Rcoord[1],D);
    let d=0
    let y=0;
    let m=0;

    rainfallData.daily.subscribe((dai: any) => {
      d = dai;
      console.log('Daily (0-16 days):', d)
    });
    rainfallData.monthly.subscribe((mon: any) => {
      m=mon;
      console.log('Monthly approximation:', m)
    });
    rainfallData.yearly.subscribe((yer: any) => {
      y=yer;
      console.log('Yearly approximation:', y)
      this.shared.setValues(this.data.Rarea,this.data.Farea,this.data.Rcoord,coe,d,m,y,bill,usage,this.data.layer);
      this.dialogRef.close();
    });



  }

  protected readonly Number = Number;
}
