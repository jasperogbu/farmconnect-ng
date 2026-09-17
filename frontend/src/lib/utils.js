import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatNaira(value) {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function homeForRole(role) {
  if (role === 'farmer') return '/farmer'
  if (role === 'admin') return '/admin'
  return '/buyer'
}

export function normalizeApiBase(value) {
  const raw = (value || '').trim().replace(/^['"]+|['"]+$/g, '')
  if (!raw) return ''
  return raw.replace(/\/+$/, '')
}

const API_ORIGIN = normalizeApiBase(import.meta.env.VITE_API_URL).replace(/\/api$/i, '')

export function resolveImage(url) {
  if (!url) return null
  if (/^(data:|blob:|https?:\/\/)/i.test(url)) return url
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`
}

export function initials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}
