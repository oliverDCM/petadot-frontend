import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type Especie = 'PERRO' | 'GATO' | 'OTRO';
export type Sexo = 'MACHO' | 'HEMBRA';
export type Estado = 'DISPONIBLE' | 'RESERVADO' | 'ADOPTADO' | 'RETIRADO';
export type Tipo = 'VENTA' | 'ADOPCION';

export interface AnimalDatos {
  nombre: string;
  especie: Especie;
  raza: string;
  edadMeses: number | null;
  sexo: Sexo;
  descripcion: string;
  fotoUrl: string;
  ciudad: string;
  vacunado: boolean;
  esterilizado: boolean;
  tipo: Tipo;
}

export interface Animal extends AnimalDatos {
  id: number;
  estado: Estado;
  vendedorId: number;
  fechaPublicacion: string;
}

@Injectable({ providedIn: 'root' })
export class AnimalService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/animales`;

  listar(): Observable<Animal[]> {
    return this.http.get<Animal[]>(this.api);
  }

  misPublicaciones(): Observable<Animal[]> {
    return this.http.get<Animal[]>(`${this.api}/mis-publicaciones`);
  }

  publicar(datos: AnimalDatos): Observable<Animal> {
    return this.http.post<Animal>(this.api, datos);
  }
}