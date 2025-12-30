import React, { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { RefreshCw, Calculator } from 'lucide-react'
import { billingService } from '../services/api'

const RecalculateButton = ({ 
  billingId, 
  propertyId, 
  year, 
  month, 
  onSuccess, 
  onError,
  variant = 'primary',
  size = 'sm',
  showText = true 
}) => {
  const [isRecalculating, setIsRecalculating] = useState(false)
  const queryClient = useQueryClient()

  // Mutation para recálculo dinámico
  const recalculateMutation = useMutation(
    async () => {
      setIsRecalculating(true)
      
      // Si tenemos billingId, usar el endpoint específico
      if (billingId) {
        return await billingService.recalculate(billingId)
      }
      
      // Si no, usar el endpoint de recálculo por propiedad y período
      if (propertyId && year && month) {
        const billing = await billingService.getByPropertyAndPeriod(propertyId, year, month)
        if (billing?.data?.id) {
          return await billingService.recalculate(billing.data.id)
        }
      }
      
      throw new Error('No se pudo identificar el registro para recalcular')
    },
    {
      onSuccess: (data) => {
        setIsRecalculating(false)
        
        // Invalidar queries relacionadas para refrescar los datos
        queryClient.invalidateQueries(['estados-cuenta'])
        queryClient.invalidateQueries(['billing'])
        
        if (onSuccess) {
          onSuccess(data)
        } else {
          // Mostrar mensaje de éxito por defecto
          alert('Recálculo completado exitosamente')
        }
      },
      onError: (error) => {
        setIsRecalculating(false)
        
        if (onError) {
          onError(error)
        } else {
          // Mostrar mensaje de error por defecto
          console.error('Error en recálculo:', error)
          alert('Error al recalcular: ' + (error.response?.data?.message || error.message))
        }
      }
    }
  )

  const handleRecalculate = () => {
    if (isRecalculating) return
    
    const confirmMessage = billingId 
      ? '¿Deseas recalcular este registro con las fórmulas dinámicas del Excel?'
      : `¿Deseas recalcular el período ${month}/${year} con las fórmulas dinámicas del Excel?`
    
    if (window.confirm(confirmMessage)) {
      recalculateMutation.mutate()
    }
  }

  const buttonClasses = `
    btn btn-${variant} btn-${size} 
    ${isRecalculating ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
    transition-all duration-200
  `.trim()

  return (
    <button
      onClick={handleRecalculate}
      disabled={isRecalculating || recalculateMutation.isLoading}
      className={buttonClasses}
      title="Recalcular con fórmulas dinámicas del Excel"
    >
      {isRecalculating ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <Calculator className="h-4 w-4" />
      )}
      {showText && (
        <span className="ml-2">
          {isRecalculating ? 'Recalculando...' : 'Recalcular'}
        </span>
      )}
    </button>
  )
}

export default RecalculateButton