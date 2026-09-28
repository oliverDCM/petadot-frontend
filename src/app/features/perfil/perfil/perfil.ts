import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';

interface DatosPerfil {
  email: string;
  rol: string;
}

@Component({
  selector: 'app-perfil',
  imports: [],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil {
  private http = inject(HttpClient);

  datos = signal<DatosPerfil | null>(null);
  error = signal(false);

  constructor() {
    this.http.get<DatosPerfil>(`${environment.apiUrl}/perfil`).subscribe({
      next: (d) => this.datos.set(d),
      error: () => this.error.set(true),
    });
  }
}