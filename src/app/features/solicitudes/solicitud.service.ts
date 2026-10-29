import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type EstadoSolicitud = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
export type Decision = 'APROBAR' | 'RECHAZAR';

export interface Solicitud {
  id: number;
  animalId: number;
  animalNombre?: string | null;
  solicitanteId: number;
  solicitanteNombre?: string | null;
  mensaje: string;
  estado: EstadoSolicitud;
  fechaSolicitud: string;
  fechaDecision: string | null;
}

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
    return this.http.post<Solicitud>(this.api, { animalId, mensaje });
  }

  decidir(id: number, decision: Decision): Observable<Solicitud> {
    return this.http.put<Solicitud>(`${this.api}/${id}/decision`, { decision });
  }
}