import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  cents: number,
  currency: string = 'MAD'
): string {
  const amount = cents / 100
  return new Intl.NumberFormat('ar-MA', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}
