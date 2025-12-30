import React, { useState } from 'react'
import { Save, X } from 'lucide-react'

const FormularioManual = ({ isOpen, onClose, onSave, selectedYear, selectedMonth, initialData = {} }) => {
  const [formData, setFormData] = useState({
    // Campos manuales de deuda
    deuda_anterior_capital_manual: initialData.deuda_anterior_capital_manual || '',
    cuota_admon_manual: initialData.cuota_admon_manual || '',
    otros_conceptos_manual: initialData.otros_conceptos_manual || '',
    
    // Campos manuales de pagos
    capital_pago_manual: initialData.capital_pago_manual || '',
    intereses_pago_manual: initialData.intereses_pago_manual || '',
    cuota_admon_pago_manual: initialData.cuota_admon_pago_manual || '',
    otros_conceptos_pago_manual: initialData.otros_conceptos_pago_manual || '',
    sanciones_pago_manual: initialData.sanciones_pago_manual || '',
    fecha_pago_manual: initialData.fecha_pago_manual || '',
    
    // Campos adicionales
    observaciones_manual: initialData.observaciones_manual || '',
    control_manual: initialData.control_manual || '',
    auditoria_manual: initialData.auditoria_manual || ''
  })

  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Mapear los campos del formulario a los campos esperados por el backend
      const dataToSend = {
        usuario_id: 1, // ID fijo por ahora
        año: selectedYear,
        mes: selectedMonth,
        cuota_admon: parseFloat(formData.cuota_admon_manual) || 0,
        retroactivo: parseFloat(formData.deuda_anterior_capital_manual) || 0,
        parqueaderos_manual: parseFloat(formData.otros_conceptos_manual) || 0,
        sanciones_manual: parseFloat(formData.sanciones_pago_manual) || 0,
        zonas_comunes_manual: 0,
        cuota_extraordinaria_manual: 0,
        otros_manual: parseFloat(formData.otros_conceptos_pago_manual) || 0,
        interes_mes: 0.02, // 2% por defecto
        fecha_pago: formData.fecha_pago_manual || null
      }

      await onSave(dataToSend)
      onClose()
    } catch (error) {
      console.error('Error al guardar:', error)
      alert('Error al guardar los datos')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Ingresar Datos Manuales - {selectedMonth} {selectedYear}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sección de Deuda */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Datos de Deuda (Columnas Rojas)
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deuda Anterior Capital
                </label>
                <input
                  type="number"
                  name="deuda_anterior_capital_manual"
                  value={formData.deuda_anterior_capital_manual}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cuota Administración
                </label>
                <input
                  type="number"
                  name="cuota_admon_manual"
                  value={formData.cuota_admon_manual}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Otros Conceptos
                </label>
                <input
                  type="number"
                  name="otros_conceptos_manual"
                  value={formData.otros_conceptos_manual}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Sección de Pagos */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Datos de Pagos (Columnas Rojas)
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capital Pago
                </label>
                <input
                  type="number"
                  name="capital_pago_manual"
                  value={formData.capital_pago_manual}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Intereses Pago
                </label>
                <input
                  type="number"
                  name="intereses_pago_manual"
                  value={formData.intereses_pago_manual}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cuota Administración Pago
                </label>
                <input
                  type="number"
                  name="cuota_admon_pago_manual"
                  value={formData.cuota_admon_pago_manual}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Otros Conceptos Pago
                </label>
                <input
                  type="number"
                  name="otros_conceptos_pago_manual"
                  value={formData.otros_conceptos_pago_manual}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sanciones Pago
                </label>
                <input
                  type="number"
                  name="sanciones_pago_manual"
                  value={formData.sanciones_pago_manual}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Pago
                </label>
                <input
                  type="date"
                  name="fecha_pago_manual"
                  value={formData.fecha_pago_manual}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Campos adicionales */}
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
              Información Adicional
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  name="observaciones_manual"
                  value={formData.observaciones_manual}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Observaciones adicionales..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Control
                </label>
                <input
                  type="text"
                  name="control_manual"
                  value={formData.control_manual}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Control"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Auditoría
                </label>
                <input
                  type="text"
                  name="auditoria_manual"
                  value={formData.auditoria_manual}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Auditoría"
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FormularioManual