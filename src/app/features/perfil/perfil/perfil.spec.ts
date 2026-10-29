import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { jwtDePrueba } from '../../../../testing/jwt';
import { AuthService } from '../../../core/sesion/auth.service';
import { Perfil } from './perfil';

describe('Perfil', () => {
  it('muestra los datos de la sesión y permite cerrarla', () => {
    localStorage.clear();
    localStorage.setItem('petadopt_sesion', JSON.stringify({ token: jwtDePrueba(1), rol: 'VENDEDOR', nombre: 'Carlos', email: 'c@test.com' }));
    TestBed.configureTestingModule({ imports: [Perfil], providers: [provideRouter([]), provideHttpClient()] });
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(Perfil);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toContain('Carlos');
    expect(el.textContent).toContain('Mis publicaciones');

    [...el.querySelectorAll('button')].find((b) => b.textContent?.includes('Cerrar sesión'))!.click();
    expect(TestBed.inject(AuthService).estaAutenticado()).toBe(false);
    expect(navegar).toHaveBeenCalledWith(['/login']);
  });
});
