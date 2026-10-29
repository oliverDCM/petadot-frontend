import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PerfilPublico } from '../../core/modelos';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/usuarios`;

  /** Solo se toman nombre, ciudad y rol, aunque el backend devolviera más campos (HU-FE-15). */
  obtenerPerfilPublico(id: number): Observable<PerfilPublico> {
    return this.http
      .get<PerfilPublico>(`${this.api}/${id}/perfil-publico`)
      .pipe(map(({ nombre, ciudad, rol }) => ({ nombre, ciudad: ciudad ?? null, rol })));
  }
}
