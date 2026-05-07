import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface UsuarioResponseDTO {
  id: number;
  rut: string;
  nombre: string;
}

export interface LoginResponseDTO {
  rut: string;
  nombre: string;
  authenticated: boolean;
  mensaje: string;
}

interface LoginRequestDTO {
  rut: string;
  password: string;
}

interface RegisterRequestDTO {
  rut: string;
  nombre: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly usuariosUrl = '/api/usuarios';

  constructor(private readonly http: HttpClient) {}

  login(rut: string, password: string): Observable<LoginResponseDTO> {
    return this.http.post<LoginResponseDTO>(`${this.usuariosUrl}/login`, {
      rut: rut.trim(),
      password,
    });
  }

  register(rut: string, nombre: string, password: string): Observable<UsuarioResponseDTO> {
    return this.http.post<UsuarioResponseDTO>(`${this.usuariosUrl}/register`, {
      rut: rut.trim(),
      nombre: nombre.trim(),
      password,
    });
  }

  loginWithRutOnly(rut: string): Observable<UsuarioResponseDTO> {
    return this.http.get<UsuarioResponseDTO>(`${this.usuariosUrl}/${encodeURIComponent(rut.trim())}`);
  }
}
