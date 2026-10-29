import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PerfilPublico } from '../../core/modelos';
import { UsuarioService } from './usuario.service';

describe('UsuarioService', () => {
  it('solo conserva nombre, ciudad y rol aunque el backend mande más datos', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);
    let perfil: PerfilPublico | undefined;

    TestBed.inject(UsuarioService).obtenerPerfilPublico(2).subscribe((p) => (perfil = p));
    http.expectOne((r) => r.url.endsWith('/usuarios/2/perfil-publico')).flush({
      nombre: 'Ana', ciudad: 'Bogotá', rol: 'ADOPTANTE', email: 'privado@test.com', telefono: '300',
    });

    expect(perfil).toEqual({ nombre: 'Ana', ciudad: 'Bogotá', rol: 'ADOPTANTE' });
  });
});
