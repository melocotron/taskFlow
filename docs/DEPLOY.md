# Despliegue

TaskFlow se publica como una sola imagen Go que sirve Angular y la API desde el mismo
origen, con PostgreSQL en Neon. Hay dos entornos:

1. **Staging:** `https://taskflow-stg-melocotron.fly.dev`.
2. **Producción:** `https://taskflow-prod-melocotron.fly.dev`.

La 1.0 quedó como antecedente. El proyecto de Vercel se conserva solo como
redirección a producción; puede eliminarse manualmente desde su panel cuando ya no se
necesite.

## 1. Requisitos del destino

- Docker Desktop para desarrollo y para construir la imagen.
- Cuenta de Neon con una base PostgreSQL 17.
- Go 1.27.3 o superior si se ejecuta fuera de Docker.
- Un proveedor de contenedores: Fly.io (recomendado) o Render.
- Dominio propio o subdominio para el origen único. Para staging se puede usar el
  subdominio `*.fly.dev`.
- En Fly.io, un método de pago si la máquina debe permanecer encendida: el plan trial
  detiene las máquinas a los 5 minutos.

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

La imagen arranca la API en `:8080` y sirve Angular desde `STATIC_DIR`. El comando por
defecto se declara con `CMD ["taskflow-api"]`, no con `ENTRYPOINT`: Fly.io añade el
comando de release como argumento. Con `ENTRYPOINT`, el release ejecutaría
`taskflow-api taskflow-migrate` y arrancaría la API en lugar de aplicar las
migraciones.

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

El repositorio incluye `fly.toml` con el Dockerfile, el puerto interno, el release
command y un health check. El binario se llama `flyctl`; si la instalación creó el
alias `fly`, ambos son equivalentes.

Entornos actuales:

| Entorno    | App                        | URL                                        | Rama de Neon           |
| ---------- | -------------------------- | ------------------------------------------ | ---------------------- |
| Staging    | `taskflow-stg-melocotron`  | `https://taskflow-stg-melocotron.fly.dev`  | `Stagging`             |
| Producción | `taskflow-prod-melocotron` | `https://taskflow-prod-melocotron.fly.dev` | `Production` (default) |

Ambas apps usan la región `iad`. `fly.toml` contiene la configuración de staging; para
producción se cambia la app con `-a`:

```bash
flyctl apps create taskflow-stg-melocotron
flyctl secrets set DATABASE_URL="postgres://..." \
  ALLOWED_ORIGINS="https://taskflow-stg-melocotron.fly.dev" \
  -a taskflow-stg-melocotron
flyctl deploy -a taskflow-stg-melocotron --ha=false

flyctl apps create taskflow-prod-melocotron
flyctl secrets set DATABASE_URL="postgres://..." \
  ALLOWED_ORIGINS="https://taskflow-prod-melocotron.fly.dev" \
  -a taskflow-prod-melocotron
flyctl deploy -a taskflow-prod-melocotron --ha=false
```

Mantén una app y una base por entorno; no reutilices la base de staging.

Comprobaciones:

```bash
curl https://taskflow-stg-melocotron.fly.dev/healthz
curl https://taskflow-stg-melocotron.fly.dev/readyz

curl https://taskflow-prod-melocotron.fly.dev/healthz
curl https://taskflow-prod-melocotron.fly.dev/readyz
```

`/readyz` comprueba PostgreSQL; si falla, no envíes tráfico a la instancia. El health
check de Fly usa `/healthz` para no reiniciar la máquina por una caída transitoria de
Neon.

En el plan trial de Fly, la máquina se detiene a los 5 minutos de inactividad y se
reactiva con la primera petición (cold start de aproximadamente 1 segundo). Para
mantenerla siempre encendida y evitar ese arranque hay que añadir un método de pago.

## 6. Neon

1. Crea un proyecto PostgreSQL 17.
2. Deja `Production` como rama principal y crea `Stagging` para staging. El nombre
   `Stagging` es el que existe hoy en Neon; se puede renombrar a `staging` sin cambiar
   la cadena.
3. Copia la cadena de **conexión directa** con `sslmode=require`; evita la cadena
   `-pooler` para el release command. Neon añade `channel_binding=require`; pgx lo
   acepta.
4. Configúrala como secreto del proveedor; no la escribas en el repositorio.
5. Ejecuta `taskflow-migrate` una vez por release.
6. Programa una copia de seguridad o usa la retención de Neon.

La API y `taskflow-migrate` comparten `DATABASE_URL`. Si más adelante quieres usar la
conexión pooled para la API, añade una variable separada para las migraciones antes de
cambiar la cadena. Para staging, usa una base o rama de Neon distinta. No uses la misma
base para staging y producción.

## 7. Vercel (etapa actual)

Producción ya está en Fly.io. `vercel.json` redirige cualquier ruta del proyecto de
Vercel a `https://taskflow-prod-melocotron.fly.dev`; así el dominio antiguo no sirve
una SPA sin API.

Cuando ya no se necesite:

- Elimina el proyecto de Vercel y su integración con GitHub.
- No mantengas dos producciones con datos distintos.
- No borres el proyecto de Fly ni la rama `Production` de Neon.

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

- En Fly.io: `flyctl releases` y `flyctl deploy --image <imagen-anterior>`.
- En Neon: restaura la rama o el punto de recuperación anterior.
- Si una migración es incompatible, no la deshagas a ciegas: prepara una migración
  correctiva y vuelve a desplegar. Las migraciones destructivas requieren copia previa.

## 10. Limitaciones actuales

- Staging y producción están desplegados en Fly.io + Neon. Producción usa
  `https://taskflow-prod-melocotron.fly.dev`.
- Vercel redirige a producción; el proyecto se puede eliminar manualmente.
- Ambos entornos usan subdominios `*.fly.dev`, no un dominio propio.
- No hay envío de correos, verificación de email ni recuperación de contraseña.
- No hay colaboración en tiempo real: los cambios se ven al recargar.
- `kitchen-sink` y el laboratorio HTTP siguen desactivados en producción.
