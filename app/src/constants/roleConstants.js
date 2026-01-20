/**
 * Constantes de roles y permisos para el sistema RBAC
 */

// Roles del sistema
export const USER_ROLES = {
  MASTER: 'MASTER',
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  CONTADOR: 'CONTADOR',
  REVISOR_FISCAL: 'REVISOR_FISCAL',
  COPROPIETARIO: 'COPROPIETARIO',
  SEGURIDAD_VIGILANCIA: 'SEGURIDAD_VIGILANCIA',
  PROVEEDOR: 'PROVEEDOR',
}

// Nombres de display para roles (en español)
export const ROLE_DISPLAY_NAMES = {
  [USER_ROLES.MASTER]: 'Master del Sistema',
  [USER_ROLES.SUPER_ADMIN]: 'Super Administrador',
  [USER_ROLES.ADMIN]: 'Administrador',
  [USER_ROLES.CONTADOR]: 'Contador',
  [USER_ROLES.REVISOR_FISCAL]: 'Revisor Fiscal',
  [USER_ROLES.COPROPIETARIO]: 'Copropietario',
  [USER_ROLES.SEGURIDAD_VIGILANCIA]: 'Seguridad y Vigilancia',
  [USER_ROLES.PROVEEDOR]: 'Proveedor',
}

// Jerarquía de roles (mayor número = mayor autoridad)
export const ROLE_HIERARCHY = {
  [USER_ROLES.MASTER]: 100,
  [USER_ROLES.SUPER_ADMIN]: 80,
  [USER_ROLES.ADMIN]: 60,
  [USER_ROLES.CONTADOR]: 40,
  [USER_ROLES.REVISOR_FISCAL]: 35,
  [USER_ROLES.COPROPIETARIO]: 20,
  [USER_ROLES.SEGURIDAD_VIGILANCIA]: 15,
  [USER_ROLES.PROVEEDOR]: 10,
}

// Permisos del sistema
export const PERMISSIONS = {
  // Sistema
  SYSTEM_ADMIN: 'system:admin',
  SYSTEM_CONFIG: 'system:config',
  
  // Tenants (Conjuntos Residenciales)
  TENANT_CREATE: 'tenant:create',
  TENANT_READ: 'tenant:read',
  TENANT_UPDATE: 'tenant:update',
  TENANT_DELETE: 'tenant:delete',
  TENANT_MANAGE_ALL: 'tenant:manage_all',
  
  // Usuarios
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_MANAGE_ROLES: 'user:manage_roles',
  USER_READ_ALL_TENANTS: 'user:read_all_tenants',
  
  // Propiedades
  PROPERTY_CREATE: 'property:create',
  PROPERTY_READ: 'property:read',
  PROPERTY_UPDATE: 'property:update',
  PROPERTY_DELETE: 'property:delete',
  
  // Residentes
  RESIDENT_CREATE: 'resident:create',
  RESIDENT_READ: 'resident:read',
  RESIDENT_UPDATE: 'resident:update',
  RESIDENT_DELETE: 'resident:delete',
  
  // Facturación
  BILLING_CREATE: 'billing:create',
  BILLING_READ: 'billing:read',
  BILLING_UPDATE: 'billing:update',
  BILLING_DELETE: 'billing:delete',
  BILLING_CALCULATE: 'billing:calculate',
  BILLING_READ_OWN: 'billing:read_own',
  
  // Pagos
  PAYMENT_CREATE: 'payment:create',
  PAYMENT_READ: 'payment:read',
  PAYMENT_UPDATE: 'payment:update',
  PAYMENT_DELETE: 'payment:delete',
  PAYMENT_READ_OWN: 'payment:read_own',
  
  // Reportes
  REPORT_FINANCIAL: 'report:financial',
  REPORT_ACCOUNTING: 'report:accounting',
  REPORT_AUDIT: 'report:audit',
  REPORT_BASIC: 'report:basic',
  
  // Asambleas y Votaciones
  ASSEMBLY_CREATE: 'assembly:create',
  ASSEMBLY_READ: 'assembly:read',
  ASSEMBLY_UPDATE: 'assembly:update',
  ASSEMBLY_DELETE: 'assembly:delete',
  ASSEMBLY_VOTE: 'assembly:vote',
  
  // Seguridad
  SECURITY_READ_LOGS: 'security:read_logs',
  SECURITY_MANAGE_ACCESS: 'security:manage_access',
}

/**
 * Obtener el nivel jerárquico de un rol
 * @param {string} role - Rol a consultar
 * @returns {number} Nivel del rol (0 si no existe)
 */
export const getRoleLevel = (role) => {
  return ROLE_HIERARCHY[role] || 0
}

/**
 * Verificar si un rol puede gestionar otro rol
 * @param {string} managerRole - Rol del gestor
 * @param {string} targetRole - Rol objetivo
 * @returns {boolean} True si puede gestionar
 */
export const canManageRole = (managerRole, targetRole) => {
  return getRoleLevel(managerRole) > getRoleLevel(targetRole)
}

/**
 * Verificar si un usuario tiene un rol específico
 * @param {Array<string>} userRoles - Roles del usuario
 * @param {string} requiredRole - Rol requerido
 * @returns {boolean} True si tiene el rol
 */
export const hasRole = (userRoles, requiredRole) => {
  if (!userRoles || !Array.isArray(userRoles)) return false
  return userRoles.includes(requiredRole)
}

/**
 * Verificar si un usuario tiene alguno de los roles especificados
 * @param {Array<string>} userRoles - Roles del usuario
 * @param {Array<string>} requiredRoles - Roles requeridos (al menos uno)
 * @returns {boolean} True si tiene al menos uno de los roles
 */
export const hasAnyRole = (userRoles, requiredRoles) => {
  if (!userRoles || !Array.isArray(userRoles)) return false
  if (!requiredRoles || !Array.isArray(requiredRoles)) return false
  return requiredRoles.some(role => userRoles.includes(role))
}

/**
 * Verificar si un usuario tiene un permiso específico
 * @param {Array<string>} userPermissions - Permisos del usuario
 * @param {string} requiredPermission - Permiso requerido
 * @returns {boolean} True si tiene el permiso
 */
export const hasPermission = (userPermissions, requiredPermission) => {
  if (!userPermissions || !Array.isArray(userPermissions)) return false
  return userPermissions.includes(requiredPermission)
}

/**
 * Verificar si un usuario tiene todos los permisos especificados
 * @param {Array<string>} userPermissions - Permisos del usuario
 * @param {Array<string>} requiredPermissions - Permisos requeridos (todos)
 * @returns {boolean} True si tiene todos los permisos
 */
export const hasAllPermissions = (userPermissions, requiredPermissions) => {
  if (!userPermissions || !Array.isArray(userPermissions)) return false
  if (!requiredPermissions || !Array.isArray(requiredPermissions)) return false
  return requiredPermissions.every(perm => userPermissions.includes(perm))
}

/**
 * Obtener el rol de mayor jerarquía de un usuario
 * @param {Array<string>} userRoles - Roles del usuario
 * @returns {string|null} Rol de mayor jerarquía o null
 */
export const getHighestRole = (userRoles) => {
  if (!userRoles || !Array.isArray(userRoles) || userRoles.length === 0) return null
  
  return userRoles.reduce((highest, current) => {
    return getRoleLevel(current) > getRoleLevel(highest) ? current : highest
  }, userRoles[0])
}
