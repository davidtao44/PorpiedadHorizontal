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

function App() {
  return (
    <Router>
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
        </Route>
      </Routes>
    </Router>
  )
}

export default App