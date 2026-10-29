import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Animal, AnimalDatos, AnimalDetalle, EstadoAnimal, FiltrosCatalogo } from '../../core/modelos';

@Injectable({ providedIn: 'root' })
export class AnimalService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/animales`;

  /** Catálogo público con filtros opcionales (se envían como query params). */
  listar(filtros: FiltrosCatalogo = {}): Observable<Animal[]> {
    let params = new HttpParams();
    if (filtros.especie) {
      params = params.set('especie', filtros.especie);
    }
    if (filtros.tipo) {
      params = params.set('tipo', filtros.tipo);
    }
    const ciudad = filtros.ciudad?.trim();
    if (ciudad) {
      params = params.set('ciudad', ciudad);
    }
    return this.http.get<Animal[]>(this.api, { params });
  }

  obtener(id: number): Observable<AnimalDetalle> {
    return this.http.get<AnimalDetalle>(`${this.api}/${id}`);
  }

  misPublicaciones(): Observable<Animal[]> {
    return this.http.get<Animal[]>(`${this.api}/mis-publicaciones`);
  }

  /** Con foto se envía multipart (parte "datos" en JSON + parte "foto"); sin foto, JSON normal. */
  publicar(datos: AnimalDatos, foto: File | null): Observable<Animal> {
    return foto
      ? this.http.post<Animal>(`${this.api}/con-foto`, this.formulario(datos, foto))
      : this.http.post<Animal>(this.api, datos);
  }

  editar(id: number, datos: AnimalDatos, foto: File | null): Observable<Animal> {
    return foto
      ? this.http.put<Animal>(`${this.api}/${id}/con-foto`, this.formulario(datos, foto))
      : this.http.put<Animal>(`${this.api}/${id}`, datos);
  }

  cambiarEstado(id: number, estado: EstadoAnimal): Observable<Animal> {
    return this.http.put<Animal>(`${this.api}/${id}/estado`, { estado });
  }

  private formulario(datos: AnimalDatos, foto: File): FormData {
    const form = new FormData();
    form.append('datos', new Blob([JSON.stringify(datos)], { type: 'application/json' }));
    form.append('foto', foto, foto.name);
    return form;
  }
}
