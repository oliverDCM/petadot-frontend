import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-perfil',
  imports: [],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil {
  protected auth = inject(AuthService);
}