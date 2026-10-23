# Despliegue

TaskFlow tiene dos etapas de despliegue:

1. **Actual (1.0):** SPA de Angular con `localStorage`, publicada en Vercel.
2. **Destino (backend compartido):** Go sirve la build de Angular y la API desde el
   mismo origen, con PostgreSQL en Neon. Esta es la configuración de la rama
   `feature/002-shared-backend`.

Vercel no se elimina de golpe: se queda como preview de la versión estática mientras
la interfaz termina de conectarse a la API. Cuando el despliegue Go esté verificado, se
cambia la rama de producción de Vercel o se retira el proyecto.

## 1. Requisitos del destino

- Docker Desktop para desarrollo y para construir la imagen.
- Cuenta de Neon con una base PostgreSQL 17.
- Go 1.27.3 o superior si se ejecuta fuera de Docker.
- Un proveedor de contenedores: Fly.io (recomendado) o Render.
- Dominio propio o subdominio para el origen único.

## 2. Variables de entorno

| Variable          | Ejemplo                                              | Obligatoria |
| ----------------- | ---------------------------------------------------- | ----------- |
| `DATABASE_URL`    | `postgres://usuario:clave@host/neon?sslmode=require` | Sí          |
| `HTTP_ADDR`       | `:8080`                                              | No          |
| `APP_ENV`         | `production`                                         | No          |
| `COOKIE_SECURE`   | `true`                                               | No          |
| `COOKIE_NAME`     | `__Host-taskflow_session`                            | No          |
| `SESSION_TTL`     | `168h`                                               | No          |
| `ALLOWED_ORIGINS` | `https://taskflow.example.com`                       | Sí          |
| `STATIC_DIR`      | `/app/web`                                           | No          |

En producción, `APP_ENV=production` fuerza `Secure` y el nombre `__Host-` para la
cookie. `ALLOWED_ORIGINS` debe contener exactamente el origen público; no se usa CORS
porque Angular y la API comparten origen.

## 3. Imagen Docker

El `backend/Dockerfile` es multi-stage:

1. Node 24 compila Angular.
2. Go 1.27 compila `taskflow-api` y `taskflow-migrate`.
3. Alpine copia los binarios y `dist/taskflow/browser` en `/app/web`.

Construir desde la raíz:

```bash
docker build -f backend/Dockerfile -t taskflow-api .
```

La imagen arranca la API en `:8080` y sirve Angular desde `STATIC_DIR`.

## 4. Migraciones

Las migraciones **no** se ejecutan al arrancar la API: varias instancias podrían
competir. Se ejecutan como paso de release:

```bash
taskflow-migrate
```

En Fly.io, configura el comando de release:

```toml
[deploy]
  release_command = "taskflow-migrate"
```

En un despliegue manual, ejecuta el binario con el mismo `DATABASE_URL` antes de poner
la nueva versión en tráfico.

## 5. Despliegue en Fly.io

```bash
fly launch --no-deploy
fly secrets set DATABASE_URL="postgres://..." \
  APP_ENV=production \
  COOKIE_SECURE=true \
  ALLOWED_ORIGINS="https://taskflow.example.com"
fly deploy
```

Comprobaciones:

```bash
curl https://taskflow.example.com/healthz
curl https://taskflow.example.com/readyz
```

`/readyz` comprueba PostgreSQL; si falla, no envíes tráfico a la instancia.

## 6. Neon

1. Crea un proyecto PostgreSQL 17.
2. Copia la cadena de conexión con `sslmode=require`.
3. Configúrala como secreto del proveedor; no la escribas en el repositorio.
4. Ejecuta `taskflow-migrate` una vez por release.
5. Programa una copia de seguridad o usa la retención de Neon.

Para staging, usa una base o rama de Neon distinta. No uses la misma base para staging y
producción.

## 7. Vercel (etapa actual)

El repositorio conserva `vercel.json` para la SPA de 1.0. La rama de producción de
Vercel es `main`; los pushes a `develop` generan previews. La línea `$schema` de
`vercel.json` se mantiene aunque el editor muestre un aviso: no afecta al despliegue.

Cuando el backend esté en producción:

- Si Vercel se conserva para previews, mantén solo ramas de preview.
- Si se retira, elimina el proyecto y la integración de GitHub.
- No mantengas dos producciones con datos distintos.

## 8. Verificación posterior

- Abrir la aplicación en el dominio público.
- Registrarse, recargar y comprobar que la sesión sigue activa.
- Crear un tablero, una tarjeta y moverla.
- Abrir el mismo tablero desde otro navegador con la misma cuenta.
- Añadir una segunda cuenta como observadora y comprobar que no puede editar.
- Importar datos locales una vez y repetir la importación sin duplicados.
- Comprobar que `/api/v1/...` desconocido devuelve JSON 404, no `index.html`.
- Comprobar que las cookies son `HttpOnly`, `Secure` y `SameSite=Lax`.

## 9. Rollback

- En Fly.io: `fly releases` y `fly deploy --image <imagen-anterior>`.
- En Neon: restaura la rama o el punto de recuperación anterior.
- Si una migración es incompatible, no la deshagas a ciegas: prepara una migración
  correctiva y vuelve a desplegar. Las migraciones destructivas requieren copia previa.

## 10. Limitaciones actuales

- La interfaz sigue usando `localStorage`; la API ya existe, pero la integración HTTP
  está en la fase 9 de [tasks.md](../specs/002-shared-backend/tasks.md).
- No hay envío de correos, verificación de email ni recuperación de contraseña.
- No hay colaboración en tiempo real: los cambios se ven al recargar.
- `kitchen-sink` y el laboratorio HTTP siguen desactivados en producción.
