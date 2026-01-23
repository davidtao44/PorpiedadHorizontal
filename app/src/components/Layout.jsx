import React from 'react'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import {
  Home,
  FileText,
  Plus,
  CreditCard,
  Building2,
  Menu,
  X,
  Table,
  Calculator,
  LogOut,
  User,
  Vote,
  Activity
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { authService, votingService } from '../services/api'
import toast from 'react-hot-toast'

const Layout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Ping de actividad para mantener estado "online"
  useEffect(() => {
    const sendPing = async () => {
      if (authService.isAuthenticated()) {
        try {
          await votingService.pingActivity()
        } catch (error) {
          // Silencioso para no molestar al usuario
          // console.error("Error pinging activity:", error)
        }
      }
    }

    sendPing()
    const interval = setInterval(sendPing, 30000) // Cada 30 segundos

    return () => clearInterval(interval)
  }, [])

  // Obtener información del usuario
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const isAdmin = user.role === 'admin'

  const navigation = isAdmin ? [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Estados de Cuenta', href: '/estados-cuenta', icon: FileText },
    { name: 'Nuevo Registro', href: '/nuevo-registro', icon: Plus },
    { name: 'Registrar Pago', href: '/registrar-pago', icon: CreditCard },
    { name: 'Tabla Completa', href: '/tabla-completa', icon: Table },
    { name: 'Votación', href: '/votacion', icon: Vote },
    { name: 'Asamblea y Votaciones', href: '/asamblea-votaciones', icon: Vote },
    { name: 'Monitoreo', href: '/monitoreo', icon: Activity },
  ] : [
    { name: 'Datos Personales', href: '/datos-personales', icon: User },
    { name: 'Votaciones', href: '/votaciones', icon: Vote },
    { name: 'Monitoreo', href: '/monitoreo', icon: Activity },
  ]

  const isActive = (path) => {
    return location.pathname === path
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
      toast.success('Sesión cerrada exitosamente')
      navigate('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      // Limpiar datos locales aunque falle la llamada al servidor
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      toast.success('Sesión cerrada')
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar móvil */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-54 flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-lg font-semibold text-gray-900">FinanzasC</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${isActive(item.href)
                    ? 'bg-primary-100 text-primary-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive(item.href) ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex justify-center mb-4">
              <img src="/LOGOPAGINA.webp" alt="Logo Conjunto" className="h-10 w-auto object-contain" />
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user.email || 'Usuario'}</p>
                <p className="text-xs text-gray-500">{user.tenant_name || 'Conjunto'}</p>
              </div>
            </div>
            <button
              onClick={() => {
                handleLogout()
                setSidebarOpen(false)
              }}
              className="mt-3 flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-54 lg:flex-col">
        <div className="flex flex-grow flex-col overflow-y-auto border-r border-gray-200 bg-white pt-5">
          <div className="flex flex-shrink-0 items-center px-4">
            <Building2 className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-xl font-semibold text-gray-900">FinanzasC</span>
          </div>
          <nav className="mt-8 flex-1 space-y-1 bg-white px-2 pb-4">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${isActive(item.href)
                    ? 'bg-primary-100 text-primary-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive(item.href) ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Usuario y logout */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex justify-center mb-4">
              <img src="/LOGOPAGINA.webp" alt="Logo Conjunto" className="h-10 w-auto object-contain" />
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user.email || 'Usuario'}</p>
                <p className="text-xs text-gray-500">{user.tenant_name || 'Conjunto'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="lg:pl-64">
        {/* Header móvil */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center">
              <h1 className="text-lg font-semibold text-gray-900">Sistema de Finanzas</h1>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <button
                onClick={handleLogout}
                className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Salir
              </button>
            </div>
          </div>
        </div>

        {/* Contenido de la página */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout