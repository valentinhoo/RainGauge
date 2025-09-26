import { Injectable } from '@angular/core';

export interface RechargeRecommendation {
  systemType: string;
  numberOfUnits: number;
  dimensionsPerUnit: string;
  totalWaterHandledL: number;
  annualWaterHandledL: number;
  notes: string;
  estimatedCostINR: number;
  materials: string[];
  filterType: string;

  length: number;
  breadth: number;
  depth: number;
  radius: number;

  costBreakdown: {
    unitCost: number;
    unitsCost: number;
    pipeCost: number;
    filterCost: number;
    subtotal: number;
    contingencyPercent: number;
    totalWithContingency: number;
    lowEstimate: number;
    highEstimate: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class Arcalc {
  systemType: 'Barrel' | 'Pit' | 'Shaft'='Pit';

  constructor() { }

  getRecommendation(
    roofArea: number,
    monthlyRainfall: number[],
    spaceAvailable: number
  ): RechargeRecommendation {

    const avgMonthlyRainfall = monthlyRainfall.reduce((a, b) => a + b, 0) / monthlyRainfall.length;
    const avgMonthlyWaterL = roofArea * avgMonthlyRainfall * 0.4; // liters
    const annualWaterL = avgMonthlyWaterL * 12;

    // Capacities (L)
    const BARREL_CAP_L = 200;
    const PIT_CAP_L = 4500;
    const SHAFT_CAP_L = 15000;

// Costs (INR) – updated cheaper realistic prices
    const BARREL_UNIT_COST = 3000;   // was 4500
    const PIT_UNIT_COST = 15000;     // was 20000
    const SHAFT_UNIT_COST = 80000;   // was 120000
    const PIPE_COST = 1000;          // was 1500
    const FILTER_COST = 2000;        // was 3000
    const CONTINGENCY_PERCENT = 20;

    let systemType = '';
    let dimensions = '';
    let materials: string[] = [];
    let filterType = '';
    let length = 0, breadth = 0, depth = 0, radius = 0;
    const numberOfUnits = 1;
    let unitCost = 0;
    let unitsCost = 0;
    const pipeCost = PIPE_COST;
    const filterCost = FILTER_COST;

     if (avgMonthlyWaterL <= BARREL_CAP_L * 3) {
       systemType = 'Barrel';
      // numberOfUnits = Math.min(3, Math.max(1, Math.ceil(avgMonthlyWaterL / BARREL_CAP_L)));
      radius = 0.3;
      depth = 0.9;
      dimensions = `~200 L per barrel (Ø${(radius * 2).toFixed(2)} m × ${depth} m tall)`;
      materials = ['Plastic barrel', 'PVC pipe', 'First-flush diverter', 'Stand'];
      filterType = 'First-flush diverter';
      unitCost = BARREL_UNIT_COST;
      unitsCost = unitCost * numberOfUnits;

    } else if (avgMonthlyWaterL <= PIT_CAP_L * 3) {
       systemType = 'Pit';
      // numberOfUnits = Math.min(3, Math.max(1, Math.ceil(avgMonthlyWaterL / PIT_CAP_L)));
      const volumePerPit = avgMonthlyWaterL / numberOfUnits; // liters
      const maxSide = Math.min(Math.sqrt(spaceAvailable), 2); // m
      const side = Math.min(Math.sqrt(volumePerPit / 1), maxSide); // footprint m
      length = side;
      breadth = side;
      depth = Math.min(Math.max(volumePerPit / (side * side), 1), 3); // 1–3 m depth
      dimensions = `${length.toFixed(2)} × ${breadth.toFixed(2)} × ${depth.toFixed(2)} m (≈${Math.round(volumePerPit)} L per pit)`;
      materials = ['Stones', 'Gravel', 'Sand', 'Geotextile', 'PVC pipe'];
      filterType = 'Sand + gravel';
      unitCost = PIT_UNIT_COST;
      unitsCost = unitCost * numberOfUnits;

    } else if (avgMonthlyWaterL <= SHAFT_CAP_L * 3) {
       systemType = 'Shaft';
      // numberOfUnits = Math.min(3, Math.max(1, Math.ceil(avgMonthlyWaterL / SHAFT_CAP_L)));
      radius = 0.5;
      const volumePerShaft = avgMonthlyWaterL / numberOfUnits;
      depth = Math.min(Math.max(volumePerShaft / (Math.PI * radius ** 2), 5), 15); // 5–15 m
      dimensions = `Ø${(radius * 2).toFixed(2)} m × ${depth.toFixed(2)} m deep (≈${Math.round(volumePerShaft)} L per shaft)`;
      materials = ['Concrete rings', 'Gravel pack', 'Filter mesh', 'PVC pipe'];
      filterType = 'Gravel + mesh';
      unitCost = SHAFT_UNIT_COST;
      unitsCost = unitCost * numberOfUnits;

    } else {
       systemType = 'Shaft';
      // numberOfUnits = 3;
      radius = 0.5;
      depth = 15;
      dimensions = `Ø${(radius * 2).toFixed(2)} m × ${depth} m deep per shaft`;
      materials = ['Concrete rings', 'Gravel pack', 'Filter mesh', 'PVC pipe'];
      filterType = 'Gravel + mesh';
      unitCost = SHAFT_UNIT_COST;
      unitsCost = unitCost * numberOfUnits;
    }

     const subtotal = unitsCost + pipeCost + filterCost;
    const contingency = Math.round((subtotal * CONTINGENCY_PERCENT) / 100);
    const totalWithContingency = subtotal + contingency;
    const lowEstimate = Math.round((subtotal * 0.85) + contingency);
    const highEstimate = Math.round((subtotal * 1.15) + contingency);

    const notes = `Flexible dimensions used, max 3 units per system. Avg monthly harvest: ${Math.round(avgMonthlyWaterL)} L. Annual harvest: ${Math.round(annualWaterL)} L. Costs include ${CONTINGENCY_PERCENT}% contingency.`;

    return {
      systemType,
      numberOfUnits,
      dimensionsPerUnit: dimensions,
      totalWaterHandledL: Math.round(avgMonthlyWaterL),
      annualWaterHandledL: Math.round(annualWaterL),
      notes,
      estimatedCostINR: totalWithContingency,
      materials,
      filterType,
      length,
      breadth,
      depth,
      radius,
      costBreakdown: {
        unitCost: Math.round(unitCost),
        unitsCost: Math.round(unitsCost),
        pipeCost: Math.round(pipeCost),
        filterCost: Math.round(filterCost),
        subtotal: Math.round(subtotal),
        contingencyPercent: CONTINGENCY_PERCENT,
        totalWithContingency: Math.round(totalWithContingency),
        lowEstimate: Math.round(lowEstimate),
        highEstimate: Math.round(highEstimate)
      }
    };
  }
}
