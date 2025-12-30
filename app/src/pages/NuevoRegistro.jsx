import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { 
  Save, 
  X, 
  Calculator,
  AlertCircle,
  CheckCircle,
  Info,
  RefreshCw,
  Building
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { estadosCuentaService, propertiesService, tenantsService, validators, MESES } from '../services/api'

const NuevoRegistro = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    año: new Date().getFullYear(),
    mes: 'ENERO',
    property_id: '', // Campo para seleccionar apartamento
    // Valores base - solo los requeridos tienen valores por defecto
    cuota_admon: 570000, // Valor típico de cuota de administración
    retroactivo: 0,
    // Campos opcionales - se inicializan vacíos y se convierten a 0 si están vacíos
    parqueaderos_manual: '',
    sanciones_manual: '',
    zonas_comunes_manual: '',
    cuota_extraordinaria_manual: '',
    otros_manual: '',
    // Configuración
    interes_mes: 0.02, // 2% por defecto
    fecha_pago: ''
  })

  const [errors, setErrors] = useState({})
  const [showCalculations, setShowCalculations] = useState(false)

  // Query para obtener propiedades disponibles
  const { data: propertiesData, isLoading: propertiesLoading, error: propertiesError } = useQuery(
    'properties',
    () => propertiesService.getAll(1, 100), // Obtener hasta 100 propiedades
    {
      onError: (error) => {
        console.error('Error cargando propiedades:', error)
        toast.error('Error al cargar las propiedades disponibles')
      }
    }
  )

  // Mutación para crear registro
  const createMutation = useMutation(
    (data) => estadosCuentaService.create(data),
    {
      onSuccess: () => {
        toast.success('Registro creado exitosamente')
        queryClient.invalidateQueries('estados-cuenta')
        queryClient.invalidateQueries('tabla-completa')
        navigate('/estados-cuenta')
      },
      onError: (error) => {
        console.error('Error completo:', error)
        
        // Manejo específico para errores de registro duplicado
        if (error.response?.status === 500 && 
            error.response?.data?.detail?.includes('Ya existe un registro')) {
          toast.error(`Ya existe un registro para ${formData.mes} ${formData.año}. Por favor selecciona un período diferente.`)
        } else if (error.response?.status === 422) {
          toast.error('Datos inválidos. Por favor verifica que todos los campos requeridos estén completos.')
        } else {
          toast.error('Error al crear el registro: ' + (error.response?.data?.detail || error.message))
        }
      }
    }
  )

  // Mutación para actualizar la tasa de interés del tenant
  const updateTenantMutation = useMutation(
    ({ tenantId, interestRate }) => tenantsService.update(tenantId, { interest_rate: interestRate }),
    {
      onSuccess: () => {
        console.log('Tasa de interés del tenant actualizada exitosamente')
      },
      onError: (error) => {
        console.error('Error actualizando tasa de interés del tenant:', error)
        toast.error('Error al actualizar la tasa de interés')
      }
    }
  )

  // Función para limpiar todos los campos opcionales
  const limpiarCamposOpcionales = () => {
    setFormData(prev => ({
      ...prev,
      parqueaderos_manual: '',
      sanciones_manual: '',
      zonas_comunes_manual: '',
      cuota_extraordinaria_manual: '',
      otros_manual: '',
      fecha_pago: ''
    }))
    toast.success('Campos opcionales limpiados')
  }

  // Función para convertir valores vacíos a 0
  const parseNumericValue = (value) => {
    if (value === '' || value === null || value === undefined) return 0
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
  }

  // Calcular valores automáticamente
  const calcularValores = () => {
    const cuotaAdmon = parseNumericValue(formData.cuota_admon)
    const retroactivo = parseNumericValue(formData.retroactivo)
    const parqueaderos = parseNumericValue(formData.parqueaderos_manual)
    const sanciones = parseNumericValue(formData.sanciones_manual)
    const zonasComunes = parseNumericValue(formData.zonas_comunes_manual)
    const cuotaExtra = parseNumericValue(formData.cuota_extraordinaria_manual)
    const otros = parseNumericValue(formData.otros_manual)
    const tasaInteres = parseNumericValue(formData.interes_mes)

    // Cálculos basados en las fórmulas del Excel
    const total_capital = cuotaAdmon + retroactivo
    const interes_mes_calculado = Math.round(total_capital * tasaInteres)
    const intereses_total = interes_mes_calculado
    const total_a_pagar = total_capital + parqueaderos + sanciones + zonasComunes + cuotaExtra + otros + intereses_total
    const saldo_pendiente = total_a_pagar // Sin pagos iniciales

    return {
      total_capital,
      interes_mes_calculado,
      intereses_total,
      total_a_pagar,
      saldo_pendiente,
      // Valores individuales para mostrar
      parqueaderos,
      sanciones,
      zonas_comunes: zonasComunes,
      cuota_extra: cuotaExtra,
      otros
    }
  }

  const valoresCalculados = calcularValores()

  // Manejar cambios en el formulario
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }
  }

  // Validar formulario
  const validateForm = () => {
    const newErrors = {}

    // Validar año
    const currentYear = new Date().getFullYear()
    if (!formData.año) {
      newErrors.año = 'El año es requerido'
    } else if (formData.año < 2020 || formData.año > currentYear + 5) {
      newErrors.año = `El año debe estar entre 2020 y ${currentYear + 5}`
    }

    // Validar mes
    if (!formData.mes) {
      newErrors.mes = 'El mes es requerido'
    }

    // Validar apartamento/propiedad
    if (!formData.property_id) {
      newErrors.property_id = 'Debe seleccionar un apartamento'
    }

    // Validar cuota de administración
    const cuotaAdmon = parseNumericValue(formData.cuota_admon)
    if (!formData.cuota_admon || cuotaAdmon <= 0) {
      newErrors.cuota_admon = 'La cuota de administración debe ser mayor a 0'
    } else if (cuotaAdmon > 10000000) {
      newErrors.cuota_admon = 'La cuota de administración parece muy alta (máximo $10,000,000)'
    }

    // Validar retroactivo
    const retroactivo = parseNumericValue(formData.retroactivo)
    if (retroactivo < 0) {
      newErrors.retroactivo = 'El retroactivo no puede ser negativo'
    } else if (retroactivo > 50000000) {
      newErrors.retroactivo = 'El retroactivo parece muy alto (máximo $50,000,000)'
    }

    // Validar tasa de interés
    const interesMes = parseNumericValue(formData.interes_mes)
    if (interesMes < 0 || interesMes > 1) {
      newErrors.interes_mes = 'La tasa de interés debe estar entre 0% y 100% (0.0 - 1.0)'
    } else if (interesMes > 0.15) {
      newErrors.interes_mes = 'La tasa de interés parece muy alta (¿más del 15% mensual?)'
    } else if (interesMes > 0 && interesMes < 0.00001) {
      newErrors.interes_mes = 'La tasa de interés debe tener al menos 5 decimales de precisión'
    }

    // Validar que los campos numéricos opcionales sean válidos si se proporcionan
    const camposNumericos = [
      { key: 'parqueaderos_manual', label: 'Parqueaderos', max: 10000000 },
      { key: 'sanciones_manual', label: 'Sanciones', max: 50000000 },
      { key: 'zonas_comunes_manual', label: 'Zonas comunes', max: 10000000 },
      { key: 'cuota_extraordinaria_manual', label: 'Cuota extraordinaria', max: 50000000 },
      { key: 'otros_manual', label: 'Otros conceptos', max: 50000000 }
    ]

    camposNumericos.forEach(campo => {
      const valor = formData[campo.key]
      if (valor !== '' && valor !== null && valor !== undefined) {
        const numericValue = parseFloat(valor)
        if (isNaN(numericValue)) {
          newErrors[campo.key] = `${campo.label} debe ser un número válido`
        } else if (numericValue < 0) {
          newErrors[campo.key] = `${campo.label} no puede ser negativo`
        } else if (numericValue > campo.max) {
          newErrors[campo.key] = `${campo.label} parece muy alto (máximo $${campo.max.toLocaleString()})`
        }
      }
    })

    // Validar fecha de pago si se proporciona
    if (formData.fecha_pago) {
      const fechaPago = new Date(formData.fecha_pago)
      const fechaActual = new Date()
      const fechaMinima = new Date(2020, 0, 1) // 1 enero 2020
      
      if (fechaPago > fechaActual) {
        newErrors.fecha_pago = 'La fecha de pago no puede ser futura'
      } else if (fechaPago < fechaMinima) {
        newErrors.fecha_pago = 'La fecha de pago no puede ser anterior a 2020'
      }
    }

    // Validación de lógica de negocio: verificar que no exista ya un registro para ese período
    // Esta validación se hará en el servidor, pero podemos agregar una advertencia aquí

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario')
      return
    }

    // Convertir mes de texto a número
    const mesNumero = MESES.indexOf(formData.mes) + 1

    // Primero actualizar la tasa de interés del tenant si ha cambiado
    const currentInterestRate = parseNumericValue(formData.interes_mes)
    if (currentInterestRate !== 0.02) { // Solo actualizar si es diferente al valor por defecto
      try {
        await updateTenantMutation.mutateAsync({ 
          tenantId: '1', // Por ahora usamos tenant ID 1, en producción esto vendría del contexto de usuario
          interestRate: currentInterestRate 
        })
      } catch (error) {
        console.error('Error actualizando tasa de interés:', error)
        // Continuar con la creación del registro aunque falle la actualización de la tasa
      }
    }

    const dataToSend = {
      property_id: formData.property_id, // Usar property_id seleccionado por el usuario
      year: formData.año, // Mapear año -> year
      month: mesNumero, // Mapear mes -> month (como número)
      cuota_admon: parseNumericValue(formData.cuota_admon),
      retroactivo: parseNumericValue(formData.retroactivo),
      parqueaderos: parseNumericValue(formData.parqueaderos_manual),
      sanciones: parseNumericValue(formData.sanciones_manual),
      zonas_comunes: parseNumericValue(formData.zonas_comunes_manual),
      cuota_extraordinaria: parseNumericValue(formData.cuota_extraordinaria_manual),
      otros: parseNumericValue(formData.otros_manual),
      interes_mes: parseNumericValue(formData.interes_mes), // Enviar la tasa de interés específica
      monto_pagado: 0 // Inicializar monto_pagado en 0
    }

    console.log('Datos a enviar:', dataToSend)
    createMutation.mutate(dataToSend)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nuevo Registro Mensual</h1>
          <p className="mt-2 text-gray-600">
            Crea un nuevo registro financiero mensual. Los campos vacíos se guardarán como cero.
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={limpiarCamposOpcionales}
            className="btn btn-outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Limpiar Opcionales
          </button>
          <button
            onClick={() => navigate('/estados-cuenta')}
            className="btn btn-secondary"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Información del Período</h3>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apartamento *
                </label>
                <select
                  value={formData.property_id}
                  onChange={(e) => handleInputChange('property_id', e.target.value)}
                  className={`input ${errors.property_id ? 'border-red-300' : ''}`}
                  disabled={propertiesLoading}
                >
                  <option value="">Seleccionar apartamento...</option>
                  {propertiesData?.data?.items?.map(property => (
                    <option key={property.id} value={property.id}>
                      {property.number}
                      {property.tower && ` (Torre ${property.tower})`}
                    </option>
                  ))}
                </select>
                {errors.property_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.property_id}</p>
                )}
                {propertiesLoading && (
                  <p className="mt-1 text-sm text-gray-500">Cargando apartamentos...</p>
                )}
                {propertiesError && (
                  <p className="mt-1 text-sm text-red-600">Error al cargar apartamentos</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Año *
                </label>
                <input
                  type="number"
                  min="2020"
                  max="2030"
                  value={formData.año}
                  onChange={(e) => handleInputChange('año', parseInt(e.target.value))}
                  className={`input ${errors.año ? 'border-red-300' : ''}`}
                />
                {errors.año && (
                  <p className="mt-1 text-sm text-red-600">{errors.año}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mes *
                </label>
                <select
                  value={formData.mes}
                  onChange={(e) => handleInputChange('mes', e.target.value)}
                  className={`input ${errors.mes ? 'border-red-300' : ''}`}
                >
                  {MESES.map(mes => (
                    <option key={mes} value={mes}>{mes}</option>
                  ))}
                </select>
                {errors.mes && (
                  <p className="mt-1 text-sm text-red-600">{errors.mes}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Valores Base */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Valores Base (Requeridos)</h3>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cuota de Administración *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cuota_admon}
                  onChange={(e) => handleInputChange('cuota_admon', e.target.value)}
                  className={`input ${errors.cuota_admon ? 'border-red-300' : ''}`}
                  placeholder="570000"
                />
                {errors.cuota_admon && (
                  <p className="mt-1 text-sm text-red-600">{errors.cuota_admon}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Retroactivo
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.retroactivo}
                  onChange={(e) => handleInputChange('retroactivo', e.target.value)}
                  className="input"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Campos Opcionales */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Campos Opcionales</h3>
            <p className="text-sm text-gray-600">Deja en blanco los campos que no apliquen (se guardarán como cero)</p>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parqueaderos
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.parqueaderos_manual}
                  onChange={(e) => handleInputChange('parqueaderos_manual', e.target.value)}
                  className={`input ${errors.parqueaderos_manual ? 'border-red-300' : ''}`}
                  placeholder="Opcional"
                />
                {errors.parqueaderos_manual && (
                  <p className="mt-1 text-sm text-red-600">{errors.parqueaderos_manual}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sanciones
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.sanciones_manual}
                  onChange={(e) => handleInputChange('sanciones_manual', e.target.value)}
                  className={`input ${errors.sanciones_manual ? 'border-red-300' : ''}`}
                  placeholder="Opcional"
                />
                {errors.sanciones_manual && (
                  <p className="mt-1 text-sm text-red-600">{errors.sanciones_manual}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zonas Comunes
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.zonas_comunes_manual}
                  onChange={(e) => handleInputChange('zonas_comunes_manual', e.target.value)}
                  className={`input ${errors.zonas_comunes_manual ? 'border-red-300' : ''}`}
                  placeholder="Opcional"
                />
                {errors.zonas_comunes_manual && (
                  <p className="mt-1 text-sm text-red-600">{errors.zonas_comunes_manual}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cuota Extraordinaria
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cuota_extraordinaria_manual}
                  onChange={(e) => handleInputChange('cuota_extraordinaria_manual', e.target.value)}
                  className={`input ${errors.cuota_extraordinaria_manual ? 'border-red-300' : ''}`}
                  placeholder="Opcional"
                />
                {errors.cuota_extraordinaria_manual && (
                  <p className="mt-1 text-sm text-red-600">{errors.cuota_extraordinaria_manual}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Otros Conceptos
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.otros_manual}
                  onChange={(e) => handleInputChange('otros_manual', e.target.value)}
                  className={`input ${errors.otros_manual ? 'border-red-300' : ''}`}
                  placeholder="Opcional"
                />
                {errors.otros_manual && (
                  <p className="mt-1 text-sm text-red-600">{errors.otros_manual}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tasa de Interés Mensual
                </label>
                <input
                  type="number"
                  step="0.00001"
                  min="0"
                  max="1"
                  value={formData.interes_mes}
                  onChange={(e) => handleInputChange('interes_mes', parseFloat(e.target.value))}
                  className={`input ${errors.interes_mes ? 'border-red-300' : ''}`}
                  placeholder="Ej: 0.02762 para 2.762%"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Ingrese la tasa decimal (ej: 0.02762 = 2.762%)
                </p>
                {errors.interes_mes && (
                  <p className="mt-1 text-sm text-red-600">{errors.interes_mes}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Resumen de Cálculos */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="card-title">Resumen de Cálculos</h3>
              <button
                type="button"
                onClick={() => setShowCalculations(!showCalculations)}
                className="btn btn-outline btn-sm"
              >
                <Calculator className="h-4 w-4 mr-2" />
                {showCalculations ? 'Ocultar' : 'Ver'} Detalles
              </button>
            </div>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  ${valoresCalculados.total_capital.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Total Capital</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">
                  ${valoresCalculados.intereses_total.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Intereses Total</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  ${valoresCalculados.total_a_pagar.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Total a Pagar</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-600">
                  {(parseFloat(formData.interes_mes) * 100).toFixed(2)}%
                </p>
                <p className="text-sm text-gray-600">Tasa Interés</p>
              </div>
            </div>

            {showCalculations && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Desglose Detallado:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><span className="font-medium">Cuota Administración:</span> ${parseNumericValue(formData.cuota_admon).toLocaleString()}</p>
                    <p><span className="font-medium">Retroactivo:</span> ${parseNumericValue(formData.retroactivo).toLocaleString()}</p>
                    <p><span className="font-medium">Parqueaderos:</span> ${valoresCalculados.parqueaderos.toLocaleString()}</p>
                    <p><span className="font-medium">Sanciones:</span> ${valoresCalculados.sanciones.toLocaleString()}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Zonas Comunes:</span> ${valoresCalculados.zonas_comunes.toLocaleString()}</p>
                    <p><span className="font-medium">Cuota Extraordinaria:</span> ${valoresCalculados.cuota_extra.toLocaleString()}</p>
                    <p><span className="font-medium">Otros:</span> ${valoresCalculados.otros.toLocaleString()}</p>
                    <p><span className="font-medium">Interés del Mes:</span> ${valoresCalculados.interes_mes_calculado.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fecha de Pago Opcional */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Información Adicional</h3>
          </div>
          <div className="card-content">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Pago (Opcional)
              </label>
              <input
                type="date"
                value={formData.fecha_pago}
                onChange={(e) => handleInputChange('fecha_pago', e.target.value)}
                className="input max-w-xs"
              />
              <p className="mt-1 text-xs text-gray-500">
                Si no se especifica, se usará la fecha actual al registrar un pago
              </p>
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
            disabled={createMutation.isLoading}
            className="btn btn-primary"
          >
            {createMutation.isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Crear Registro
              </>
            )}
          </button>
        </div>
      </form>

      {/* Información de ayuda */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="card-content">
          <div className="flex">
            <Info className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Información Importante</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Los campos marcados con * son obligatorios</li>
                  <li>Los campos opcionales vacíos se guardarán automáticamente como cero</li>
                  <li>Los cálculos se realizan automáticamente basados en las fórmulas del Excel original</li>
                  <li>El Total Capital incluye la cuota de administración y retroactivos</li>
                  <li>Los intereses se calculan sobre el total capital usando la tasa especificada</li>
                  <li>Puedes usar el botón "Limpiar Opcionales" para vaciar todos los campos opcionales</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NuevoRegistro