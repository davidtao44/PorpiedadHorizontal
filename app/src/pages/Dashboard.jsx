import React from 'react'
import { useQuery } from 'react-query'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Home,
  CheckSquare
} from 'lucide-react'
import { estadosCuentaService, formatters } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { USER_ROLES } from '../constants/roleConstants'
import { Link } from 'react-router-dom'
import { Card, Button, Typography, Space } from 'antd'

const { Title, Text } = Typography

const Dashboard = () => {
  const { user, hasAnyRole } = useAuth()
  
  // Obtener datos de estados de cuenta (Solo para roles administrativos/financieros)
  const isAltRole = hasAnyRole([
    USER_ROLES.COPROPIETARIO, 
    USER_ROLES.SEGURIDAD_VIGILANCIA, 
    USER_ROLES.PROVEEDOR
  ])

  const { data: estadosCuentaResponse, isLoading, error } = useQuery(
    'estados-cuenta-dashboard',
    () => estadosCuentaService.getAll(),
    {
      refetchInterval: 30000,
      enabled: !isAltRole // No cargar datos financieros para estos roles
    }
  )

  // Extraer los datos del array de la respuesta
  const estadosCuenta = estadosCuentaResponse?.data || []

  // Calcular estadísticas
  const calcularEstadisticas = () => {
    if (!estadosCuenta || !Array.isArray(estadosCuenta) || estadosCuenta.length === 0) {
      return {
        totalAPagar: 0,
        totalPagado: 0,
        saldoPendiente: 0,
        ultimoMes: null,
        registrosActuales: 0,
        promedioMensual: 0
      }
    }

    const totalAPagar = estadosCuenta.reduce((sum, item) => sum + (item.total_a_pagar || 0), 0)
    const totalPagado = estadosCuenta.reduce((sum, item) => sum + (item.total_pagado || 0), 0)
    const saldoPendiente = estadosCuenta.reduce((sum, item) => sum + (item.saldo_pendiente || 0), 0)
    
    // Obtener el último registro
    const ultimoRegistro = [...estadosCuenta].sort((a, b) => {
      if (a.año !== b.año) return b.año - a.año
      return b.numero_mes - a.numero_mes
    })[0]

    const promedioMensual = estadosCuenta.length > 0 ? totalAPagar / estadosCuenta.length : 0

    return {
      totalAPagar,
      totalPagado,
      saldoPendiente,
      ultimoMes: ultimoRegistro,
      registrosActuales: estadosCuenta.length,
      promedioMensual
    }
  }

  const estadisticas = calcularEstadisticas()

  // Obtener registros recientes (últimos 6 meses)
  const registrosRecientes = estadosCuenta && Array.isArray(estadosCuenta) ? 
    [...estadosCuenta]
      .sort((a, b) => {
        if (a.año !== b.año) return b.año - a.año
        return b.numero_mes - a.numero_mes
      })
      .slice(0, 6) : []

  if (isAltRole) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bienvenido, {user?.first_name || 'Usuario'}</h1>
          <p className="mt-2 text-gray-600">
            Sistema de Gestión Residencial - {user?.tenant?.name || 'Conjunto'}
          </p>
        </div>

        <Card className="shadow-md">
          <div className="flex flex-col md:flex-row gap-6 items-center p-4">
            <div className="bg-primary-100 p-4 rounded-full">
              <User size={48} className="text-primary-600" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <Title level={3}>¡Hola! Es un gusto verte.</Title>
              <Text className="text-lg">
                Desde aquí puedes gestionar tu propiedad, participar en votaciones de asamblea y mantenerte al día con el conjunto.
              </Text>
              <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
                {hasAnyRole([USER_ROLES.COPROPIETARIO]) && (
                  <>
                    <Link to="/mi-propiedad">
                      <Button type="primary" size="large" icon={<Home size={18} className="mr-2" />}>Mi Propiedad</Button>
                    </Link>
                    <Link to="/votaciones">
                      <Button size="large" icon={<CheckSquare size={18} className="mr-2" />}>Votaciones</Button>
                    </Link>
                  </>
                )}
                {hasAnyRole([USER_ROLES.SEGURIDAD_VIGILANCIA]) && (
                  <Text type="secondary">Módulo de Vigilancia próximamente...</Text>
                )}
              </div>
            </div>
          </div>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card title="Últimos Avisos" className="shadow-sm">
            <Text type="secondary">No hay avisos recientes de la administración.</Text>
          </Card>
          <Card title="Próximos Eventos" className="shadow-sm">
            <Text type="secondary">No hay eventos programados.</Text>
          </Card>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-danger-50 p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-danger-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-danger-800">Error al cargar datos</h3>
            <p className="mt-2 text-sm text-danger-700">
              No se pudieron cargar los datos del dashboard. Por favor, intenta nuevamente.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
        <p className="mt-2 text-gray-600">
          Resumen general de las finanzas del conjunto residencial
        </p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total a Pagar */}
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total a Pagar</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatters.currency(estadisticas.totalAPagar)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Total Pagado */}
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Pagado</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatters.currency(estadisticas.totalPagado)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Saldo Pendiente */}
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Saldo Pendiente</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatters.currency(estadisticas.saldoPendiente)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Registros Actuales */}
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Registros</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {estadisticas.registrosActuales}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información del último mes */}
      {estadisticas.ultimoMes && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Último Registro</h3>
            <p className="card-description">
              Información del registro más reciente
            </p>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Período</p>
                <p className="text-lg font-semibold text-gray-900">
                  {estadisticas.ultimoMes.mes} {estadisticas.ultimoMes.año}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Capital</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatters.currency(estadisticas.ultimoMes.total_capital)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Intereses</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatters.currency(estadisticas.ultimoMes.intereses_total)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Estado</p>
                <span className={`badge ${
                   estadisticas.ultimoMes.saldo_pendiente > 0 
                    ? 'badge-warning' 
                    : 'badge-success'
                }`}>
                  {estadisticas.ultimoMes.saldo_pendiente > 0 ? 'Pendiente' : 'Pagado'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de registros recientes */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Registros Recientes</h3>
          <p className="card-description">
            Últimos 6 registros mensuales
          </p>
        </div>
        <div className="card-content">
          {registrosRecientes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr className="table-row">
                    <th className="table-head">Período</th>
                    <th className="table-head">Total Capital</th>
                    <th className="table-head">Intereses</th>
                    <th className="table-head">Total a Pagar</th>
                    <th className="table-head">Pagado</th>
                    <th className="table-head">Saldo</th>
                    <th className="table-head">Estado</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {registrosRecientes.map((registro) => (
                    <tr key={`${registro.año}-${registro.numero_mes}`} className="table-row">
                      <td className="table-cell font-medium">
                        {registro.mes} {registro.año}
                      </td>
                      <td className="table-cell">
                        {formatters.currency(registro.total_capital)}
                      </td>
                      <td className="table-cell">
                        {formatters.currency(registro.intereses_total)}
                      </td>
                      <td className="table-cell">
                        {formatters.currency(registro.total_a_pagar)}
                      </td>
                      <td className="table-cell">
                        {formatters.currency(registro.total_pagado)}
                      </td>
                      <td className="table-cell">
                        {formatters.currency(registro.saldo_pendiente)}
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${
                          registro.saldo_pendiente > 0 
                            ? 'badge-warning' 
                            : 'badge-success'
                        }`}>
                          {registro.saldo_pendiente > 0 ? 'Pendiente' : 'Pagado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay registros</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comienza creando tu primer registro mensual.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard