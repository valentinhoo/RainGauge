import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { toLonLat } from 'ol/proj';

interface DailyResponse {
  daily: {
    time: string[];
    precipitation_sum: number[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class RainfallFetchService {
  private forecastUrl = 'https://api.open-meteo.com/v1/forecast';
  private archiveUrl = 'https://archive-api.open-meteo.com/v1/archive';

  constructor(private http: HttpClient) {}

  private formatDate(d: Date): string {
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  }

  private getMonthName(dateStr: string): string {
    return new Date(dateStr).toLocaleString('default', { month: 'long' });
  }

  fetchRainfall(x: number, y: number, startDate: Date): {
    daily: Observable<{ date: string; value: number }[]>,
    monthly: Observable<Record<string, number>>,
    yearly: Observable<Record<number, number>>
  } {
    const [lon, lat] = toLonLat([x, y]);
    const dailyStart = this.formatDate(startDate);
    const dailyEndDate = new Date(startDate);
    dailyEndDate.setDate(dailyEndDate.getDate() + 15);
    const dailyEnd = this.formatDate(dailyEndDate);

    const daily$: Observable<{ date: string; value: number }[]> = this.http
      .get<DailyResponse>(`${this.forecastUrl}?latitude=${lat}&longitude=${lon}&daily=precipitation_sum&start_date=${dailyStart}&end_date=${dailyEnd}&timezone=auto`)
      .pipe(
        map(res => {
          const { time = [], precipitation_sum = [] } = res.daily || {};
          return time.map((dateStr, i) => {
            const d = new Date(dateStr);
            const day = d.getDate();
            const month = d.toLocaleString('default', { month: 'short' });
            return {
              date: `${day} ${month}`,
              value: precipitation_sum[i] ?? 0
            };
          });
        }),
        catchError(() => of([]))
      );
    const currentYear = startDate.getFullYear();
    const last5Years = [
      currentYear - 1,
      currentYear - 2,
      currentYear - 3,
      currentYear - 4,
      currentYear - 5
    ];

    const historicalObservables: Observable<DailyResponse>[] = last5Years.map(year => {
      const start = `${year}-01-01`;
      const end = `${year}-12-31`;
      return this.http
        .get<DailyResponse>(`${this.archiveUrl}?latitude=${lat}&longitude=${lon}&start_date=${start}&end_date=${end}&daily=precipitation_sum&timezone=auto`)
        .pipe(
          catchError(() => of({ daily: { time: [], precipitation_sum: [] } }))
        );
    });

    const yearly$: Observable<Record<number, number>> = new Observable(observer => {
      forkJoin(historicalObservables).subscribe(resArray => {
        let totalSum = 0;
        let validYears = 0;

        resArray.forEach(res => {
          const { time = [], precipitation_sum = [] } = res.daily;
          if (time.length > 0) {
            const monthlyTotals: Record<string, number> = {};
            time.forEach((dateStr, i) => {
              const month = dateStr.slice(0, 7); // YYYY-MM
              if (!monthlyTotals[month]) monthlyTotals[month] = 0;
              monthlyTotals[month] += precipitation_sum[i];
            });

            const yearlyTotal = Object.values(monthlyTotals).reduce((a, b) => a + b, 0);
            totalSum += yearlyTotal;
            validYears++;
          }
        });

        const avg = validYears > 0 ? Math.round(totalSum / validYears) : 0;
        observer.next({ [currentYear]: avg });
        observer.complete();
      });
    });

    const monthly$: Observable<Record<string, number>> = historicalObservables[0].pipe(
      map(res => {
        const monthlyTotals: Record<string, number> = {};
        const { time = [], precipitation_sum = [] } = res.daily;
        time.forEach((dateStr, i) => {
          const monthName = this.getMonthName(dateStr);
          if (!monthlyTotals[monthName]) monthlyTotals[monthName] = 0;
          monthlyTotals[monthName] += precipitation_sum[i];
        });

        return monthlyTotals;
      })
    );

    return {
      daily: daily$,
      monthly: monthly$,
      yearly: yearly$
    };
  }
}
