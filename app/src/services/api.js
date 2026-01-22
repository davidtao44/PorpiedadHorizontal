import axios from 'axios'

// Configurar la URL base de la API
// Prioridad: Variable de entorno > URL de producción HTTPS
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'


// Configurar la instancia de axios
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para requests
api.interceptors.request.use(
  (config) => {
    // CRÍTICO: Forzar HTTPS en todas las requests si la app corre en HTTPS
    // Esto previene que axios haga requests HTTP incluso si hay redirects 307
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      // Si baseURL existe y empieza con http:, convertirlo a https:
      if (config.baseURL && config.baseURL.startsWith('http:')) {
        console.warn('⚠️ Convirtiendo baseURL de HTTP a HTTPS:', config.baseURL)
        config.baseURL = config.baseURL.replace('http:', 'https:')
      }
      // Si url existe y empieza con http:, convertirlo a https:
      if (config.url && config.url.startsWith('http:')) {
        console.warn('⚠️ Convirtiendo URL de HTTP a HTTPS:', config.url)
        config.url = config.url.replace('http:', 'https:')
      }
    }

    // DEBUG: Log de todas las peticiones para ver qué está pasando
    const fullUrl = config.baseURL ? new URL(config.url, config.baseURL).href : config.url


    // Agregar token de autenticación si existe
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para responses
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Manejar errores globalmente
    if (error.response?.status === 401) {
      // Token expirado o no válido
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Servicios de autenticación
export const authService = {
  // Login
  login: async (username, password) => {
    const response = await api.post('/api/v1/auth/login', { username, password })
    if (response.data.success) {
      const { access_token, user, tenant } = response.data.data
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify({ ...user, tenant }))
      return response.data
    }
    throw new Error(response.data.message || 'Login failed')
  },

  // Magic Login (Auto-login via token)
  magicLogin: async (token) => {
    const response = await api.post('/api/v1/auth/magic-login', { token })
    if (response.data.success) {
      const { access_token, user, tenant } = response.data.data
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify({ ...user, tenant }))
      return response.data
    }
    throw new Error(response.data.message || 'Magic login failed')
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/api/v1/auth/logout')
    } catch (error) {
      console.warn('Logout request failed:', error)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
  },

  // Refresh token
  refreshToken: async () => {
    const token = localStorage.getItem('token')
    if (!token) throw new Error('No token available')

    const response = await api.post('/api/v1/auth/refresh', { token })
    if (response.data.success) {
      const { access_token, user, tenant } = response.data.data
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify({ ...user, tenant }))
      return response.data
    }
    throw new Error(response.data.message || 'Token refresh failed')
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/api/v1/auth/me')
    return response.data
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/api/v1/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    })
    return response.data
  },

  // Verify token
  verifyToken: async () => {
    const response = await api.post('/api/v1/auth/verify-token')
    return response.data
  },

  // Get user from localStorage
  getStoredUser: () => {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token')
  }
}

// Servicios de tenants
export const tenantsService = {
  // Obtener todos los tenants
  getAll: async (page = 1, limit = 10, search = '') => {
    const params = { page, limit }
    if (search) params.search = search

    const response = await api.get('/api/v1/tenants', { params })
    return response.data
  },

  // Crear un nuevo tenant
  create: async (data) => {
    const response = await api.post('/api/v1/tenants', data)
    return response.data
  },

  // Obtener un tenant específico
  getById: async (id) => {
    const response = await api.get(`/api/v1/tenants/${id}`)
    return response.data
  },

  // Actualizar un tenant
  update: async (id, data) => {
    const response = await api.put(`/api/v1/tenants/${id}`, data)
    return response.data
  },

  // Eliminar un tenant (soft delete)
  delete: async (id) => {
    const response = await api.delete(`/api/v1/tenants/${id}`)
    return response.data
  },

  // Activar un tenant
  activate: async (id) => {
    const response = await api.post(`/api/v1/tenants/${id}/activate`)
    return response.data
  }
}

// Servicios de propiedades
export const propertiesService = {
  // Obtener propiedad del usuario actual
  getMyProperty: async () => {
    const response = await api.get('/api/v1/properties/mine')
    return response.data
  },

  // Obtener todas las propiedades
  getAll: async (page = 1, limit = 10, search = '', property_type = '', is_active = true) => {
    const params = { page, limit, is_active }
    if (search) params.search = search
    if (property_type) params.property_type = property_type

    const response = await api.get('/api/v1/properties/', { params })
    return response.data
  },

  // Crear una nueva propiedad
  create: async (data) => {
    const response = await api.post('/api/v1/properties/', data)
    return response.data
  },

  // Obtener una propiedad específica
  getById: async (id) => {
    const response = await api.get(`/api/v1/properties/${id}`)
    return response.data
  },

  // Actualizar una propiedad
  update: async (id, data) => {
    const response = await api.put(`/api/v1/properties/${id}`, data)
    return response.data
  },

  // Eliminar una propiedad (soft delete)
  delete: async (id) => {
    const response = await api.delete(`/api/v1/properties/${id}`)
    return response.data
  },

  // Obtener propiedad por número de unidad
  getByUnitNumber: async (unitNumber) => {
    const response = await api.get(`/api/v1/properties/unit/${unitNumber}`)
    return response.data
  },

  // Obtener tipos de propiedades únicos
  getPropertyTypes: async () => {
    const response = await api.get('/api/v1/properties/types')
    return response.data
  }
}

// Servicios de residentes
export const residentsService = {
  // Obtener todos los residentes
  getAll: async (page = 1, limit = 10, search = '', property_id = '', is_owner = null, is_active = true) => {
    const params = { page, limit, is_active }
    if (search) params.search = search
    if (property_id) params.property_id = property_id
    if (is_owner !== null) params.is_owner = is_owner

    const response = await api.get('/api/v1/residents', { params })
    return response.data
  },

  // Crear un nuevo residente
  create: async (data) => {
    const response = await api.post('/api/v1/residents', data)
    return response.data
  },

  // Obtener un residente específico
  getById: async (id) => {
    const response = await api.get(`/api/v1/residents/${id}`)
    return response.data
  },

  // Actualizar un residente
  update: async (id, data) => {
    const response = await api.put(`/api/v1/residents/${id}`, data)
    return response.data
  },

  // Eliminar un residente (soft delete)
  delete: async (id) => {
    const response = await api.delete(`/api/v1/residents/${id}`)
    return response.data
  },

  // Obtener residente por documento
  getByDocument: async (documentType, documentNumber) => {
    const response = await api.get(`/api/v1/residents/document/${documentType}/${documentNumber}`)
    return response.data
  },

  // Obtener residentes por propiedad
  getByProperty: async (propertyId) => {
    const response = await api.get(`/api/v1/residents/property/${propertyId}`)
    return response.data
  }
}

// Servicios de facturación (actualizados para usar el nuevo backend)
export const billingService = {
  // Obtener todos los meses de facturación con filtros
  getAll: async (page = 1, limit = 10, year = null, month = null, property_id = '') => {
    const params = { page, limit }
    if (year) params.year = year
    if (month) params.month = month
    if (property_id) params.property_id = property_id

    const response = await api.get('/api/v1/billing/months', { params })
    return response.data
  },

  // Obtener datos de un año completo para una propiedad específica
  getPropertyYearData: async (propertyId, year) => {
    const response = await api.get(`/api/v1/billing/property/${propertyId}/year/${year}`)
    return response.data
  },

  // Crear un nuevo mes de facturación
  create: async (data) => {
    const response = await api.post('/api/v1/billing/months', data)
    return response.data
  },

  // Crear múltiples meses de facturación
  createBulk: async (data) => {
    const response = await api.post('/api/v1/billing/months/bulk', data)
    return response.data
  },

  // Obtener un mes específico por ID
  getById: async (id) => {
    const response = await api.get(`/api/v1/billing/months/${id}`)
    return response.data
  },

  // Actualizar un mes de facturación
  update: async (id, data) => {
    const response = await api.put(`/api/v1/billing/months/${id}`, data)
    return response.data
  },

  // Eliminar un mes de facturación
  delete: async (id) => {
    const response = await api.delete(`/api/v1/billing/months/${id}`)
    return response.data
  },

  // Obtener por propiedad y período específico
  getByPropertyAndPeriod: async (propertyId, year, month) => {
    const response = await api.get(`/api/v1/billing/months?property_id=${propertyId}&year=${year}&month=${month}`)
    return response.data
  },

  // Recalcular un mes de facturación
  recalculate: async (id) => {
    const response = await api.post(`/api/v1/billing/months/${id}/recalculate`)
    return response.data
  },

  // Calcular (método legacy - mantener compatibilidad)
  calculate: async (data) => {
    const response = await api.post('/api/v1/billing/months', data)
    return response.data
  },

  // Obtener resumen de facturación
  getSummary: async (year = null, month = null) => {
    const params = {}
    if (year) params.year = year
    if (month) params.month = month

    const response = await api.get('/api/v1/billing/months', { params })
    return response.data
  },

  // Registrar pago
  registerPayment: async (billingId, amount, paymentDate, notes = '') => {
    const response = await api.post('/api/v1/payments', {
      billing_month_id: billingId,
      amount,
      payment_date: paymentDate,
      notes
    })
    return response.data
  }
}

// Mantener compatibilidad con el código existente
export const estadosCuentaService = {
  ...billingService,
  // Función específica para obtener datos por período (año, mes)
  getByPeriod: async (year, month) => {
    const response = await api.get(`/api/v1/billing/months?year=${year}&month=${month}`)
    return response.data
  }
}

export const pagosService = {
  registrar: billingService.registerPayment,
  eliminar: async (propertyId, year, month) => {
    // Buscar el registro de facturación y eliminar el pago
    const billing = await billingService.getByPropertyAndPeriod(propertyId, year, month)
    if (billing.data) {
      return await billingService.update(billing.data.id, { monto_pagado: 0, fecha_pago: null })
    }
    throw new Error('Billing record not found')
  },
  getHistorial: billingService.getAll
}

export const healthService = {
  // Verificar el estado de la API
  check: async () => {
    const response = await api.get('/health')
    return response.data
  }
}
// Servicios de email
export const emailService = {
  // Enviar credenciales por correo (individual o masivo)
  // El backend siempre espera un array de objetos
  // Para envío individual: pasar un objeto (se convertirá automáticamente a array)
  // Para envío masivo: pasar un array de objetos
  sendCredentials: async (data) => {
    // Asegurar que siempre enviamos un array
    const payload = Array.isArray(data) ? data : [data]
    const response = await api.post('/api/v1/emails/send-credentials', payload)
    return response.data
  }
}
// Servicios de votación
export const votingService = {
  // Obtener pregunta activa
  getActiveVoting: async () => {
    const response = await api.get('/api/v1/voting/active')
    return response.data
  },
  // Obtener asamblea activa
  getActiveAssembly: async () => {
    const response = await api.get('/api/v1/voting/assembly/active')
    return response.data
  },
  // Obtener todas las asambleas
  getAssemblies: async () => {
    const response = await api.get('/api/v1/voting/assemblies')
    return response.data
  },
  // Obtener preguntas por asamblea
  getAssemblyQuestions: async (assemblyId) => {
    const response = await api.get(`/api/v1/voting/questions/${assemblyId}`)
    return response.data
  },
  // Registrar voto
  submitVote: async (voteData) => {
    const response = await api.post('/api/v1/voting/vote', voteData)
    return response.data
  },
  // Admin: Crear asamblea
  createAssembly: async (data) => {
    const response = await api.post('/api/v1/voting/assembly', data)
    return response.data
  },
  // Admin: Alternar asamblea
  toggleAssembly: async (id) => {
    const response = await api.patch(`/api/v1/voting/assembly/${id}/toggle`)
    return response.data
  },
  // Admin: Cerrar asamblea
  closeAssembly: async (id) => {
    const response = await api.post(`/api/v1/voting/assembly/${id}/close`)
    return response.data
  },
  // Admin: Lanzar pregunta
  createQuestion: async (data, duration) => {
    const params = duration ? { duration_seconds: duration } : {}
    const response = await api.post('/api/v1/voting/question', data, { params })
    return response.data
  },
  // Admin: Obtener resultados
  getResults: async (questionId) => {
    const response = await api.get(`/api/v1/voting/results/${questionId}`)
    return response.data
  }
}

// Utilidades para formatear datos
export const formatters = {
  // Formatear moneda colombiana
  currency: (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0)
  },

  // Formatear fecha
  date: (date) => {
    if (!date) return '-'
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date))
  },

  // Formatear fecha corta
  dateShort: (date) => {
    if (!date) return '-'
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(date))
  },

  // Formatear número
  number: (num) => {
    return new Intl.NumberFormat('es-CO').format(num || 0)
  },

  // Formatear porcentaje
  percentage: (num) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    }).format((num || 0) / 100)
  }
}

// Constantes útiles
export const MESES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
]

export const AÑOS_DISPONIBLES = () => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear - 5; i <= currentYear + 2; i++) {
    years.push(i)
  }
  return years
}

// Validadores
export const validators = {
  // Validar año
  año: (año) => {
    const currentYear = new Date().getFullYear()
    return año >= 2020 && año <= currentYear + 5
  },

  // Validar mes
  mes: (mes) => {
    return MESES.includes(mes.toUpperCase())
  },

  // Validar monto
  monto: (monto) => {
    return !isNaN(monto) && monto >= 0
  },

  // Validar email
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
}

export default api