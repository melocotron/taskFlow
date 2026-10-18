#!/usr/bin/env node
/**
 * Guardián de tokens.
 *
 * Constitución §IV: todo color proviene de src/styles/tokens/. Un hexadecimal
 * fuera de esa carpeta es un defecto, y este script es quien lo detecta.
 *
 * Uso: node scripts/check-tokens.mjs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = 'src';
const CARPETA_TOKENS = join('src', 'styles', 'tokens');
const EXTENSIONES = ['.ts', '.html', '.css'];
const HEX = /#[0-9a-fA-F]{3,8}\b/g;

/** Recorre un directorio y devuelve las rutas de los archivos que hay que revisar. */
function archivos(dir) {
  const encontrados = [];

  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const ruta = join(dir, entrada.name);

    if (entrada.isDirectory()) {
      encontrados.push(...archivos(ruta));
    } else if (EXTENSIONES.some((ext) => entrada.name.endsWith(ext))) {
      encontrados.push(ruta);
    }
  }

  return encontrados;
}

const infracciones = [];

for (const archivo of archivos(ROOT)) {
  if (archivo.startsWith(CARPETA_TOKENS)) {
    continue;
  }

  const contenido = readFileSync(archivo, 'utf8');
  const coincidencias = contenido.match(HEX);

  if (coincidencias) {
    const unicas = [...new Set(coincidencias)];
    infracciones.push({ archivo: relative('.', archivo).split(sep).join('/'), unicas });
  }
}

if (infracciones.length > 0) {
  console.error('\n✖ Hexadecimales fuera de src/styles/tokens/\n');

  for (const { archivo, unicas } of infracciones) {
    console.error(`  ${archivo}: ${unicas.join(', ')}`);
  }

  console.error('\nUn color suelto rompe el theming y la coherencia. Usa un token semántico.\n');
  process.exit(1);
}

console.log('✔ sin hexadecimales fuera de src/styles/tokens/');
