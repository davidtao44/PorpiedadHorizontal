import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import EstadosCuenta from './pages/EstadosCuenta'
import NuevoRegistro from './pages/NuevoRegistro'
import RegistrarPago from './pages/RegistrarPago'
import TablaCompleta from './pages/TablaCompleta'
import TenantManagement from './pages/TenantManagement'
import ResidentProfile from './pages/ResidentProfile'
import RequestManagement from './pages/RequestManagement'
import ResidentManagement from './pages/ResidentManagement'
import UserManagement from './pages/UserManagement'
import RoleManagement from './pages/RoleManagement'
import TenantSelector from './pages/TenantSelector'
import VotingView from './pages/VotingView'
import AsambleaVotaciones from './pages/AsambleaVotaciones'
import RoleBasedRoute from './components/RoleBasedRoute'
import { USER_ROLES } from './constants/roleConstants'
import { Toaster } from 'react-hot-toast'

import SessionManager from './components/SessionManager'

function App() {
  return (
    <Router>
      <SessionManager>
        <Routes>
        {/* Ruta pública de login */}
        <Route path="/login" element={<Login />} />
        
        {/* Rutas protegidas */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="estados-cuenta" element={<EstadosCuenta />} />
          <Route path="nuevo-registro" element={<NuevoRegistro />} />
          <Route path="registrar-pago" element={<RegistrarPago />} />
          <Route path="tabla-completa" element={<TablaCompleta />} />
          <Route path="asamblea-votaciones" element={<AsambleaVotaciones />} />
          <Route path="mi-propiedad" element={<ResidentProfile />} />
          <Route path="votaciones" element={<VotingView />} />
          
          {/* Rutas de Administración */}
          <Route element={<RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.MASTER]} />}>
            <Route path="users" element={<UserManagement />} />
            <Route path="residents" element={<ResidentManagement />} />
            <Route path="solicitudes" element={<RequestManagement />} />
          </Route>
          
          <Route element={<RoleBasedRoute allowedRoles={[USER_ROLES.SUPER_ADMIN, USER_ROLES.MASTER]} />}>
            <Route path="roles" element={<RoleManagement />} />
            <Route path="tenants" element={<TenantManagement />} />
          </Route>
        </Route>
        <Route path="/select-tenant" element={<TenantSelector />} />
        </Routes>
      </SessionManager>
    </Router>
  )
}

export default App