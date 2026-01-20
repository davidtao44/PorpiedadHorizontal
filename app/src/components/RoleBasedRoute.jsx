import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/**
 * Componente para proteger rutas basadas en roles y permisos
 * 
 * @param {Object} props
 * @param {Array<string>} props.allowedRoles - Roles permitidos para acceder (uno de ellos es suficiente)
 * @param {Array<string>} props.requiredPermissions - Permisos requeridos (debe tener TODOS)
 * @param {string} props.redirectPath - Ruta de redirección si no tiene acceso
 * @returns {JSX.Element}
 */
const RoleBasedRoute = ({ 
  allowedRoles = [], 
  requiredPermissions = [], 
  redirectPath = '/unauthorized' 
}) => {
  const { 
    isAuthenticated, 
    isLoading, 
    hasAnyRole, 
    hasAllPermissions 
  } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirigir al login guardando la ubicación intentada
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Verificar roles (si se especifican)
  if (allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) {
    return <Navigate to={redirectPath} replace />
  }

  // Verificar permisos (si se especifican)
  if (requiredPermissions.length > 0 && !hasAllPermissions(requiredPermissions)) {
    return <Navigate to={redirectPath} replace />
  }

  // Si pasa todas las verificaciones, renderizar contenido
  return <Outlet />
}

export default RoleBasedRoute
