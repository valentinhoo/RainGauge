import { Routes } from '@angular/router';
import {MapDisplay} from '../map-display/map-display';
import {OverviewDisplay} from '../overview-display/overview-display';
import {RtrwhDisplay} from '../rtrwh-display/rtrwh-display';
import {ArDisplay} from '../ar-display/ar-display';

export const routes: Routes = [
  { path: '', redirectTo: 'Map', pathMatch: 'full' },
  { path: 'Map', component: MapDisplay,runGuardsAndResolvers: 'always' },
  { path: 'overview', component: OverviewDisplay,runGuardsAndResolvers: 'always' },
  { path: 'rain', component: RtrwhDisplay,runGuardsAndResolvers: 'always' },
  { path: 'ground', component: ArDisplay,runGuardsAndResolvers: 'always' },
];
