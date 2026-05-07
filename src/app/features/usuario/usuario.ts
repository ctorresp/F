import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../core/services/report.service';
import { AuthService, UsuarioResponseDTO, LoginResponseDTO } from '../../core/services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-usuario',
  templateUrl: './usuario.html',
  styleUrl: './usuario.scss',
})
export class UsuarioPage implements OnInit {
  @ViewChild('photosInput') private photosInput?: ElementRef<HTMLInputElement>;

  mode: 'login' | 'register' | 'rut-only' = 'login';
  user: UsuarioResponseDTO | null = null;

  rut = '';
  nombre = '';
  password = '';
  confirmPassword = '';

  ubicacion = '';
  tipo = 'Incendio';
  descripcion = '';
  fotos: File[] = [];
  mensaje = '';
  loading = false;
  authLoading = false;
  permissionRequested = false;
  locationAllowed = false;

  constructor(
    private readonly reportService: ReportService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.requestLocationPermission();
  }

  private requestLocationPermission(): void {
    if (!navigator.geolocation) {
      this.permissionRequested = true;
      this.locationAllowed = false;
      this.mensaje = 'Geolocalización no soportada en tu navegador.';
      return;
    }

    this.mensaje = 'Solicitando permiso de ubicación...';
    navigator.geolocation.getCurrentPosition(
      () => {
        this.permissionRequested = true;
        this.locationAllowed = true;
        this.mensaje = 'Ubicación habilitada. Ahora puedes enviar reportes.';
      },
      () => {
        this.permissionRequested = true;
        this.locationAllowed = false;
        this.mensaje = 'Debes habilitar la ubicación para enviar un reporte.';
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }

  switchMode(mode: 'login' | 'register' | 'rut-only'): void {
    this.mode = mode;
    this.mensaje = '';
    this.password = '';
    this.confirmPassword = '';
  }

  onPhotosSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fotos = input.files ? Array.from(input.files) : [];
  }

  private getAlertMessage(error: unknown, defaultMessage: string): string {
    const err = error as { error?: unknown; message?: string; status?: number };
    if (typeof err.error === 'string' && err.error.trim()) {
      return err.error;
    }
    if (err.error && typeof err.error === 'object') {
      const errorBody = err.error as { message?: string };
      if (typeof errorBody.message === 'string' && errorBody.message.trim()) {
        return errorBody.message;
      }
    }
    if (typeof err.message === 'string' && err.message.trim()) {
      return err.message;
    }
    if (err.status === 400) {
      return defaultMessage;
    }
    return defaultMessage;
  }

  private isRutFormatValid(rut: string): boolean {
    return /^[0-9]{2}\.[0-9]{3}\.[0-9]{3}-.{1}$/.test(rut.trim());
  }

  private showAlert(message: string): void {
    this.mensaje = message;
    window.alert(message);
  }

  login(): void {
    if (!this.rut.trim() || !this.password.trim()) {
      this.showAlert('Ingresa RUT y contraseña para iniciar sesión.');
      return;
    }

    this.authLoading = true;
    this.mensaje = '';

    this.authService.login(this.rut, this.password).subscribe({
      next: (response: LoginResponseDTO) => {
        if (response.authenticated) {
          this.user = { id: 0, rut: response.rut, nombre: response.nombre };
          this.mensaje = `Bienvenido ${response.nombre || response.rut}`;
        } else {
          this.showAlert(response.mensaje || 'Credenciales no válidas.');
        }
        this.authLoading = false;
      },
      error: (error) => {
        console.error('Error en login:', error);
        const message = this.getAlertMessage(error, 'No se encontró el usuario o la contraseña es incorrecta.');
        this.showAlert(message);
        this.authLoading = false;
      }
    });
  }

  register(): void {
    if (!this.rut.trim() || !this.nombre.trim() || !this.password.trim()) {
      this.showAlert('Completa RUT, nombre y contraseña para registrarte.');
      return;
    }

    if (this.password.length < 6) {
      this.showAlert('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.showAlert('Las contraseñas no coinciden.');
      return;
    }

    this.authLoading = true;
    this.mensaje = '';

    this.authService.register(this.rut, this.nombre, this.password).subscribe({
      next: (response: UsuarioResponseDTO) => {
        this.user = response;
        this.mensaje = `Registro exitoso. Bienvenido ${response.nombre}.`;
        this.authLoading = false;
      },
      error: (error) => {
        console.error('Error en registro:', error);
        const message = this.getAlertMessage(error, 'Error registrando usuario. Intenta de nuevo.');
        this.showAlert(message);
        this.authLoading = false;
      }
    });
  }

  enterWithRut(): void {
    const rut = this.rut.trim();
    if (!rut) {
      this.showAlert('Ingresa tu RUT para continuar.');
      return;
    }

    if (!this.isRutFormatValid(rut)) {
      this.showAlert('RUT inválido. Debe tener el formato 123.456.789-0.');
      return;
    }

    this.user = { id: 0, rut, nombre: '' };
    this.mensaje = `Acceso con RUT válido: ${rut}`;
    this.authLoading = false;
  }

  logout(): void {
    this.user = null;
    this.rut = '';
    this.nombre = '';
    this.password = '';
    this.confirmPassword = '';
    this.mensaje = '';
  }

  enviarReporte(): void {
    if (!this.user) {
      this.mensaje = 'Debes iniciar sesión con tu RUT para enviar reportes.';
      return;
    }

    if (!this.locationAllowed) {
      this.mensaje = 'No puedes enviar reportes sin permiso de ubicación.';
      return;
    }

    if (!this.user.rut.trim()) {
      this.mensaje = 'RUT de usuario no está disponible.';
      return;
    }

    if (!this.ubicacion.trim() || !this.descripcion.trim()) {
      this.mensaje = 'Completa la ubicación y descripción antes de enviar.';
      return;
    }

    this.loading = true;
    this.mensaje = '';

    this.reportService.addReport({
      rut: this.user.rut,
      ubicacion: this.ubicacion.trim(),
      tipo: this.tipo,
      descripcion: this.descripcion.trim(),
      fotos: this.fotos,
    }).subscribe({
      next: () => {
        this.mensaje = 'Reporte enviado, servicios de emergencia avisados';
        this.ubicacion = '';
        this.descripcion = '';
        this.tipo = 'Incendio';
        this.fotos = [];
        if (this.photosInput) {
          this.photosInput.nativeElement.value = '';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error enviando reporte:', error);
        this.mensaje = 'Error enviando reporte. Intenta de nuevo.';
        this.loading = false;
      }
    });
  }
}
