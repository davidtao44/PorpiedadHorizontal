import React, { useState, useEffect, useCallback } from 'react'
import { Edit2, Save, X, Plus, RefreshCw, Download } from 'lucide-react'
import { estadosCuentaService, tenantsService } from '../services/api'

const TablaDinamica = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(false)
  const [editingCell, setEditingCell] = useState(null)
  const [tempValue, setTempValue] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [interestRate, setInterestRate] = useState(0.02) // Valor por defecto

  const meses = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ]

  // Datos iniciales basados en el Excel 2024 con tasas de interés específicas
  const datosIniciales2024 = {
    'ENERO': { cuota_admon: 570000, retroactivo: 0, parqueaderos: 0, sanciones: 0, zonas_comunes: 0, cuota_extraordinaria: 100000, otros: 0, interes_mes: 0.0 },
    'FEBRERO': { cuota_admon: 570000, retroactivo: 0, parqueaderos: 50000, sanciones: 200000, zonas_comunes: 200000, cuota_extraordinaria: 100000, otros: 0, interes_mes: 0.143 },
    'MARZO': { cuota_admon: 570000, retroactivo: 0, parqueaderos: 0, sanciones: 0, zonas_comunes: 0, cuota_extraordinaria: 100000, otros: 0, interes_mes: 0.285 },
    'ABRIL': { cuota_admon: 570000, retroactivo: 0, parqueaderos: 0, sanciones: 0, zonas_comunes: 0, cuota_extraordinaria: 100000, otros: 0, interes_mes: 0.0195 },
    'MAYO': { cuota_admon: 0, retroactivo: 0, parqueaderos: 0, sanciones: 0, zonas_comunes: 0, cuota_extraordinaria: 100000, otros: 0, interes_mes: 0.0 },
    'JUNIO': { cuota_admon: 0, retroactivo: 0, parqueaderos: 0, sanciones: 0, zonas_comunes: 0, cuota_extraordinaria: 100000, otros: 0, interes_mes: 0.0 },
    'JULIO': { cuota_admon: 0, retroactivo: 0, parqueaderos: 0, sanciones: 0, zonas_comunes: 0, cuota_extraordinaria: 100000, otros: 0, interes_mes: 0.0 },
    'AGOSTO': { cuota_admon: 0, retroactivo: 0, parqueaderos: 0, sanciones: 0, zonas_comunes: 0, cuota_extraordinaria: 100000, otros: 0, interes_mes: 0.0 },
    'SEPTIEMBRE': { cuota_admon: 0, retroactivo: 0, parqueaderos: 0, sanciones: 0, zonas_comunes: 0, cuota_extraordinaria: 100000, otros: 0, interes_mes: 0.0 },
    'OCTUBRE': { cuota_admon: 0, retroactivo: 0, parqueaderos: 0, sanciones: 0, zonas_comunes: 0, cuota_extraordinaria: 100000, otros: 0, interes_mes: 0.0 },
    'NOVIEMBRE': { cuota_admon: 0, retroactivo: 0, parqueaderos: 0, sanciones: 0, zonas_comunes: 0, cuota_extraordinaria: 100000, otros: 0, interes_mes: 0.0 },
    'DICIEMBRE': { cuota_admon: 0, retroactivo: 0, parqueaderos: 0, sanciones: 0, zonas_comunes: 0, cuota_extraordinaria: 100000, otros: 0, interes_mes: 0.0 }
  }

  // Campos que se pueden editar directamente (no calculados)
  const camposEditables = [
    'cuota_admon', 'retroactivo', 'parqueaderos', 'sanciones', 
    'zonas_comunes', 'cuota_extraordinaria', 'otros',
    'pagos_retroactivo', 'descuento_pronto_pago', 'cuota_extra_pago',
    'pago_sanciones', 'pago_parqueaderos', 'zonas_comunes_pago',
    'pago_otros', 'pago_intereses', 'fecha_pago'
  ]

  // Campos calculados automáticamente
  const camposCalculados = [
    'deuda_anterior_capital', 'total_capital', 'deuda_intereses',
    'interes_mes', 'interes_acumulado', 'intereses_total',
    'capital', 'total_pagado', 'total_a_pagar', 'saldo_pendiente'
  ]

  const formatCurrency = (value) => {
    if (!value || value === 0) return '0'
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(parseFloat(value))
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('es-CO')
  }

  // Calcular campos automáticos basados en las fórmulas exactas del Excel
  const calcularCamposAutomaticos = useCallback((mesData, mesAnteriorData = null) => {
    const result = { ...mesData }
    
    // 1. Deuda Anterior Capital = Saldo Pendiente del mes anterior
    if (mesAnteriorData && mesData.mes !== 'SALDO INICIAL') {
      result.deuda_anterior_capital = parseFloat(mesAnteriorData.saldo_pendiente || 0)
    } else {
      result.deuda_anterior_capital = 0
    }

    // 2. TOTAL CAPITAL - Fórmula Excel: REDONDEAR(SUMA(C2:H2),0)
    // Columnas C-H: DEUDA ANTERIOR CAPITAL, CUOTA ADMON, RETROACTIVO, PARQUEADEROS, SANCIONES, ZONAS COMUNES
    const totalCapitalSum = (
      parseFloat(result.deuda_anterior_capital || 0) +
      parseFloat(result.cuota_admon || 0) +
      parseFloat(result.retroactivo || 0) +
      parseFloat(result.parqueaderos || 0) +
      parseFloat(result.sanciones || 0) +
      parseFloat(result.zonas_comunes || 0)
    )
    result.total_capital = Math.round(totalCapitalSum)

    // 3. Cálculo de intereses según las fórmulas del Excel
    // INTERES MES = tasa de interés específica del mes o tasa general
    // Convertir porcentajes a decimales si es necesario
    let tasaInteresMes = parseFloat(result.interes_mes || interestRate)
    
    // Si la tasa viene como porcentaje (mayor a 1), convertir a decimal
    if (tasaInteresMes > 1) {
      tasaInteresMes = tasaInteresMes / 100
    }
    
    result.interes_mes = tasaInteresMes
    
    // INTERES MES MONTO = REDONDEAR(TOTAL_CAPITAL * INTERES_MES, 0)
    // Solo calcular interés si hay capital pendiente
    if (result.total_capital > 0) {
      result.interes_mes_monto = Math.round(result.total_capital * tasaInteresMes)
    } else {
      result.interes_mes_monto = 0
    }
    
    // INTERES ACUMULADO - Fórmula Excel condicional según la imagen:
    // - FEBRERO: 0 (primer mes, no hay acumulado anterior)
    // - MARZO: 14,300 (acumulado anterior)
    // - ABRIL: 42,800 (acumulado anterior + interés del mes)
    // - MAYO en adelante: mantiene 76,300 (sin nuevos intereses)
    
    if (!mesAnteriorData) {
      // Primer mes: no hay interés acumulado
      result.interes_acumulado = 0
    } else {
      const interesAcumuladoAnterior = parseFloat(mesAnteriorData.interes_acumulado || 0)
      const pagoInteresesAnterior = parseFloat(mesAnteriorData.pago_intereses || 0)
      
      // Si no hay capital en el mes actual, mantener el acumulado anterior
      if (result.total_capital === 0) {
        result.interes_acumulado = Math.max(0, interesAcumuladoAnterior - pagoInteresesAnterior)
      } else {
        // Si hay capital, agregar el interés del mes al acumulado
        result.interes_acumulado = Math.max(0, interesAcumuladoAnterior + result.interes_mes_monto - pagoInteresesAnterior)
      }
    }
    
    // Asegurar que el interés acumulado no sea negativo
    result.interes_acumulado = Math.max(0, result.interes_acumulado)
    
    // INTERESES TOTAL = INTERES_MES_MONTO + INTERES_ACUMULADO
    result.intereses_total = result.interes_mes_monto + result.interes_acumulado

    // 4. TOTAL A PAGAR - Fórmula Excel: REDONDEAR(SUMA(I2:N2),0)
    // Columnas I-N: TOTAL CAPITAL, CUOTA EXTRAORDINARIA, OTROS, INTERES MES MONTO, INTERES ACUMULADO, OTROS INTERESES
    const totalAPagarSum = (
      result.total_capital +
      parseFloat(result.cuota_extraordinaria || 0) +
      parseFloat(result.otros || 0) +
      result.interes_mes_monto +
      result.interes_acumulado +
      parseFloat(result.otros_intereses || 0)
    )
    result.total_a_pagar = Math.round(totalAPagarSum)

    // 5. Total Pagado = suma de todos los pagos
    const pagos = [
      'pagos_retroactivo', 'cuota_extra_pago', 'pago_sanciones',
      'pago_parqueaderos', 'zonas_comunes_pago', 'pago_otros', 'pago_intereses'
    ]
    result.total_pagado = pagos.reduce((sum, campo) => sum + parseFloat(result[campo] || 0), 0)

    // 6. Capital (para cálculos internos - suma de todos los conceptos de capital)
    result.capital = (
      result.deuda_anterior_capital +
      parseFloat(result.cuota_admon || 0) +
      parseFloat(result.retroactivo || 0) +
      parseFloat(result.parqueaderos || 0) +
      parseFloat(result.sanciones || 0) +
      parseFloat(result.zonas_comunes || 0) +
      parseFloat(result.cuota_extraordinaria || 0) +
      parseFloat(result.otros || 0)
    )

    // 7. Saldo Pendiente - Fórmula Excel: SI(O2=0,P2,P2-O2)
    // O2 = TOTAL PAGADO, P2 = TOTAL A PAGAR
    if (result.total_pagado === 0) {
      result.saldo_pendiente = result.total_a_pagar
    } else {
      result.saldo_pendiente = result.total_a_pagar - result.total_pagado
    }
    result.saldo_pendiente = Math.round(result.saldo_pendiente)

    // Deuda Intereses = Intereses Total (para compatibilidad)
    result.deuda_intereses = result.intereses_total

    return result
  }, [interestRate])

  // Estado para rastrear celdas que han cambiado recientemente
  const [recentlyChanged, setRecentlyChanged] = useState(new Set())

  // Recalcular toda la tabla cuando hay cambios
  const recalcularTabla = useCallback((newData) => {
    const recalculatedData = {}
    let mesAnteriorData = null
    const changedCells = new Set()

    meses.forEach(mes => {
      if (newData[mes]) {
        const oldData = data[mes] || {}
        const newMesData = calcularCamposAutomaticos(newData[mes], mesAnteriorData)
        
        // Detectar qué campos han cambiado
        Object.keys(newMesData).forEach(campo => {
          if (oldData[campo] !== newMesData[campo] && camposCalculados.includes(campo)) {
            changedCells.add(`${mes}-${campo}`)
          }
        })
        
        recalculatedData[mes] = newMesData
        mesAnteriorData = recalculatedData[mes]
      }
    })

    // Actualizar las celdas que han cambiado recientemente
    setRecentlyChanged(changedCells)
    
    // Limpiar las celdas destacadas después de un tiempo
    setTimeout(() => {
      setRecentlyChanged(new Set())
    }, 1000)

    return recalculatedData
  }, [calcularCamposAutomaticos, meses, data, camposCalculados])

  // Función para obtener la tasa de interés del tenant
  const fetchInterestRate = async () => {
    try {
      // Por ahora usamos tenant ID 1, en producción esto vendría del contexto de usuario
      const response = await tenantsService.getById('1')
      if (response.success && response.data.interest_rate) {
        setInterestRate(response.data.interest_rate)
      }
    } catch (error) {
      console.error('Error al obtener tasa de interés:', error)
      // Mantener el valor por defecto de 0.02 si hay error
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      // Intentar obtener datos del backend
      let dataByMonth = {}
      
      try {
        const response = await estadosCuentaService.getAll(1, 12, selectedYear)
        
        // Verificar que response.data existe y es un array
        if (response && response.data && Array.isArray(response.data)) {
          response.data.forEach(item => {
            dataByMonth[item.mes] = item
          })
        }
      } catch (backendError) {
        console.warn('No se pudieron obtener datos del backend, usando datos iniciales:', backendError)
        // Si no hay datos del backend, usar datos iniciales
      }

      // Asegurar que todos los meses existen con valores por defecto o datos iniciales del Excel
      meses.forEach(mes => {
        if (!dataByMonth[mes]) {
          const datosIniciales = selectedYear === 2024 ? datosIniciales2024[mes] : {}
          dataByMonth[mes] = {
            mes,
            año: selectedYear,
            usuario_id: 1,
            numero_mes: meses.indexOf(mes) + 1,
            deuda_anterior_capital: 0,
            cuota_admon: datosIniciales?.cuota_admon || 0,
            retroactivo: datosIniciales?.retroactivo || 0,
            total_capital: 0,
            parqueaderos: datosIniciales?.parqueaderos || 0,
            sanciones: datosIniciales?.sanciones || 0,
            zonas_comunes: datosIniciales?.zonas_comunes || 0,
            cuota_extraordinaria: datosIniciales?.cuota_extraordinaria || 0,
            otros: datosIniciales?.otros || 0,
            deuda_intereses: 0,
            interes_mes: interestRate, // Usar la tasa de interés actual
            interes_mes_monto: 0, // Se calculará automáticamente
            interes_acumulado: 0,
            intereses_total: 0,
            capital: 0,
            pagos_retroactivo: 0,
            descuento_pronto_pago: 0,
            cuota_extra_pago: 0,
            pago_sanciones: 0,
            pago_parqueaderos: 0,
            zonas_comunes_pago: 0,
            pago_otros: 0,
            pago_intereses: 0,
            total_pagado: 0,
            fecha_pago: null,
            total_a_pagar: 0,
            saldo_pendiente: 0
          }
        } else {
          // Asegurar que los datos del backend tienen la tasa de interés correcta
          dataByMonth[mes].interes_mes = dataByMonth[mes].interes_mes || interestRate
        }
      })

      const recalculatedData = recalcularTabla(dataByMonth)
      setData(recalculatedData)
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setData({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInterestRate()
    fetchData()
  }, [selectedYear])

  // Efecto para recalcular cuando cambia la tasa de interés
  useEffect(() => {
    if (Object.keys(data).length > 0) {
      const recalculatedData = recalcularTabla(data)
      setData(recalculatedData)
    }
  }, [interestRate])

  const handleCellClick = (mes, campo) => {
    if (camposEditables.includes(campo)) {
      setEditingCell({ mes, campo })
      setTempValue(data[mes]?.[campo] || '')
    }
  }

  const handleCellChange = (value) => {
    setTempValue(value)
    
    // Actualización en tiempo real
    if (editingCell) {
      const newData = { ...data }
      if (!newData[editingCell.mes]) {
        newData[editingCell.mes] = {}
      }
      
      // Convertir el valor según el tipo de campo
      const numericValue = editingCell.campo === 'fecha_pago' ? value : parseFloat(value) || 0
      newData[editingCell.mes][editingCell.campo] = numericValue
      
      // Recalcular y actualizar inmediatamente
      const recalculatedData = recalcularTabla(newData)
      setData(recalculatedData)
    }
  }

  const handleCellSave = async () => {
    if (!editingCell) return

    const { mes, campo } = editingCell
    const newData = { ...data }
    
    // Actualizar el valor
    if (!newData[mes]) newData[mes] = {}
    const numericValue = campo === 'fecha_pago' ? tempValue : parseFloat(tempValue) || 0
    newData[mes][campo] = numericValue

    // Recalcular toda la tabla
    const recalculatedData = recalcularTabla(newData)
    setData(recalculatedData)
    setEditingCell(null)
    setTempValue('')
    setHasChanges(true)

    // Guardar en la base de datos
    try {
      const mesData = recalculatedData[mes]
      
      // Preparar datos para enviar al backend
      const dataToSave = {
        ...mesData,
        año: selectedYear,
        numero_mes: meses.indexOf(mes) + 1,
        usuario_id: 1 // Por ahora hardcodeado, en producción vendría del contexto
      }
      
      if (mesData.id) {
        await estadosCuentaService.update(mesData.id, dataToSave)
      } else {
        const response = await estadosCuentaService.create(dataToSave)
        if (response.success && response.data) {
          // Actualizar el ID en los datos locales
          const updatedData = { ...recalculatedData }
          updatedData[mes].id = response.data.id
          setData(updatedData)
        }
      }
      
      console.log(`Datos guardados para ${mes}:`, dataToSave)
    } catch (error) {
      console.error('Error al guardar:', error)
      // Mostrar mensaje de error al usuario
      alert('Error al guardar los datos. Por favor, intenta de nuevo.')
    }
  }

  const handleCellCancel = () => {
    setEditingCell(null)
    setTempValue('')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCellSave()
    } else if (e.key === 'Escape') {
      handleCellCancel()
    }
  }

  const renderCell = (mes, campo, value) => {
    const isEditing = editingCell?.mes === mes && editingCell?.campo === campo
    const isEditable = camposEditables.includes(campo)
    const isCalculated = camposCalculados.includes(campo)
    const isRecentlyChanged = recentlyChanged.has(`${mes}-${campo}`)

    if (isEditing) {
      return (
        <div className="flex items-center space-x-1">
          <input
            type={campo === 'fecha_pago' ? 'date' : 'number'}
            value={tempValue}
            onChange={(e) => handleCellChange(e.target.value)}
            onKeyDown={handleKeyPress}
            className="w-full px-1 py-1 text-xs border-2 border-blue-500 rounded focus:outline-none focus:border-blue-600 bg-blue-50"
            autoFocus
            step="1000"
            min="0"
          />
          <button onClick={handleCellSave} className="text-green-600 hover:text-green-800 transition-colors">
            <Save className="h-3 w-3" />
          </button>
          <button onClick={handleCellCancel} className="text-red-600 hover:text-red-800 transition-colors">
            <X className="h-3 w-3" />
          </button>
        </div>
      )
    }

    const displayValue = campo === 'fecha_pago' ? formatDate(value) : formatCurrency(value)
    
    return (
      <div
        className={`px-2 py-1 text-xs transition-all duration-200 ${
          isEditable ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-200 border border-transparent' : ''
        } ${isCalculated ? `bg-yellow-50 border border-yellow-200 font-medium text-gray-800 ${isRecentlyChanged ? 'animate-highlight' : ''}` : 'bg-gray-50 text-gray-600'} ${value && value !== 0 && !isRecentlyChanged ? 'animate-fade-in' : ''}`}
        onClick={() => handleCellClick(mes, campo)}
        title={isEditable ? 'Haz clic para editar' : isCalculated ? 'Campo calculado automáticamente' : 'Campo no editable'}
      >
        {displayValue || (isEditable ? '0' : '-')}
        {isEditable && !isEditing && (
          <Edit2 className="inline ml-1 h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Cargando datos...</span>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Tabla Dinámica - Estados de Cuenta {selectedYear}
        </h1>
        
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm font-medium text-gray-700">
            Año:
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[2023, 2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          
          <button
            onClick={fetchData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </button>

          {hasChanges && (
            <span className="text-green-600 text-sm font-medium">
              ✓ Cambios guardados automáticamente
            </span>
          )}
        </div>

        <div className="text-sm text-gray-600 mb-4">
          <p><strong>Instrucciones:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Los campos en <span className="bg-gray-100 px-1 rounded">gris</span> se calculan automáticamente</li>
            <li>Haz click en los campos editables para modificar valores</li>
            <li>Los cambios se guardan automáticamente y recalculan toda la tabla</li>
            <li>Presiona Enter para guardar o Escape para cancelar</li>
          </ul>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                MES
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r bg-yellow-50">
                DEUDA ANTERIOR CAPITAL
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                CUOTA ADMINISTRACIÓN
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                RETROACTIVO
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r bg-yellow-50">
                TOTAL CAPITAL
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                PARQUEADEROS
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                SANCIONES
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                ZONAS COMUNES
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                CUOTA EXTRAORDINARIA
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                OTROS
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r bg-yellow-50">
                DEUDA INTERESES
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r bg-yellow-50">
                INTERÉS MES
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r bg-yellow-50">
                INTERÉS ACUMULADO
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r bg-yellow-50">
                INTERESES TOTAL
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r bg-yellow-50">
                CAPITAL
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                PAGOS RETROACTIVO
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                DESCUENTO PRONTO PAGO
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                CUOTA EXTRA PAGO
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                PAGO SANCIONES
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                PAGO PARQUEADEROS
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                ZONAS COMUNES PAGO
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                PAGO OTROS
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                PAGO INTERESES
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r bg-yellow-50">
                TOTAL PAGADO
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                FECHA DE PAGO
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r bg-yellow-50">
                TOTAL A PAGAR
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50">
                SALDO PENDIENTE
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {meses.map((mes, index) => {
              const rowData = data[mes] || {}
              return (
                <tr key={mes} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-2 py-2 text-xs font-medium text-gray-900 border-r">
                    {mes}
                  </td>
                  <td className="border-r">{renderCell(mes, 'deuda_anterior_capital', rowData.deuda_anterior_capital)}</td>
                  <td className="border-r">{renderCell(mes, 'cuota_admon', rowData.cuota_admon)}</td>
                  <td className="border-r">{renderCell(mes, 'retroactivo', rowData.retroactivo)}</td>
                  <td className="border-r">{renderCell(mes, 'total_capital', rowData.total_capital)}</td>
                  <td className="border-r">{renderCell(mes, 'parqueaderos', rowData.parqueaderos)}</td>
                  <td className="border-r">{renderCell(mes, 'sanciones', rowData.sanciones)}</td>
                  <td className="border-r">{renderCell(mes, 'zonas_comunes', rowData.zonas_comunes)}</td>
                  <td className="border-r">{renderCell(mes, 'cuota_extraordinaria', rowData.cuota_extraordinaria)}</td>
                  <td className="border-r">{renderCell(mes, 'otros', rowData.otros)}</td>
                  <td className="border-r">{renderCell(mes, 'deuda_intereses', rowData.deuda_intereses)}</td>
                  <td className="border-r">{renderCell(mes, 'interes_mes', rowData.interes_mes)}</td>
                  <td className="border-r">{renderCell(mes, 'interes_acumulado', rowData.interes_acumulado)}</td>
                  <td className="border-r">{renderCell(mes, 'intereses_total', rowData.intereses_total)}</td>
                  <td className="border-r">{renderCell(mes, 'capital', rowData.capital)}</td>
                  <td className="border-r">{renderCell(mes, 'pagos_retroactivo', rowData.pagos_retroactivo)}</td>
                  <td className="border-r">{renderCell(mes, 'descuento_pronto_pago', rowData.descuento_pronto_pago)}</td>
                  <td className="border-r">{renderCell(mes, 'cuota_extra_pago', rowData.cuota_extra_pago)}</td>
                  <td className="border-r">{renderCell(mes, 'pago_sanciones', rowData.pago_sanciones)}</td>
                  <td className="border-r">{renderCell(mes, 'pago_parqueaderos', rowData.pago_parqueaderos)}</td>
                  <td className="border-r">{renderCell(mes, 'zonas_comunes_pago', rowData.zonas_comunes_pago)}</td>
                  <td className="border-r">{renderCell(mes, 'pago_otros', rowData.pago_otros)}</td>
                  <td className="border-r">{renderCell(mes, 'pago_intereses', rowData.pago_intereses)}</td>
                  <td className="border-r">{renderCell(mes, 'total_pagado', rowData.total_pagado)}</td>
                  <td className="border-r">{renderCell(mes, 'fecha_pago', rowData.fecha_pago)}</td>
                  <td className="border-r">{renderCell(mes, 'total_a_pagar', rowData.total_a_pagar)}</td>
                  <td>{renderCell(mes, 'saldo_pendiente', rowData.saldo_pendiente)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-sm text-gray-500">
        <p><strong>Leyenda:</strong></p>
        <div className="flex items-center space-x-4 mt-2">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-50 border mr-2"></div>
            <span>Campos calculados automáticamente</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-white border mr-2"></div>
            <span>Campos editables</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TablaDinamica