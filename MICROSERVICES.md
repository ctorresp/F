# FireWall Frontend - Integración con Microservicios

Este frontend Angular se integra con los microservicios del proyecto FireWall.

## Configuración de Microservicios

Asegúrate de que los siguientes microservicios estén corriendo:

1. **Microservicio de Reportes** (puerto 8081)
   - Endpoint: `POST /api/reports`
   - Payload: `{ usuario, descripcion, ubicacion, multimedia }`
   - El frontend puede enviar fotos en `multimedia` junto con la ubicación GPS.

2. **Microservicio de Geolocalización** (puerto 8083)
   - Endpoint: `GET /api/geolocation/link?lat={lat}&lng={lng}`
   - Respuesta: `{ enlace: "https://..." }`

3. **Microservicio de Usuarios** (puerto 8084)
   - Endpoint: `POST /api/usuarios/register` para crear cuenta con `rut`, `password` y `nombre`.
   - Endpoint: `POST /api/usuarios/login` para iniciar sesión con `rut` y `password`.
   - Endpoint: `GET /api/usuarios/{rut}` para consultar datos básicos de usuario sin exponer la contraseña.

## Funcionalidades

- **Usuario**: Envía reportes con GPS automático
- **Admin**: Ve reportes con enlaces a mapas

## Desarrollo

```bash
npm start  # Corre en http://localhost:4200
```

## Producción

```bash
npm run build
```

Los microservicios deben estar configurados con CORS para permitir requests desde `http://localhost:4200`.