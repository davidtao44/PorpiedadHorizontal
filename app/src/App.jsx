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
import VotingView from './pages/VotingView'
import AsambleaVotaciones from './pages/AsambleaVotaciones'
import DatosPersonales from './pages/DatosPersonales'
import VotacionesUsuario from './pages/VotacionesUsuario'
import MonitoreoVotaciones from './pages/MonitoreoVotaciones'
import AutoLoginPage from './pages/AutoLoginPage'
import PasswordChange from './pages/PasswordChange'

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta pública de login */}
        <Route path="/login" element={<Login />} />
        <Route path="/auto-login" element={<AutoLoginPage />} />

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
          <Route path="votacion" element={<VotingView />} />
          <Route path="asamblea-votaciones" element={<AsambleaVotaciones />} />

          {/* Rutas de Co-propietario */}
          <Route path="datos-personales" element={<DatosPersonales />} />
          <Route path="votaciones" element={<VotingView />} />
          <Route path="monitoreo" element={<MonitoreoVotaciones />} />
          <Route path="change-password" element={<PasswordChange />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App