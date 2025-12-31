import React, { useState } from 'react'
import {
  Vote,
  FileSignature,
  Settings,
  Activity,
  UserCheck,
  Copy
} from 'lucide-react'
import VotesChart from '../components/charts/VotesChart'
import AttendanceChart from '../components/charts/AttendanceChart'
import ExportButton from '../components/ExportButton'

const AsambleaVotaciones = () => {
  const [activeTab, setActiveTab] = useState('votaciones')
  const [modalidad, setModalidad] = useState('presencial')
  const zoomLink = 'https://zoom.us/j/1234567890?pwd=example'

  const handleCopyZoomLink = () => {
    navigator.clipboard.writeText(zoomLink)
    alert('Link de Zoom copiado al portapapeles')
  }

  const tabs = [
    { id: 'votaciones', label: 'Votaciones', icon: Vote },
    { id: 'poderes', label: 'Poderes', icon: FileSignature },
    { id: 'parametrizacion', label: 'Parametrización', icon: Settings },
    { id: 'tiempo-real', label: 'Tiempo Real', icon: Activity },
    { id: 'asistencia', label: 'Asistencia', icon: UserCheck },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'votaciones':
        return (
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Panel de Votaciones</h3>
            <p className="text-gray-500 mb-4">Gestión y visualización de votaciones activas.</p>
            <VotesChart />
          </div>
        )
      case 'poderes':
        return (
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Gestión de Poderes</h3>
            <p className="text-gray-500">Administración de poderes y representaciones para la asamblea.</p>
          </div>
        )
      case 'parametrizacion':
        return (
          <div className="space-y-6">
            {/* Tipo de Voto */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Tipo de Voto</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="tipoVoto"
                    value="nominal"
                    className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                    defaultChecked
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">Voto Nominal</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="tipoVoto"
                    value="coeficiente"
                    className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">Voto por Coeficiente</span>
                </label>
              </div>
            </div>

            {/* Seleccionar Quorum */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Seleccionar Quorum</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Número de personas (mínimo)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Número de poderes (máximo)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Umbral (mínimo)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    % Abstinencia
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      className="block w-full rounded-md border-gray-300 pr-8 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="0.00"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Número de copropietarios
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Número máximo de personas enroladas
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Pantalla Checklist */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Pantalla Checklist</h3>

              {/* Configuración de horarios y modalidad */}
              <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Hora de ingreso
                  </label>
                  <input
                    type="time"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Hora de salida
                  </label>
                  <input
                    type="time"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tiempo de asamblea
                  </label>
                  <input
                    type="text"
                    readOnly
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm"
                    placeholder="Calculado automáticamente"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Modalidad
                  </label>
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="modalidad"
                        value="virtual"
                        checked={modalidad === 'virtual'}
                        onChange={(e) => setModalidad(e.target.value)}
                        className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Virtual</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="modalidad"
                        value="presencial"
                        checked={modalidad === 'presencial'}
                        onChange={(e) => setModalidad(e.target.value)}
                        className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Presencial</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Segunda fila con tiempo restante */}
              <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tiempo restante para votar
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="00:00:00"
                  />
                </div>
              </div>

              {/* Link de Zoom (solo para virtual) */}
              {modalidad === 'virtual' && (
                <div className="mb-6 rounded-md bg-blue-50 p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link de Zoom de la Asamblea
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={zoomLink}
                      className="block w-full rounded-md border-gray-300 bg-white shadow-sm sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleCopyZoomLink}
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      title="Copiar link"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Formulario de registro de asistente */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="mb-4 text-sm font-semibold text-gray-900">Registrar Asistente</h4>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nombre
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="Nombre completo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Cédula
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="Número de cédula"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Celular
                    </label>
                    <input
                      type="tel"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="Número de celular"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Torre
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="Torre"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Apartamento
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="Número de apartamento"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Etapa
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="Etapa"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Coeficiente
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="0.0000"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    Registrar Asistente
                  </button>
                </div>
              </div>
            </div>

            {/* Crear Logísticos */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Crear Logísticos</h3>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="Nombre del logístico"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Cédula
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="Número de cédula"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="Número de teléfono"
                  />
                </div>
              </div>

              {/* Checklist de permisos */}
              <div className="mt-6">
                <h4 className="mb-3 text-sm font-semibold text-gray-900">Checklist de Permisos</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">Gestionar asistencia</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">Registrar votaciones</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">Administrar poderes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">Ver reportes en tiempo real</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">Modificar configuración</span>
                  </label>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Crear Logístico
                </button>
              </div>
            </div>

            {/* Botón de guardar configuración */}
            <div className="flex justify-end">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        )
      case 'tiempo-real':
        return (
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex md:flex-row flex-col md:items-center justify-between mb-4 gap-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Monitor en Tiempo Real</h3>
                <p className="text-gray-500">Visualización de resultados y quorum en tiempo real.</p>
              </div>
              <div>
                <ExportButton />
              </div>
            </div>
            <AttendanceChart />
          </div>
        )
      case 'asistencia':
        return (
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Control de Asistencia</h3>
            <p className="text-gray-500">Registro y verificación de asistencia de los asambleístas.</p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Asamblea y Votaciones
          </h2>
        </div>
      </div>

      <div className="border-b border-gray-200 bg-white px-4 sm:px-6">
        <div className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }
                `}
              >
                <Icon
                  className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${activeTab === tab.id
                      ? 'text-primary-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                    }
                  `}
                />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-6">
        {renderContent()}
      </div>
    </div>
  )
}

export default AsambleaVotaciones
