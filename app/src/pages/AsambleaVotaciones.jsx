import React, { useState } from 'react'
import { 
  Vote, 
  FileSignature, 
  Settings, 
  Activity, 
  UserCheck 
} from 'lucide-react'

const AsambleaVotaciones = () => {
  const [activeTab, setActiveTab] = useState('votaciones')

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
            <p className="text-gray-500">Gestión y visualización de votaciones activas e históricas.</p>
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
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Parametrización</h3>
            <p className="text-gray-500">Configuración de parámetros para la asamblea y votaciones.</p>
          </div>
        )
      case 'tiempo-real':
        return (
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Monitor en Tiempo Real</h3>
            <p className="text-gray-500">Visualización de resultados y quorum en tiempo real.</p>
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
                  ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }
                `}
              >
                <Icon
                  className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${
                      activeTab === tab.id
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
