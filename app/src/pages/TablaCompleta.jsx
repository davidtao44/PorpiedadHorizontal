import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { billingService, propertiesService, formatters, MESES, AÑOS_DISPONIBLES } from '../services/api'
import { authService } from '../services/api'

const TablaCompleta = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedProperty, setSelectedProperty] = useState('') // No default property
  const queryClient = useQueryClient()

  // Query para obtener propiedades disponibles
  const { data: propertiesData, isLoading: propertiesLoading, error: propertiesError } = useQuery(
    'properties',
    () => propertiesService.getAll(1, 100), // Obtener hasta 100 propiedades
    {
      onSuccess: (data) => {
        // Si no hay propiedad seleccionada y hay propiedades disponibles, seleccionar la primera
        if (!selectedProperty && data?.data?.items?.length > 0) {
          setSelectedProperty(data.data.items[0].id.toString())
        }
      },
      onError: (error) => {
        console.error('Error cargando propiedades:', error)
      }
    }
  )

  // Query para obtener datos del año completo
  const { data: yearData, isLoading, error, refetch } = useQuery(
    ['billing-year-data', selectedProperty, selectedYear],
    () => billingService.getPropertyYearData(selectedProperty, selectedYear),
    {
      enabled: !!selectedProperty && !!selectedYear,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 segundos
    }
  )

  // Función para refrescar datos manualmente
  const handleRefresh = () => {
    refetch()
  }

  // Función para invalidar queries (será llamada desde otros componentes)
  const invalidateData = () => {
    queryClient.invalidateQueries(['billing-year-data', selectedProperty, selectedYear])
  }

  // Exponer función de invalidación globalmente para otros componentes
  useEffect(() => {
    window.invalidateTablaCompleta = invalidateData
    return () => {
      delete window.invalidateTablaCompleta
    }
  }, [selectedProperty, selectedYear])

  // Definición de columnas según el Excel - Orden corregido según CSV
  const columns = [
    { key: 'month', label: 'MES', type: 'text', editable: false },
    { key: 'deuda_anterior_capital', label: 'DEUDA ANTERIOR CAPITAL', type: 'currency', editable: false },
    { key: 'cuota_admon', label: 'CUOTA ADMON', type: 'currency', editable: false },
    { key: 'retroactivo', label: 'RETROACTIVO', type: 'currency', editable: false },
    { key: 'total_capital', label: 'TOTAL CAPITAL', type: 'currency', editable: false },
    { key: 'parqueaderos', label: 'PARQUEADEROS', type: 'currency', editable: false },
    { key: 'sanciones', label: 'SANCIONES', type: 'currency', editable: false },
    { key: 'zonas_comunes', label: 'ZONAS COMUNES', type: 'currency', editable: false },
    { key: 'cuota_extraordinaria', label: 'CUOTA EXTRAOR.', type: 'currency', editable: false },
    { key: 'otros', label: 'OTROS', type: 'currency', editable: false },
    { key: 'interes_mes', label: 'TASA INTERES', type: 'percentage', editable: false },
    { key: 'interes_mes_monto', label: 'INTERES MES', type: 'currency', editable: false },
    { key: 'interes_acumulado', label: 'INTERES ACUMUL', type: 'currency', editable: false },
    { key: 'intereses_total', label: 'INTERESES TOTAL', type: 'currency', editable: false },
    { key: 'capital', label: 'CAPITAL', type: 'currency', editable: false },
    { key: 'pago_retroactivo', label: 'PAGOS RETROACTIVO', type: 'currency', editable: false },
    { key: 'descuento_pronto_pago', label: 'DESCUENTO PRONTO PAGO', type: 'currency', editable: false },
    { key: 'cuota_extrapago', label: 'CUOTA EXTRAPAGO', type: 'currency', editable: false },
    { key: 'pago_sanciones', label: 'PAGO SANCIONES', type: 'currency', editable: false },
    { key: 'pago_parqueaderos', label: 'PAGO PARQUEADEROS', type: 'currency', editable: false },
    { key: 'pago_zonas_comunes', label: 'ZONAS COMUNES PAGO', type: 'currency', editable: false },
    { key: 'pago_otros', label: 'PAGO OTROS', type: 'currency', editable: false },
    { key: 'pago_intereses', label: 'PAGO INTERESES', type: 'currency', editable: false },
    { key: 'total_pagado', label: 'TOTAL PAGADO', type: 'currency', editable: false },
    { key: 'fecha_pago', label: 'FECHA DE PAGO', type: 'date', editable: false },
    { key: 'total_a_pagar', label: 'TOTAL A PAGAR', type: 'currency', editable: false }
  ]

  // Procesar datos del backend
  const processedData = React.useMemo(() => {
    if (!yearData?.data?.months) return []
    
    return yearData.data.months.map((monthData, index) => {
      const monthNumber = index + 1
      const monthName = MESES[index]
      
      if (!monthData) {
        // Mes sin datos - mostrar fila vacía
        return {
          month: monthName,
          monthNumber,
          hasData: false,
          ...Object.fromEntries(columns.slice(1).map(col => [col.key, 0]))
        }
      }
      
      // Mes con datos - usar datos del backend
      return {
        month: monthName,
        monthNumber,
        hasData: true,
        id: monthData.id,
        ...monthData
      }
    })
  }, [yearData])

  // Función para renderizar celda (solo lectura)
  const renderCell = (row, column) => {
    const value = row[column.key]
    
    if (column.key === 'month') {
      return (
        <td key={column.key} className="px-3 py-2 text-sm font-medium text-gray-900 bg-gray-50">
          {value}
        </td>
      )
    }
    
    // Aplicar estilos según si hay datos o no
    const cellClass = row.hasData 
      ? "px-3 py-2 text-sm text-gray-900 text-right"
      : "px-3 py-2 text-sm text-gray-400 text-right bg-gray-50"
    
    let displayValue = ''
    if (row.hasData && value !== null && value !== undefined) {
      if (column.type === 'currency') {
        displayValue = formatters.currency(value)
      } else if (column.type === 'percentage') {
        displayValue = formatters.percentage(value)
      } else {
        displayValue = formatters.number(value)
      }
    } else {
      if (column.type === 'currency') {
        displayValue = '$0'
      } else if (column.type === 'percentage') {
        displayValue = '0%'
      } else {
        displayValue = '0'
      }
    }
    
    return (
      <td key={column.key} className={cellClass}>
        {displayValue}
      </td>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-lg text-gray-600">Cargando datos...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error al cargar datos</h3>
                <p className="mt-1 text-sm text-red-700">{error.message}</p>
                <button 
                  onClick={handleRefresh}
                  className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tabla Completa Financiera</h1>
              <p className="mt-2 text-sm text-gray-600">
                Vista completa de todos los meses del año - Solo lectura
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizar
            </button>
          </div>
        </div>

        {/* Controles */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 mb-1">
                Año
              </label>
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {AÑOS_DISPONIBLES().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="property-select" className="block text-sm font-medium text-gray-700 mb-1">
                Propiedad
              </label>
              <select
                id="property-select"
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={propertiesLoading}
              >
                <option value="">Seleccionar propiedad...</option>
                {propertiesData?.data?.items?.map(property => (
                  <option key={property.id} value={property.id}>
                    Apartamento {property.number}
                    {property.tower && ` (Torre ${property.tower})`}
                  </option>
                ))}
              </select>
              {propertiesLoading && (
                <p className="mt-1 text-sm text-gray-500">Cargando propiedades...</p>
              )}
              {propertiesError && (
                <p className="mt-1 text-sm text-red-600">Error al cargar propiedades</p>
              )}
            </div>

            <div className="ml-auto">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Meses con datos:</span> {yearData?.data?.total_months_with_data || 0}/12
              </div>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedData.map((row, index) => (
                  <tr key={row.monthNumber} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {columns.map((column) => renderCell(row, column))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer con información */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Información</h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>• Esta tabla es de <strong>solo lectura</strong> y muestra los datos calculados por el backend.</p>
                <p>• Los datos se actualizan automáticamente cuando se crean nuevos registros o se registran pagos.</p>
                <p>• Las celdas grises indican meses sin datos registrados.</p>
                <p>• Todos los cálculos siguen la lógica del modelo financiero Excel.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TablaCompleta