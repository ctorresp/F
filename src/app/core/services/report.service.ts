import { Injectable, signal, Signal, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, EMPTY, timeout } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

export interface ReportItem {
  fecha: string;
  ubicacion: string;
  tipo: string;
  descripcion: string;
  rut: string;
  lat?: number;
  lng?: number;
  enlace?: string;
  multimedia?: string[];
}

interface CreateReporteRequestDTO {
  usuario: { rut: string };
  descripcion: string;
  ubicacion: {
    latitud: number;
    longitud: number;
    direccionReferencial: string;
  };
  multimedia: Array<{
    nombre: string;
    tipo: string;
    contenido: string;
  }>;
}

interface GeolocationResponse {
  enlace: string;
}

interface ReportSubmitData extends Omit<ReportItem, 'fecha' | 'lat' | 'lng' | 'enlace' | 'multimedia'> {
  fotos?: File[];
}

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private readonly reportsSignal = signal<ReportItem[]>([]);
  readonly reports: Signal<ReportItem[]> = this.reportsSignal;

  private readonly reportsUrl = '/api/reportes/enviar';
  private readonly geolocationUrl = '/api/geolocation';

  private readonly platformId = inject(PLATFORM_ID);

  constructor(private readonly http: HttpClient) {}

  loadAllReports(): Observable<ReportItem[]> {
    return this.http.get<ReportItem[]>('/api/reportes').pipe(
      tap(reports => {
        this.reportsSignal.set(reports);
      }),
      catchError(error => {
        console.error('Error cargando reportes de la BD:', error);
        return of([]);
      })
    );
  }

  addReport(report: ReportSubmitData): Observable<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return EMPTY;
    }

    return this.getCurrentPosition().pipe(
      map(position => ({
        ...report,
        fecha: new Date().toLocaleString(),
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      })),
      switchMap(fullReport =>
        this.readFilesAsBase64(fullReport.fotos ?? []).pipe(
          switchMap(multimedia => {
            const reportBody: CreateReporteRequestDTO = {
              usuario: { rut: fullReport.rut },
              descripcion: `[${fullReport.tipo}] ${fullReport.descripcion}`,
              ubicacion: {
                latitud: fullReport.lat,
                longitud: fullReport.lng,
                direccionReferencial: fullReport.ubicacion,
              },
              multimedia,
            };

            return this.http.post(this.reportsUrl, reportBody, { responseType: 'text' }).pipe(
              timeout(15000),
              switchMap(() =>
                this.http.get<GeolocationResponse>(`${this.geolocationUrl}?latitud=${fullReport.lat}&longitud=${fullReport.lng}&direccionReferencial=${encodeURIComponent(fullReport.ubicacion)}`).pipe(
                  timeout(15000),
                  catchError(error => {
                    console.warn('No se pudo obtener el enlace de geolocalización:', error);
                    return of({ enlace: `https://www.google.com/maps?q=${fullReport.lat},${fullReport.lng}` });
                  })
                )
              ),
              tap(geo => {
                const enlace = geo?.enlace || `https://www.google.com/maps?q=${fullReport.lat},${fullReport.lng}`;
                const reportWithLink: ReportItem = { ...fullReport, enlace };
                this.reportsSignal.update(reports => [...reports, reportWithLink]);
              }),
              map(() => void 0),
              catchError(error => {
                console.error('Error enviando reporte o consultando geolocalización:', error);
                return throwError(() => error);
              }),
            );
          })
        )
      )
    );
  }

  private readFilesAsBase64(files: File[]): Observable<CreateReporteRequestDTO['multimedia']> {
    return new Observable(observer => {
      if (!files.length) {
        observer.next([]);
        observer.complete();
        return;
      }

      const readers = files.map(file =>
        new Promise<{ nombre: string; tipo: string; contenido: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const [, base64] = dataUrl.split(',');
            resolve({ nombre: file.name, tipo: file.type || 'imagen', contenido: base64 });
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        })
      );

      Promise.all(readers)
        .then(results => {
          observer.next(results);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  private getCurrentPosition(): Observable<GeolocationPosition> {
    return new Observable(observer => {
      if (!navigator.geolocation) {
        observer.error('Geolocalización no soportada');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        position => observer.next(position),
        error => observer.error(error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    });
  }
}
