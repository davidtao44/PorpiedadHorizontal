/**
 * Hook personalizado para autenticación y autorización basada en roles
 */
import { useState, useEffect, useCallback } from 'react'
import { authService } from '../services/api'
import { hasRole, hasAnyRole, hasPermission, hasAllPermissions, getRoleLevel, getHighestRole } from '../constants/roleConstants'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Cargar información del usuario desde localStorage
  const loadUser = useCallback(() => {
    try {
      const storedUser = authService.getStoredUser()
      if (storedUser) {
        setUser(storedUser)
        setRoles(storedUser.roles || [])
        setPermissions(storedUser.permissions || [])
        setIsAuthenticated(true)
      } else {
        setUser(null)
        setRoles([])
        setPermissions([])
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Error loading user:', error)
      setUser(null)
      setRoles([])
      setPermissions([])
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Cargar usuario al montar el componente
  useEffect(() => {
    loadUser()
  }, [loadUser])

  // Actualizar información del usuario
  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await authService.getCurrentUser()
      if (response.success) {
        const userData = response.data
        setUser(userData)
        setRoles(userData.roles || [])
        setPermissions(userData.permissions || [])
        setIsAuthenticated(true)
        
        // Actualizar localStorage
        localStorage.setItem('user', JSON.stringify(userData))
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
      // Si falla, limpiar autenticación
      setUser(null)
      setRoles([])
      setPermissions([])
      setIsAuthenticated(false)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Verificar si el usuario tiene un rol específico
  const checkRole = useCallback((role) => {
    return hasRole(roles, role)
  }, [roles])

  // Verificar si el usuario tiene alguno de los roles especificados
  const checkAnyRole = useCallback((requiredRoles) => {
    return hasAnyRole(roles, requiredRoles)
  }, [roles])

  // Verificar si el usuario tiene un permiso específico
  const checkPermission = useCallback((permission) => {
    return hasPermission(permissions, permission)
  }, [permissions])

  // Verificar si el usuario tiene todos los permisos especificados
  const checkAllPermissions = useCallback((requiredPermissions) => {
    return hasAllPermissions(permissions, requiredPermissions)
  }, [permissions])

  // Verificar si el usuario puede gestionar a otro usuario
  const canManageUser = useCallback((targetUser) => {
    if (!targetUser || !targetUser.roles) return false
    
    const myHighestLevel = getRoleLevel(getHighestRole(roles))
    const targetHighestLevel = getRoleLevel(getHighestRole(targetUser.roles))
    
    return myHighestLevel > targetHighestLevel
  }, [roles])

  // Obtener el nivel jerárquico más alto del usuario
  const getMyHighestLevel = useCallback(() => {
    return getRoleLevel(getHighestRole(roles))
  }, [roles])

  return {
    // Estado
    user,
    roles,
    permissions,
    isLoading,
    isAuthenticated,
    
    // Métodos
    refreshUser,
    hasRole: checkRole,
    hasAnyRole: checkAnyRole,
    hasPermission: checkPermission,
    hasAllPermissions: checkAllPermissions,
    canManageUser,
    getHighestLevel: getMyHighestLevel,
  }
}

export default useAuth
