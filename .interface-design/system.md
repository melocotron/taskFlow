# Sistema de diseño — TaskFlow

> Contrato visual del proyecto. Si una decisión no está aquí, no está decidida.
> Guardado en S1.1 (2026-10-17). Las decisiones **no se re-discuten** sin enmienda.

## Dirección

**A · Taller.** Cálido como un banco de carpintería a media mañana.

TaskFlow no se siente como un panel de datos: se siente como un lugar donde la gente
trabaja con las manos. Papel, madera, hierro y una cinta métrica amarilla. La calma es
parte del producto: el tablero ordena el trabajo, no lo dramatiza.

**Intención en una frase:** _un equipo mirando el mismo banco de trabajo, no una
herramienta que les pide atención._

## Por qué esta dirección

Se eligió tras explorar el dominio real del kanban — el taller, el turno, el traspaso,
la cola, el riel, el atasco — y descartar los tres defaults que produce cualquier app
de tableros:

| Rechazado                                             | Sustituido por                              |
| ----------------------------------------------------- | ------------------------------------------- |
| Tarjeta blanca, radio 12, sombra suave, acento índigo | Papel cálido, filete, profundidad por tono  |
| Avatar circular con anillo arcoíris                   | Lengüeta de turno                           |
| Sidebar oscuro + topbar blanca                        | Una sola superficie; estructura por filetes |

## Firma: la lengüeta de turno

Cada tarjeta lleva una **pestaña vertical en su borde izquierdo**, del color de la
persona que la tiene. No es un avatar: es una lengüeta física, como la ficha del
operario en el banco.

```
┌─────────────────────────────┐
│▌ Revisar el copy de la home │   ▌ = lengüeta de 4px, color del turno
│  límite: viernes            │
└─────────────────────────────┘
```

- Alto: el de la tarjeta menos 12px de margen arriba y abajo.
- Ancho: **4px**. Radio: 2px. Separación del borde: 8px.
- Sin lengüeta = tarjeta sin asignar. Esa ausencia **es** información: se ve como un
  hueco, no como un gris.
- La lengüeta es el único color saturado en pantalla fuera de los estados de error.

## Paleta

**Primitivos** (los únicos hexadecimales del proyecto; viven en `src/styles/tokens/`):

| Token          | Valor     | De dónde sale                               |
| -------------- | --------- | ------------------------------------------- |
| `--viruta-50`  | `#FBF8F1` | viruta de madera clara — superficie elevada |
| `--viruta-100` | `#F4EEE2` | papel de banco — superficie base            |
| `--viruta-200` | `#E9E0CF` | papel sombreado — superficie hundida        |
| `--madera-500` | `#B08968` | madera sin barnizar — secundario            |
| `--madera-700` | `#7A5C42` | madera vieja — texto secundario cálido      |
| `--hierro-900` | `#23201C` | hierro de herramienta — texto principal     |
| `--hierro-600` | `#5A544B` | hierro gastado — texto muted                |
| `--verde-600`  | `#4A6B52` | banco de trabajo — acento primario          |
| `--verde-700`  | `#3A5542` | verde profundo — hover del acento           |
| `--cinta-500`  | `#D8A61C` | cinta métrica — señal, atención             |
| `--tiza-600`   | `#4A6E8A` | tiza azul — información                     |
| `--lapiz-600`  | `#A34A38` | lápiz rojo de corrección — destructivo      |

**Colores de turno** (para la lengüeta; 5 personas máx. en la demo):

| Token            | Valor     |
| ---------------- | --------- |
| `--turno-verde`  | `#4A6B52` |
| `--turno-cinta`  | `#C08A1E` |
| `--turno-madera` | `#8C6444` |
| `--turno-tiza`   | `#4A6E8A` |
| `--turno-lapiz`  | `#A34A38` |

**Semánticos** (mapean a primitivos; los componentes solo usan estos):

`--surface-canvas` · `--surface-raised` · `--surface-sunken` · `--text-primary` ·
`--text-secondary` · `--text-muted` · `--border-subtle` · `--border-strong` ·
`--accent` · `--accent-hover` · `--signal` · `--danger` · `--info` · `--focus-ring`

**Regla dura:** un valor hexadecimal fuera de `src/styles/tokens/` es un defecto.
Ningún componente decide un color.

## Tipografía

| Rol     | Fuente            | Por qué                                               |
| ------- | ----------------- | ----------------------------------------------------- |
| Títulos | **Fraunces**      | Serif con eje óptico; tiene oficio sin ser decorativa |
| UI      | **IBM Plex Sans** | Neutra con carácter mecánico; aguanta 12px en tablas  |
| Datos   | **IBM Plex Mono** | Fechas, contadores y números tabulares                |

Escala: **ratio 1.25** desde 14px. Pesos: 400 cuerpo, 500 etiquetas, 600 títulos.

`caption 11 · body 14 · h4 16 · h3 18 · h2 22 · h1 28 · display 44`

Números dinámicos siempre con `font-variant-numeric: tabular-nums`.
Títulos con `text-wrap: balance`; cuerpo con `text-wrap: pretty`.
`-webkit-font-smoothing: antialiased` en la raíz.
Carga local vía `@fontsource` (sin red en runtime ni en tests).

## Jerarquía

- **Un foco por vista.** En un tablero, el foco no es una tarjeta: es **el tablero
  entero como unidad**. Todo lo demás se subordina.
- La jerarquía se construye con **peso y color antes que tamaño**: tres niveles a 14px
  (`600 / primario`, `500 / secundario`, `400 / muted`).
- Etiquetas de columna en `caption` con tracking `0.06em` y mayúsculas — como la
  etiqueta de un cajón.

## Espacio y densidad

Unidad base: **4px**. Escala: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`.

- Densidad: **media**. Ni tablero de control ni folleto.
- Relleno de tarjeta: 12px 16px. Separación entre tarjetas: 8px.
- Relleno de columna: 12px. Separación entre columnas: 16px.
- Superficies grandes: 24px.

## Profundidad

**Solo filetes y tono. Cero sombras.** El taller no flota: las cosas se apoyan.

- Elevación = cambio de tono (`viruta-100` → `viruta-50`) + filete de 1px.
- Filete sutil: `rgba(35, 32, 28, 0.12)`. Filete fuerte: `rgba(35, 32, 28, 0.24)`.
- Los overlays (diálogo, menú) **sí** llevan una sombra mínima, porque flotan de verdad:
  `0 8px 24px rgba(35, 32, 28, 0.12)`.
- Radios: **4px** controles · **8px** tarjetas y paneles · **12px** diálogos.
  Concéntricos: `radio_exterior = radio_interior + padding`.

## Movimiento

- Solo `transform` y `opacity`. Nunca `transition: all`.
- Duración: 120–160ms controles · 180ms popovers · 240ms diálogos.
- Curva de entrada: `cubic-bezier(0.23, 1, 0.32, 1)`. Nunca `ease-in`.
- Acciones repetidas (mover tarjetas, teclado) **sin animación**.
- `prefers-reduced-motion`: se conservan color y opacidad, se elimina el desplazamiento.

## Estados (no negociables)

Todo control: `default · hover · active · focus-visible · disabled · loading`.
Todo dato: `loading · empty · error · success`.
El foco es siempre visible: anillo de 2px `--accent` con `outline-offset: 2px`.
Área táctil mínima 40×40px (44 en móvil).

## Accesibilidad

- Contraste mínimo 4.5:1 en texto, 3:1 en elementos de interfaz.
- La lengüeta de turno **nunca** es el único portador de información: va acompañada del
  nombre de la persona.
- Navegación por teclado en el tablero: flechas entre columnas y tarjetas, `Enter` para
  abrir, `Espacio` para tomar y soltar.

## Patrones de componentes

Medidas reales, ya implementadas. Se copian de aquí, no se reinventan.

| Componente      | Medidas                                                                    |
| --------------- | -------------------------------------------------------------------------- |
| `appButton`     | alto 40px · relleno 12px · radio 4px · 14px/500 · gap 8px · `lg` 44px      |
| `appIconButton` | caja 40×40px fija (el tamaño `sm` reduce el glifo, no la caja) · radio 4px |
| `appInput`      | alto mínimo 40px · relleno 8px 12px · radio 4px · filete 1px               |
| `app-field`     | etiqueta 14px/500 · mensaje 11px · separación vertical 8px                 |

Reglas que salieron de construirlos:

- **Los botones se aplican sobre `<button>` nativo**, no sobre un contenedor. Teclado,
  foco, `disabled` y envío de formularios vienen resueltos. Excepción consciente a la
  regla de prefijo `app`, documentada en el propio archivo.
- **El estado `loading` también deshabilita.** Es lo que evita el doble envío, que es
  el bug real detrás de "se guardó dos veces".
- **La accesibilidad del campo la resuelve el campo, no quien lo usa.** `app-field`
  inyecta su contexto y el control recibe `id` y `aria-describedby` solos. Un
  formulario hecho con estos componentes no puede quedar inaccesible por descuido.
- **Con error, la ayuda se oculta.** Un lector de pantalla no debe oír dos mensajes
  contradictorios; el error manda y se anuncia con `role="alert"`.
- **Iconos: SVG de trazo 1.5px con `currentColor`.** Nunca emoji: introduce color
  fuera de la paleta y no hereda el estado del botón.

## Fuera de alcance (por ahora)

- **Modo oscuro.** No en v1. Se decidirá con tokens, no con CSS duplicado.
- Ilustraciones y fotografía.
- Iconografía propia completa: se parte de un set lineal de 1.5px de trazo.

## Siguiente paso

S1.4: superficies — `Card`, `Panel`, `Badge`, `Avatar`, `Divider`, `Skeleton`,
`EmptyState`.
