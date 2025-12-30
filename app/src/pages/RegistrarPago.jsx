import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { 
  CreditCard, 
  X, 
  Calculator,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Calendar
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { estadosCuentaService, pagosService, formatters, MESES } from '../services/api'

const RegistrarPago = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [filtros, setFiltros] = useState({
    año: new Date().getFullYear(),
    mes: 'ENERO'
  })

  // Campos de entrada manual según las fórmulas de Excel
  const [camposManual, setCamposManual] = useState({
    cuota_admon: 0,
    retroactivo: 0,
    deuda_intereses: 0,
    descuento_pronto_pago: 0
  })

  const [pagoData, setPagoData] = useState({
    monto_total: 0,
    fecha_pago: new Date().toISOString().split('T')[0],
    // Distribución del pago - estos se calculan automáticamente
    pago_retroactivo: 0,
    pago_cuota_extra: 0,
    pago_sanciones: 0,
    pago_parqueaderos: 0,
    pago_zonas_comunes: 0,
    pago_otros: 0,
    pago_intereses: 0,
    pago_capital: 0
  })

  // Obtener estado de cuenta del período seleccionado
  const { data: estadoCuenta, isLoading: loadingEstado } = useQuery(
    ['estado-cuenta', filtros.año, filtros.mes],
    () => estadosCuentaService.getByPeriod(filtros.año, filtros.mes),
    {
      enabled: !!filtros.año && !!filtros.mes
    }
  )

  // Mutación para registrar pago
  const pagoMutation = useMutation(
    (data) => pagosService.registrar(data),
    {
      onSuccess: () => {
        toast.success('Pago registrado exitosamente')
        queryClient.invalidateQueries('estados-cuenta')
        queryClient.invalidateQueries('dashboard-stats')
        queryClient.invalidateQueries('tabla-completa')
        navigate('/estados-cuenta')
      },
      onError: (error) => {
        toast.error('Error al registrar el pago')
        console.error('Error:', error)
      }
    }
  )

  // Calcular distribución automática basada en las fórmulas de Excel
  const calcularDistribucionAutomatica = (montoTotal) => {
    if (!estadoCuenta || montoTotal <= 0) {
      return {
        pago_retroactivo: 0,
        pago_cuota_extra: 0,
        pago_sanciones: 0,
        pago_parqueaderos: 0,
        pago_zonas_comunes: 0,
        pago_otros: 0,
        pago_intereses: 0,
        pago_capital: 0
      }
    }

    let montoRestante = montoTotal
    const distribucion = {}

    // Orden de prioridad según las fórmulas de Excel (columnas S, T, U, V, W, X)
    // 1. CUOTA EXTRAPAGO (J - columna S)
    const saldoCuotaExtra = Math.max(0, estadoCuenta.cuota_extraor || 0)
    if (saldoCuotaExtra > 0 && montoRestante > 0) {
      const pago = Math.min(montoRestante, saldoCuotaExtra)
      distribucion.pago_cuota_extra = pago
      montoRestante -= pago
    } else {
      distribucion.pago_cuota_extra = 0
    }

    // 2. PAGO SANCIONES (H - columna T)
    const saldoSanciones = Math.max(0, estadoCuenta.sanciones || 0)
    if (saldoSanciones > 0 && montoRestante > 0) {
      const pago = Math.min(montoRestante, saldoSanciones)
      distribucion.pago_sanciones = pago
      montoRestante -= pago
    } else {
      distribucion.pago_sanciones = 0
    }

    // 3. PAGO PARQUEADEROS (G - columna U)
    const saldoParqueaderos = Math.max(0, estadoCuenta.parqueaderos || 0)
    if (saldoParqueaderos > 0 && montoRestante > 0) {
      const pago = Math.min(montoRestante, saldoParqueaderos)
      distribucion.pago_parqueaderos = pago
      montoRestante -= pago
    } else {
      distribucion.pago_parqueaderos = 0
    }

    // 4. ZONAS COMUNES PAGO (I - columna V)
    const saldoZonasComunes = Math.max(0, estadoCuenta.zonas_comunes || 0)
    if (saldoZonasComunes > 0 && montoRestante > 0) {
      const pago = Math.min(montoRestante, saldoZonasComunes)
      distribucion.pago_zonas_comunes = pago
      montoRestante -= pago
    } else {
      distribucion.pago_zonas_comunes = 0
    }

    // 5. PAGO OTROS (K - columna W)
    const saldoOtros = Math.max(0, estadoCuenta.otros || 0)
    if (saldoOtros > 0 && montoRestante > 0) {
      const pago = Math.min(montoRestante, saldoOtros)
      distribucion.pago_otros = pago
      montoRestante -= pago
    } else {
      distribucion.pago_otros = 0
    }

    // 6. PAGO INTERESES (O - columna X)
    const saldoIntereses = Math.max(0, estadoCuenta.intereses_total || 0)
    if (saldoIntereses > 0 && montoRestante > 0) {
      const pago = Math.min(montoRestante, saldoIntereses)
      distribucion.pago_intereses = pago
      montoRestante -= pago
    } else {
      distribucion.pago_intereses = 0
    }

    // 7. PAGOS RETROACTIVO (E - columna Q)
    const saldoRetroactivo = Math.max(0, camposManual.retroactivo || 0)
    if (saldoRetroactivo > 0 && montoRestante > 0) {
      const pago = Math.min(montoRestante, saldoRetroactivo)
      distribucion.pago_retroactivo = pago
      montoRestante -= pago
    } else {
      distribucion.pago_retroactivo = 0
    }

    // 8. Lo que quede va a CAPITAL (P - columna P)
    if (montoRestante > 0) {
      const saldoCapital = Math.max(0, (estadoCuenta.total_capital || 0) - (distribucion.pago_retroactivo || 0))
      distribucion.pago_capital = Math.min(montoRestante, saldoCapital)
      montoRestante -= distribucion.pago_capital
    } else {
      distribucion.pago_capital = 0
    }

    // Si aún queda dinero después de distribuir todo, agregarlo al capital
    // Esto asegura que la suma total sea exactamente igual al monto ingresado
    if (montoRestante > 0) {
      distribucion.pago_capital += montoRestante
    }

    // Redondear todos los valores para evitar problemas de precisión
    Object.keys(distribucion).forEach(key => {
      distribucion[key] = Math.round(distribucion[key] * 100) / 100
    })

    return distribucion
  }

  // Manejar cambio en campos manuales
  const handleCampoManualChange = (campo, valor) => {
    const nuevoValor = parseFloat(valor) || 0
    setCamposManual(prev => ({
      ...prev,
      [campo]: nuevoValor
    }))

    // Recalcular distribución automática si hay un monto total
    if (pagoData.monto_total > 0) {
      const nuevaDistribucion = calcularDistribucionAutomatica(pagoData.monto_total)
      setPagoData(prev => ({
        ...prev,
        ...nuevaDistribucion
      }))
    }
  }

  // Manejar cambio en el monto total
  const handleMontoChange = (nuevoMonto) => {
    const monto = parseFloat(nuevoMonto) || 0
    setPagoData(prev => ({
      ...prev,
      monto_total: monto
    }))

    // Calcular distribución automática
    const nuevaDistribucion = calcularDistribucionAutomatica(monto)
    setPagoData(prev => ({
      ...prev,
      ...nuevaDistribucion
    }))
  }

  // Validar formulario
  const validarFormulario = () => {
    if (!estadoCuenta) {
      toast.error('Selecciona un período válido')
      return false
    }

    if (pagoData.monto_total <= 0) {
      toast.error('El monto del pago debe ser mayor a 0')
      return false
    }

    if (!pagoData.fecha_pago) {
      toast.error('La fecha de pago es requerida')
      return false
    }

    // Calcular total distribuido con mayor precisión
    const totalDistribucion = Object.keys(pagoData)
      .filter(key => key.startsWith('pago_'))
      .reduce((sum, key) => sum + (parseFloat(pagoData[key]) || 0), 0)

    // Usar una tolerancia más amplia para diferencias de redondeo
    const diferencia = Math.abs(totalDistribucion - parseFloat(pagoData.monto_total))
    
    // Solo validar si la diferencia es significativa (mayor a 1 peso)
    if (diferencia > 1) {
      toast.error(`La distribución del pago (${formatters.currency(totalDistribucion)}) no coincide con el monto total (${formatters.currency(pagoData.monto_total)}). Diferencia: ${formatters.currency(diferencia)}`)
      return false
    }

    return true
  }

  // Enviar formulario
  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validarFormulario()) return

    const dataToSend = {
      usuario_id: estadoCuenta?.usuario_id || 1, // Usar el usuario_id del estado de cuenta
      año: filtros.año,
      mes: filtros.mes,
      total_pagado: parseFloat(pagoData.monto_total),
      pagos_retroactivo: parseFloat(pagoData.pago_retroactivo || 0),
      descuento_pronto_pago: 0, // Campo requerido por el modelo
      cuota_extra_pago: parseFloat(pagoData.pago_cuota_extra || 0),
      pago_sanciones: parseFloat(pagoData.pago_sanciones || 0),
      pago_parqueaderos: parseFloat(pagoData.pago_parqueaderos || 0),
      zonas_comunes_pago: parseFloat(pagoData.pago_zonas_comunes || 0),
      pago_otros: parseFloat(pagoData.pago_otros || 0),
      pago_intereses: parseFloat(pagoData.pago_intereses || 0),
      fecha_pago: pagoData.fecha_pago ? new Date(pagoData.fecha_pago).toISOString() : null
    }

    pagoMutation.mutate(dataToSend)
  }

  // Calcular total distribuido
  const totalDistribuido = Object.keys(pagoData)
    .filter(key => key.startsWith('pago_'))
    .reduce((sum, key) => sum + (pagoData[key] || 0), 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Registrar Pago</h1>
          <p className="mt-2 text-gray-600">
            Registra un pago para un período específico
          </p>
        </div>
        <button
          onClick={() => navigate('/estados-cuenta')}
          className="btn btn-secondary"
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selección de Período */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Seleccionar Período</h3>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Año
                </label>
                <input
                  type="number"
                  min="2020"
                  max="2030"
                  value={filtros.año}
                  onChange={(e) => setFiltros(prev => ({ ...prev, año: parseInt(e.target.value) }))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mes
                </label>
                <select
                  value={filtros.mes}
                  onChange={(e) => setFiltros(prev => ({ ...prev, mes: e.target.value }))}
                  className="input"
                >
                  {MESES.map(mes => (
                    <option key={mes} value={mes}>{mes}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Estado de Cuenta del Período */}
        {loadingEstado ? (
          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            </div>
          </div>
        ) : estadoCuenta ? (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Estado de Cuenta - {filtros.mes} {filtros.año}</h3>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-lg font-semibold text-blue-600">
                    {formatters.currency(estadoCuenta.total_capital)}
                  </p>
                  <p className="text-xs text-gray-600">Total Capital</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-lg font-semibold text-yellow-600">
                    {formatters.currency(estadoCuenta.intereses_total)}
                  </p>
                  <p className="text-xs text-gray-600">Intereses</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-lg font-semibold text-green-600">
                    {formatters.currency(estadoCuenta.total_a_pagar)}
                  </p>
                  <p className="text-xs text-gray-600">Total a Pagar</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-lg font-semibold text-red-600">
                    {formatters.currency(estadoCuenta.saldo_pendiente)}
                  </p>
                  <p className="text-xs text-gray-600">Saldo Pendiente</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card bg-yellow-50 border-yellow-200">
            <div className="card-content">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    No se encontró estado de cuenta
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    No existe un registro para el período seleccionado. 
                    Crea primero el registro mensual.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Información del Pago */}
        {estadoCuenta && (
          <>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Información del Pago</h3>
              </div>
              <div className="card-content">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monto Total del Pago *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={pagoData.monto_total}
                        onChange={(e) => handleMontoChange(parseFloat(e.target.value) || 0)}
                        className="input pl-10"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Pago *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="date"
                        value={pagoData.fecha_pago}
                        onChange={(e) => setPagoData(prev => ({ ...prev, fecha_pago: e.target.value }))}
                        className="input pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-700 font-medium">
                        Distribución automática activada
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        El pago se distribuye automáticamente según las prioridades: Cuota Extra → Sanciones → Parqueaderos → Zonas Comunes → Otros → Intereses → Retroactivo → Capital
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Distribución del Pago */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h3 className="card-title">Distribución del Pago</h3>
                  <div className="text-sm">
                    <span className="text-gray-600">Total distribuido: </span>
                    <span className={`font-semibold ${
                      Math.abs(totalDistribuido - pagoData.monto_total) > 0.01 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {formatters.currency(totalDistribuido)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="card-content">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { campo: 'pago_capital', label: 'Capital', saldo: (estadoCuenta.total_capital || 0) - (estadoCuenta.retroactivo || 0) },
                    { campo: 'pago_retroactivo', label: 'Retroactivo', saldo: estadoCuenta.retroactivo || 0 },
                    { campo: 'pago_cuota_extra', label: 'Cuota Extra', saldo: estadoCuenta.cuota_extraor || 0 },
                    { campo: 'pago_sanciones', label: 'Sanciones', saldo: estadoCuenta.sanciones || 0 },
                    { campo: 'pago_parqueaderos', label: 'Parqueaderos', saldo: estadoCuenta.parqueaderos || 0 },
                    { campo: 'pago_zonas_comunes', label: 'Zonas Comunes', saldo: estadoCuenta.zonas_comunes || 0 },
                    { campo: 'pago_otros', label: 'Otros', saldo: estadoCuenta.otros || 0 },
                    { campo: 'pago_intereses', label: 'Intereses', saldo: estadoCuenta.intereses_total || 0 }
                  ].map(({ campo, label, saldo }) => (
                    <div key={campo}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {label}
                        <span className="text-xs text-gray-500 ml-1">
                          (Saldo: {formatters.currency(saldo)})
                        </span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={saldo}
                        value={pagoData[campo]}
                        onChange={(e) => setPagoData(prev => ({ ...prev, [campo]: parseFloat(e.target.value) || 0 }))}
                        disabled={true}
                        className="input bg-gray-50"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Resumen */}
            <div className="card bg-gray-50">
              <div className="card-content">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatters.currency(pagoData.monto_total)}
                    </p>
                    <p className="text-sm text-gray-600">Monto del Pago</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatters.currency(totalDistribuido)}
                    </p>
                    <p className="text-sm text-gray-600">Total Distribuido</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${
                      Math.abs(totalDistribuido - pagoData.monto_total) > 0.01 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {formatters.currency(pagoData.monto_total - totalDistribuido)}
                    </p>
                    <p className="text-sm text-gray-600">Diferencia</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/estados-cuenta')}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pagoMutation.isLoading || !estadoCuenta}
                className="btn btn-primary"
              >
                {pagoMutation.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Registrando...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Registrar Pago
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  )
}

export default RegistrarPago