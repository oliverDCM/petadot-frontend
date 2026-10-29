import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { SolicitudService } from '../../solicitudes/solicitud.service';
import { Animal, AnimalService } from '../animal.service';

@Component({
  selector: 'app-catalogo',
  imports: [FormsModule, RouterLink],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.scss',
})
export class Catalogo {
  private animalService = inject(AnimalService);
  private solicitudService = inject(SolicitudService);
  protected auth = inject(AuthService);

  animales = signal<Animal[]>([]);
  cargando = signal(true);
  error = signal(false);

  // Estado de la solicitud de adopción
  animalSolicitado = signal<number | null>(null);
  mensaje = signal('');
  enviando = signal(false);
  avisoError = signal<string | null>(null);
  avisoOk = signal<string | null>(null);

  constructor() {
    this.animalService.listar().subscribe({
      next: (lista) => {
        this.animales.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }

  abrirSolicitud(id: number): void {
    this.animalSolicitado.set(id);
    this.mensaje.set('');
    this.avisoError.set(null);
    this.avisoOk.set(null);
  }

  cancelar(): void {
    this.animalSolicitado.set(null);
  }

  enviarSolicitud(): void {
    const id = this.animalSolicitado();
    if (id === null) {
      return;
    }
    const texto = this.mensaje().trim();
    if (!texto) {
      this.avisoError.set('Escribe un mensaje para el vendedor');
      return;
    }

    this.enviando.set(true);
    this.avisoError.set(null);

    this.solicitudService.enviar(id, texto).subscribe({
      next: () => {
        this.enviando.set(false);
        this.animalSolicitado.set(null);
        this.avisoOk.set('Solicitud enviada. El vendedor la revisará.');
      },
      error: (e) => {
        this.enviando.set(false);
        this.avisoError.set(e.error?.error ?? 'No se pudo enviar la solicitud');
      },
    });
  }
}