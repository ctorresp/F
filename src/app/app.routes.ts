import type { Route } from '@angular/router';
import { AdminPage } from './features/admin/admin';
import { UsuarioPage } from './features/usuario/usuario';

export const routes: Route[] = [
  { path: '', redirectTo: 'usuario', pathMatch: 'full' },
  { path: 'usuario', component: UsuarioPage },
  { path: 'admin', component: AdminPage },
  { path: '**', redirectTo: 'usuario' },
];
