/**
 * Deja un nombre en mayúsculas sostenidas, sin espacios sobrantes en los
 * extremos y con los espacios internos repetidos reducidos a uno solo.
 *
 * Se usa toUpperCase() de JavaScript y no UPPER() de SQLite a propósito: el de
 * SQLite solo trabaja con ASCII, así que dejaría "josé" igual en vez de "JOSÉ".
 */
export function enMayusculas(valor: string): string {
  return valor.trim().replace(/\s+/g, ' ').toUpperCase();
}
