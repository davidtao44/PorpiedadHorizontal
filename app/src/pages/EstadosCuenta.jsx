import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  Search, 
  Filter, 
  Download, 
  Eye,
  Calendar,
  AlertCircle,
  RefreshCw,
  Trash2
} from 'lucide-react'
import { estadosCuentaService, pagosService, formatters, AÑOS_DISPONIBLES } from '../services/api'
import RecalculateButton from '../components/RecalculateButton'

const EstadosCuenta = () => {
  const [filtros, setFiltros] = useState({
    añoDesde: new Date().getFullYear(),
    añoHasta: new Date().getFullYear(),
    busqueda: ''
  })

  const queryClient = useQueryClient()

  // Query para obtener estados de cuenta
  const { data: estadosCuenta, isLoading, error, refetch } = useQuery(
    ['estados-cuenta', filtros.añoDesde, filtros.añoHasta],
    () => estadosCuentaService.getAll(filtros.añoDesde, filtros.añoHasta),
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
    }
  )

  // Mutation para eliminar pagos
  const eliminarPagoMutation = useMutation(
    ({ usuarioId, año, mes }) => pagosService.eliminar(usuarioId, año, mes),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['estados-cuenta'])
        alert('Pago eliminado exitosamente')
      },
      onError: (error) => {
        console.error('Error al eliminar pago:', error)
        alert('Error al eliminar el pago: ' + (error.response?.data?.message || error.message))
      }
    }
  )

  const handleEliminarPago = (registro) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el pago de ${registro.mes} ${registro.año}?`)) {
      eliminarPagoMutation.mutate({
        usuarioId: registro.usuario_id || 1, // Usar ID del usuario actual
        año: registro.año,
        mes: registro.numero_mes
      })
    }
  }

  // Filtrar datos por búsqueda
  const datosFiltrados = (estadosCuenta && Array.isArray(estadosCuenta.data)) ? 
    estadosCuenta.data.filter(item => 
      item.mes.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      item.año.toString().includes(filtros.busqueda)
    ) : []

  // Manejar cambios en filtros
  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }))
  }

  // Exportar a CSV (simulado)
  const exportarCSV = () => {
    if (!datosFiltrados.length) return

    const headers = [
      'Año', 'Mes', 'Deuda Anterior', 'Cuota Admin', 'Total Capital',
      'Parqueaderos', 'Sanciones', 'Zonas Comunes', 'Intereses Total',
      'Total a Pagar', 'Total Pagado', 'Saldo Pendiente'
    ]

    const csvContent = [
      headers.join(','),
      ...datosFiltrados.map(item => [
        item.año,
        item.mes,
        item.deuda_anterior_capital,
        item.cuota_admon,
        item.total_capital,
        item.parqueaderos,
        item.sanciones,
        item.zonas_comunes,
        item.intereses_total,
        item.total_a_pagar,
        item.total_pagado,
        item.saldo_pendiente
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `estados_cuenta_${filtros.añoDesde}_${filtros.añoHasta}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (error) {
    return (
      <div className="rounded-md bg-danger-50 p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-danger-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-danger-800">Error al cargar datos</h3>
            <p className="mt-2 text-sm text-danger-700">
              No se pudieron cargar los estados de cuenta. Por favor, intenta nuevamente.
            </p>
            <button
              onClick={() => refetch()}
              className="mt-3 btn btn-sm btn-danger"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Estados de Cuenta</h1>
          <p className="mt-2 text-gray-600">
            Gestiona y visualiza todos los registros financieros mensuales
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={exportarCSV}
            disabled={!datosFiltrados.length}
            className="btn btn-secondary btn-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </button>
          <button
            onClick={() => refetch()}
            className="btn btn-primary btn-sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </button>
          <RecalculateButton
            variant="success"
            size="sm"
            showText={true}
            onSuccess={() => {
              refetch()
              alert('Recálculo masivo completado exitosamente')
            }}
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="card-content">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por mes o año..."
                  value={filtros.busqueda}
                  onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Año Desde */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Año Desde
              </label>
              <select
                value={filtros.añoDesde}
                onChange={(e) => handleFiltroChange('añoDesde', parseInt(e.target.value))}
                className="input"
              >
                {AÑOS_DISPONIBLES().map(año => (
                  <option key={año} value={año}>{año}</option>
                ))}
              </select>
            </div>

            {/* Año Hasta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Año Hasta
              </label>
              <select
                value={filtros.añoHasta}
                onChange={(e) => handleFiltroChange('añoHasta', parseInt(e.target.value))}
                className="input"
              >
                {AÑOS_DISPONIBLES().map(año => (
                  <option key={año} value={año}>{año}</option>
                ))}
              </select>
            </div>

            {/* Estadísticas rápidas */}
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                <p>Total registros: <span className="font-semibold">{datosFiltrados.length}</span></p>
                <p>Saldo total: <span className="font-semibold">
                  {formatters.currency(
                    datosFiltrados.reduce((sum, item) => sum + (item.saldo_pendiente || 0), 0)
                  )}
                </span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Estados de Cuenta */}
      <div className="card">
        <div className="card-content">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : datosFiltrados.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr className="table-row">
                    <th className="table-head">Período</th>
                    <th className="table-head">Deuda Anterior</th>
                    <th className="table-head">Cuota Admin</th>
                    <th className="table-head">Total Capital</th>
                    <th className="table-head">Parqueaderos</th>
                    <th className="table-head">Sanciones</th>
                    <th className="table-head">Zonas Comunes</th>
                    <th className="table-head">Intereses</th>
                    <th className="table-head">Total a Pagar</th>
                    <th className="table-head">Total Pagado</th>
                    <th className="table-head">Saldo Pendiente</th>
                    <th className="table-head">Estado</th>
                    <th className="table-head">Fecha Pago</th>
                    <th className="table-head">Acciones</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {datosFiltrados.map((registro) => (
                    <tr key={`${registro.año}-${registro.mes}`} className="table-row">
                      <td className="table-cell font-medium">
                        {registro.mes} {registro.año}
                      </td>
                      <td className="table-cell">
                        {formatters.currency(registro.deuda_anterior_capital)}
                      </td>
                      <td className="table-cell">
                        {formatters.currency(registro.cuota_admon)}
                      </td>
                      <td className="table-cell font-semibold">
                        {formatters.currency(registro.total_capital)}
                      </td>
                      <td className="table-cell">
                        {formatters.currency(registro.parqueaderos)}
                      </td>
                      <td className="table-cell">
                        {formatters.currency(registro.sanciones)}
                      </td>
                      <td className="table-cell">
                        {formatters.currency(registro.zonas_comunes)}
                      </td>
                      <td className="table-cell">
                        {formatters.currency(registro.intereses_total)}
                      </td>
                      <td className="table-cell font-semibold text-primary-600">
                        {formatters.currency(registro.total_a_pagar)}
                      </td>
                      <td className="table-cell text-success-600">
                        {formatters.currency(registro.total_pagado)}
                      </td>
                      <td className="table-cell">
                        <span className={`font-semibold ${
                          registro.saldo_pendiente > 0 
                            ? 'text-warning-600' 
                            : 'text-success-600'
                        }`}>
                          {formatters.currency(registro.saldo_pendiente)}
                        </span>
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
                      <td className="table-cell">
                        {formatters.dateShort(registro.fecha_pago)}
                      </td>
                      <td className="table-cell">
                        {registro.total_pagado > 0 && (
                          <button
                            onClick={() => handleEliminarPago(registro)}
                            disabled={eliminarPagoMutation.isLoading}
                            className="btn btn-sm btn-outline text-red-600 hover:bg-red-50 hover:border-red-300 mr-2"
                            title="Eliminar pago"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        <RecalculateButton
                          propertyId={registro.property_id}
                          year={registro.año}
                          month={registro.numero_mes}
                          variant="outline"
                          size="sm"
                          showText={false}
                          onSuccess={() => {
                            refetch()
                            alert(`Recálculo completado para ${registro.mes} ${registro.año}`)
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay registros</h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron estados de cuenta con los filtros aplicados.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Resumen */}
      {datosFiltrados.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Resumen del Período</h3>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {formatters.currency(
                    datosFiltrados.reduce((sum, item) => sum + (item.total_capital || 0), 0)
                  )}
                </p>
                <p className="text-sm text-gray-600">Total Capital</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {formatters.currency(
                    datosFiltrados.reduce((sum, item) => sum + (item.intereses_total || 0), 0)
                  )}
                </p>
                <p className="text-sm text-gray-600">Total Intereses</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-success-600">
                  {formatters.currency(
                    datosFiltrados.reduce((sum, item) => sum + (item.total_pagado || 0), 0)
                  )}
                </p>
                <p className="text-sm text-gray-600">Total Pagado</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-warning-600">
                  {formatters.currency(
                    datosFiltrados.reduce((sum, item) => sum + (item.saldo_pendiente || 0), 0)
                  )}
                </p>
                <p className="text-sm text-gray-600">Saldo Pendiente</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EstadosCuenta