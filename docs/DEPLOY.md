# Despliegue en Vercel

TaskFlow es una SPA de Angular con persistencia en `localStorage`: no necesita
servidor ni variables de entorno. El despliegue es estático.

## Requisitos

- Cuenta gratuita de Vercel conectada a GitHub.
- Repositorio: <https://github.com/melocotron/taskFlow>.
- Rama de producción: `main`.
- Node.js 24.x en la configuración del proyecto de Vercel.

## Configuración

El repositorio ya incluye `vercel.json`:

| Ajuste           | Valor                          |
| ---------------- | ------------------------------ |
| Framework        | Angular                        |
| Install command  | `npm ci`                       |
| Build command    | `npm run build`                |
| Output directory | `dist/taskflow/browser`        |
| Rewrites         | todas las rutas a `index.html` |

La reescritura es necesaria para que `/entrar`, `/tableros/:id` y el resto de rutas
de Angular funcionen al recargar o al abrir un enlace directo. Los archivos estáticos
se sirven antes de aplicar la reescritura.

## Primera publicación

1. En Vercel, pulsa **Add New → Project**.
2. Importa `melocotron/taskFlow`.
3. Comprueba que el framework detectado es **Angular** y que la rama de producción es
   `main`.
4. En **Settings → General → Node.js Version**, selecciona **24.x** si no lo está.
5. Pulsa **Deploy**.

Vercel asignará una URL `*.vercel.app`. No hace falta subir `dist/`: Vercel clona el
repositorio y ejecuta el build.

## Flujo de ramas

- Push a `main`: despliegue de producción.
- Push a `develop` u otra rama: preview deployment con URL propia.
- Pull request: Vercel publica una preview y la enlaza en GitHub.

El CI de GitHub Actions sigue siendo la puerta de calidad; Vercel solo construye y
publica.

## Verificación posterior

- Abrir `/entrar` y entrar con una persona.
- Recargar en `/` y en `/tableros/<id>`.
- Crear un tablero, una tarjeta y moverla.
- Confirmar que `/kitchen-sink` redirige a `/` en producción.

## Rollback

En **Deployments**, abre el despliegue anterior y elige **Promote to Production**.
También se puede revertir el commit en `main` y volver a desplegar.

## Limitaciones

- Cada visitante tiene su propio `localStorage`; no hay datos compartidos.
- No hay backend, autenticación real ni colaboración en vivo.
- El `kitchen-sink` y su laboratorio HTTP están desactivados en producción.
