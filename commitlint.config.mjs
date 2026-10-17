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
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'],
    ],
    // Obligatorio el alcance: feature/sprint que se toca (S0.1, design-system, board…)
    'scope-empty': [2, 'never'],
    'scope-case': [2, 'always', 'kebab-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 200],
  },
};
