/**
 * Reglas de mensaje de commit — Constitución §7: commits convencionales.
 * Un commit que no cumpla esto es rechazado por el hook commit-msg.
 */
export default {
  extends: ['@commitlint/config-conventional'],
  ignores: [(message) => message.startsWith('Merge') || message.startsWith('Revert')],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    // Obligatorio el alcance: feature/sprint que se toca (board, design-system…).
    // Se usa lower-case en vez de kebab-case porque kebab-case rechaza dígitos
    // y alcances como `e2e`, `s3` o `a11y` son legítimos.
    'scope-empty': [2, 'never'],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 200],
  },
};
