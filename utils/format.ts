/**
 * Formatea números de forma consistente entre servidor y cliente
 * para evitar errores de hidratación en Next.js
 */

/**
 * Formatea un precio/monto como número con separadores de miles
 * Usa locale 'es-CO' para consistencia (formato: 50.000)
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formatea un número con decimales
 */
export function formatNumber(
  amount: number,
  decimals: number = 0
): string {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}


