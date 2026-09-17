import axios from 'axios'
import { normalizeApiBase } from '@/lib/utils'

export const TOKEN_KEY = 'farmconnect_token'
export const USER_KEY = 'farmconnect_user'

const baseURL = normalizeApiBase(import.meta.env.VITE_API_URL) || '/api'

export const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const detail = error?.response?.data?.detail
    if (status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    error.message =
      typeof detail === 'string' ? detail : error.message || 'Something went wrong'
    return Promise.reject(error)
  },
)

// Convenience helpers -------------------------------------------------------
export const authApi = {
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
}

export const productApi = {
  list: (params) => api.get('/products', { params }).then((r) => r.data),
  get: (id) => api.get(`/products/${id}`).then((r) => r.data),
  mine: () => api.get('/products/mine').then((r) => r.data),
  create: (payload) => api.post('/products', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/products/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/products/${id}`).then((r) => r.data),
  reviews: (id) => api.get(`/products/${id}/reviews`).then((r) => r.data),
}

export const orderApi = {
  create: (payload) => api.post('/orders', payload).then((r) => r.data),
  mine: () => api.get('/orders/mine').then((r) => r.data),
  get: (id) => api.get(`/orders/${id}`).then((r) => r.data),
  setStatus: (id, status) =>
    api.patch(`/orders/${id}/status`, { status }).then((r) => r.data),
  cancel: (id) => api.post(`/orders/${id}/cancel`).then((r) => r.data),
}

export const reviewApi = {
  create: (payload) => api.post('/reviews', payload).then((r) => r.data),
  mine: () => api.get('/reviews/mine').then((r) => r.data),
}

export const userApi = {
  me: () => api.get('/users/me').then((r) => r.data),
  update: (payload) => api.put('/users/me', payload).then((r) => r.data),
  farmers: (params) => api.get('/farmers', { params }).then((r) => r.data),
  farmer: (id) => api.get(`/farmers/${id}`).then((r) => r.data),
  farmerProducts: (id) => api.get(`/farmers/${id}/products`).then((r) => r.data),
  farmerReviews: (id) => api.get(`/farmers/${id}/reviews`).then((r) => r.data),
}

export const chatApi = {
  conversations: () => api.get('/conversations').then((r) => r.data),
  createConversation: (otherUserId) =>
    api.post('/conversations', { other_user_id: otherUserId }).then((r) => r.data),
  messages: (id) => api.get(`/conversations/${id}/messages`).then((r) => r.data),
  sendMessage: (id, content) =>
    api.post(`/conversations/${id}/messages`, { content }).then((r) => r.data),
  markRead: (id) => api.put(`/conversations/${id}/read`).then((r) => r.data),
}

export const dashboardApi = {
  farmer: () => api.get('/dashboard/farmer').then((r) => r.data),
  buyer: () => api.get('/dashboard/buyer').then((r) => r.data),
}

export const reportApi = {
  create: (payload) => api.post('/reports', payload).then((r) => r.data),
  mine: () => api.get('/reports/mine').then((r) => r.data),
}

export const adminApi = {
  stats: () => api.get('/admin/stats').then((r) => r.data),
  users: (params) => api.get('/admin/users', { params }).then((r) => r.data),
  setUserStatus: (id, isActive) =>
    api.patch(`/admin/users/${id}/status`, { is_active: isActive }).then((r) => r.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then((r) => r.data),
  products: (params) => api.get('/admin/products', { params }).then((r) => r.data),
  toggleRemove: (id) => api.patch(`/admin/products/${id}/remove`).then((r) => r.data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`).then((r) => r.data),
  reports: (params) => api.get('/admin/reports', { params }).then((r) => r.data),
  resolveReport: (id, payload) => api.patch(`/admin/reports/${id}`, payload).then((r) => r.data),
}

export async function uploadImage(file) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/uploads', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.url
}
