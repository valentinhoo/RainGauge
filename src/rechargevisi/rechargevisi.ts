import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { RechargeRecommendation } from '../services/arcalc';

@Component({
  selector: 'app-rechargevisi',
  templateUrl: './rechargevisi.html',
  styleUrls: ['./rechargevisi.css']
})
export class Rechargevisi implements OnChanges {

  @Input() recommendation: RechargeRecommendation | null = null;

  length = 0;
  width = 0;
  depth = 0;
  diameter = 0;
  scale = 50; // default scale

  offsetX = 50;
  offsetY = 30;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['recommendation'] && this.recommendation) {
      this.parseDimensions();
      this.computeScale();
    }
  }

  parseDimensions() {
    if (!this.recommendation) return;

    const dimStr = this.recommendation.dimensionsPerUnit;

    if (dimStr.includes('×') && !dimStr.includes('Ø')) {
      const matches = dimStr.match(/([\d.]+)\s*×\s*([\d.]+)\s*×\s*([\d.]+)/);
      if (matches) {
        this.length = parseFloat(matches[1]);
        this.width = parseFloat(matches[2]);
        this.depth = parseFloat(matches[3]);
      }
    } else if (dimStr.includes('Ø')) {
      const matches = dimStr.match(/Ø([\d.]+)\s*m\s*×\s*([\d.]+)\s*m/);
      if (matches) {
        this.diameter = parseFloat(matches[1]);
        this.depth = parseFloat(matches[2]);
      }
    }
  }

  computeScale() {
    const maxDim = Math.max(this.length, this.width, this.diameter || 0, this.depth);
    this.scale = maxDim ? 250 / maxDim : 50;
  }
}
