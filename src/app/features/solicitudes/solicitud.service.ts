import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Contacto, Decision, Solicitud } from '../../core/modelos';

@Injectable({ providedIn: 'root' })
export class SolicitudService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/solicitudes`;

  recibidas(): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(`${this.api}/recibidas`);
  }

  mias(): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(`${this.api}/mias`);
  }

  enviar(animalId: number, mensaje: string): Observable<Solicitud> {
    return this.http.post<Solicitud>(this.api, { animalId, mensaje: mensaje.trim() });
  }

  decidir(id: number, decision: Decision): Observable<Solicitud> {
    return this.http.put<Solicitud>(`${this.api}/${id}/decision`, { decision });
  }

  contacto(id: number): Observable<Contacto> {
    return this.http.get<Contacto>(`${this.api}/${id}/contacto`);
  }
}

/** Una solicitud "activa" impide enviar otra por el mismo animal. */
export const esActiva = (s: Solicitud): boolean => s.estado === 'PENDIENTE' || s.estado === 'APROBADA';
