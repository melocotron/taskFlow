/**
 * Reglas de arquitectura (Fase-Sliced Design adaptado a Angular).
 *
 * Estas reglas son la parte ejecutable del README de cada capa en src/app y de
 * docs/ARQUITECTURA.md. Si fallan, el build de CI falla: no son sugerencias.
 *
 * La flecha permitida es una sola:
 *   pages → widgets → features → entities → shared
 */
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment:
        'Un ciclo de imports hace que nada se pueda razonar ni aislar. Casi siempre significa que dos slices deberían ser uno.',
      from: {},
      to: { circular: true },
    },

    // ─── La flecha de capas ────────────────────────────────────────────────
    {
      name: 'shared-is-business-agnostic',
      severity: 'error',
      comment: 'shared/ no conoce el negocio. El design system no sabe qué es un Board ni un Task.',
      from: { path: '^src/app/shared/' },
      to: { path: '^src/app/(entities|features|widgets|pages)/' },
    },
    {
      name: 'entities-do-not-look-up',
      severity: 'error',
      comment: 'entities/ es la base del negocio: no importa features, widgets ni pages.',
      from: { path: '^src/app/entities/' },
      to: { path: '^src/app/(features|widgets|pages)/' },
    },
    {
      name: 'features-do-not-look-up',
      severity: 'error',
      comment: 'features/ usa entities y shared, nunca widgets ni pages.',
      from: { path: '^src/app/features/' },
      to: { path: '^src/app/(widgets|pages)/' },
    },
    {
      name: 'widgets-do-not-look-up',
      severity: 'error',
      comment: 'widgets/ compone features y entities, pero no conoce las páginas.',
      from: { path: '^src/app/widgets/' },
      to: { path: '^src/app/pages/' },
    },

    // ─── Encapsulación de los slices ───────────────────────────────────────
    {
      name: 'entities-through-public-api',
      severity: 'error',
      comment:
        'Desde fuera de un slice de entities solo se importa su index.ts. Lo demás es privado.',
      from: { path: '^src/app/(features|widgets|pages)/' },
      to: { path: '^src/app/entities/([^/]+)/(?!index\\.ts)' },
    },
    {
      name: 'features-through-public-api',
      severity: 'error',
      comment:
        'Desde fuera de un slice de features solo se importa su index.ts. Lo demás es privado.',
      from: { path: '^src/app/(widgets|pages)/' },
      to: { path: '^src/app/features/([^/]+)/(?!index\\.ts)' },
    },
    {
      name: 'widgets-through-public-api',
      severity: 'error',
      comment: 'Desde pages solo se importa el index.ts de un widget.',
      from: { path: '^src/app/pages/' },
      to: { path: '^src/app/widgets/([^/]+)/(?!index\\.ts)' },
    },
  ],

  options: {
    // Los alias @pages/@shared… se resuelven con el tsconfig.
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
    doNotFollow: { path: 'node_modules' },
    exclude: {
      path: '\\.(spec|test)\\.ts$',
    },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
};
