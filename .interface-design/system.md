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
| `app-card`      | relleno 12px 16px · radio 8px · mínimo 56px · con turno, izq. 26px         |
| `app-badge`     | alto 20px · relleno 0 8px · radio completo · 11px/500                      |
| `app-avatar`    | 32px (`sm` 24px) · radio completo · iniciales 11px/600                     |
| `app-skeleton`  | líneas de 12px · radio 4px · última línea al 60%                           |
| `app-menu`      | panel 200px mín. · relleno 4px · radio 8px · sombra de overlay             |
| `app-toast`     | 280–420px · relleno 8px · radio 8px · sombra de overlay                    |

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
- **La lengüeta vive dentro de `app-card`, no fuera.** Si se pudiera olvidar, alguien la
  olvidaría. Y el color viaja siempre con el nombre de la persona, visible o en
  `.visualmente-oculto`: ningún dato se transmite solo por color.
- **`app-avatar` no lleva anillo.** Dos iniciales sobre el tono del turno, o fondo hundido
  si no hay turno. El anillo arcoíris quedó rechazado en la exploración inicial.
- **Lo que el CDK renderiza en un overlay lleva estilos de componente, no globales.** Un
  `<div class="menu">` suelto dentro de un `ng-template` no recibió los estilos del
  archivo global: el panel salía como texto plano. `app-menu` y `button[appMenuItem]`
  existen precisamente para que la piel viaje con el componente.
- **La acción de un menú escucha en el propio `<button>`, nunca por encima.** El CDK cierra
  el menú al pulsar, y cerrarlo destruye la vista del overlay. Un `(click)` en un elemento
  que envuelva al botón se va con esa vista antes de que el clic acabe de propagarse: la
  acción no se ejecuta, sin error ni aviso. Por eso `appMenuItem` se aplica al `<button>`
  nativo, igual que `appButton` y `appIconButton`.
- **Los overlays son la única superficie con sombra.** Todo lo demás se apoya en filetes;
  un diálogo o un menú flota de verdad y la sombra lo dice.

## Revisión de craft (S1.6)

Los cuatro chequeos de la skill, pasados sobre `/kitchen-sink` con capturas reales
(escritorio, móvil a 390px y una captura con `blur(6px)` para el squint test).

| Chequeo       | Resultado                                                                                                                                                       |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Squint**    | La jerarquía aguanta desenfocada: título, secciones y rejilla se distinguen sin leer. Ningún borde grita.                                                       |
| **Swap**      | Cambiar Fraunces por una sans y el papel por gris dejaría una página de design system genérica. La identidad la llevan el papel cálido, la serif y la lengüeta. |
| **Signature** | La lengüeta aparece en tres sitios del catálogo y en toda tarjeta del producto; los cinco tonos de turno están en la paleta y en los avatares.                  |
| **Token**     | `--viruta`, `--madera`, `--hierro`, `--cinta`, `--tiza`, `--lapiz`, `--turno-*`. Leídos en voz alta pertenecen a un taller, no a cualquier proyecto.            |

**Defectos encontrados y corregidos:**

1. **`viruta-50` era invisible** en su propia ficha (la ficha usaba `surface-raised`, que
   _es_ `viruta-50`). Se añadió un rayado diagonal de 1px sobre la muestra: ahora se lee
   cualquier tono, incluido el casi blanco. Sin esto, la página mentía sobre tres colores.
2. **Contraste 2.74:1 en "sin asignar"** y en los placeholders, por usar `text-disabled`.
   Esa tinta es para controles deshabilitados —que WCAG exime— no para contenido. Pasaron
   a `text-muted` (6.48:1).
3. **Ritmo plano**: diez secciones con el mismo hueco y el mismo peso. Se añadieron dos
   cortes de grupo —_Fundamentos_ y _Componentes_— que separan las dos mitades de la página.

**Contrastes medidos** (no estimados): texto principal 14.04:1 · secundario 5.29:1 ·
atenuado 6.48:1 · sobre acento 5.63:1 · sobre peligro 5.51:1 · sobre señal 7.25:1 ·
sobre información 5.09:1. Todos por encima de 4.5:1.

## Revisión de craft (S4.4)

Pulido sobre las pantallas reales, sin cambiar la dirección. Las reglas que salieron de
esta pasada:

- **Los avisos flotan por encima del overlay.** El CDK 22 usa la Popover API para sus
  overlays; en esa capa el `z-index` deja de ordenar. `OVERLAY_DEFAULT_CONFIG` desactiva
  `usePopover` y el aviso usa `--z-toast: 1100` sobre el contenedor del CDK (1000).
- **Un aviso también es contenido.** Vive como hijo directo de `body`, con
  `role="status"` y `aria-live="polite"`, para que el diálogo no lo oculte del árbol de
  accesibilidad. El bloque diferido se adelanta con `when hayAvisos()`: la cola no espera
  al ocio ni caduca antes de verse.
- **El scroll del lienzo no mueve la página.** `contain: paint` en `.columnas` encierra
  el desbordamiento del grid. En móvil, el encabezado queda quieto y solo se desplazan
  las columnas; el scroll interno sigue disponible.
- **La navegación secundaria también tiene blanco táctil.** «← Todos los tableros» mide
  40 px de alto y responde al hover; el texto sigue en `caption` y `text-muted`.
- **Las tarjetas de entrada responden.** `hover`/`focus-visible` cambian el filete a
  `border-color-strong`; `active` baja a `surface-sunken`. Mismo lenguaje que la lista
  de tableros: el borde, no la sombra.
- **Añadir es una acción, no una tarjeta.** «Añadir tarjeta» lleva un `+` de trazo,
  `aria-hidden`, para distinguirla del contenido que tiene encima.
- **La X de un aviso hereda el tono.** Sobre acento y peligro usa `--text-on-accent` /
  `--text-on-danger`; el `text-secondary` por defecto quedaba casi invisible.

## Fuera de alcance (por ahora)

- **Modo oscuro.** No en v1. Se decidirá con tokens, no con CSS duplicado.
- Ilustraciones y fotografía.
- Iconografía propia completa: se parte de un set lineal de 1.5px de trazo.

## Siguiente paso

Fase 4 cerrada. El sistema visual queda congelado salvo enmienda; la Fase 5 define su
alcance con el usuario.
