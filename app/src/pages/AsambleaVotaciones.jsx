import React, { useState } from 'react'
import {
  Vote,
  FileSignature,
  Settings,
  Activity,
  UserCheck,
  Copy,
  Upload,
  Trash2,
  Edit,
  Plus,
  X,
  Save,
  FileSpreadsheet
} from 'lucide-react'
import VotesChart from '../components/charts/VotesChart'
import AttendanceChart from '../components/charts/AttendanceChart'
import ExportButton from '../components/ExportButton'

const AsistenciaTab = () => {
  const [role, setRole] = useState('admin') // 'admin' = Role 1, 'uploader' = Role 2
  const [data, setData] = useState([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const fileInputRef = React.useRef(null)

  const initialForm = {
    nombre: '',
    nit: '',
    direccion: '',
    telefono: '',
    email: '',
    tipo: 'Residencial',
    cantidadUnidades: '',
    descripcionUnidades: ''
  }
  const [form, setForm] = useState(initialForm)

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.name.endsWith('.csv')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target.result
        const lines = text.split('\n').filter(line => line.trim() !== '')
        // Assume header is line 0, skip it
        const newEntries = lines.slice(1).map(line => {
          const cols = line.split(',')
          return {
            nombre: cols[0] || '',
            nit: cols[1] || '',
            direccion: cols[2] || '',
            telefono: cols[3] || '',
            email: cols[4] || '',
            tipo: cols[5] || 'Residencial',
            cantidadUnidades: cols[6] || '0',
            descripcionUnidades: cols[7] || ''
          }
        })
        setData(prev => [...prev, ...newEntries])
      }
      reader.readAsText(file)
    } else {
      alert('Por favor sube un archivo .csv (El soporte para XLSX requiere librería externa)')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingIndex !== null) {
      // Edit
      const newData = [...data]
      newData[editingIndex] = form
      setData(newData)
    } else {
      // Add
      setData([...data, form])
    }
    setForm(initialForm)
    setIsFormOpen(false)
    setEditingIndex(null)
  }

  const startEdit = (index) => {
    setEditingIndex(index)
    setForm(data[index])
    setIsFormOpen(true)
  }

  const deleteItem = (index) => {
    if (confirm('¿Estás seguro de eliminar este registro?')) {
      const newData = data.filter((_, i) => i !== index)
      setData(newData)
    }
  }

  return (
    <div className="space-y-6">
      {/* Role Switcher & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-lg shadow">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Control de Asistencia</h3>
          <p className="text-sm text-gray-500">Gestión de copropiedades y asistentes</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
           <button 
             onClick={() => setRole('admin')}
             className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${role === 'admin' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
           >
             Rol 1: Admin
           </button>
           <button 
             onClick={() => setRole('uploader')}
             className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${role === 'uploader' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
           >
             Rol 2: Carga/Solo Lectura
           </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button 
          onClick={() => {
            setForm(initialForm)
            setEditingIndex(null)
            setIsFormOpen(true)
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Registro
        </button>
        
        <div className="relative">
          <input 
            type="file" 
            ref={fileInputRef}
            accept=".csv,.xlsx" 
            className="hidden" 
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Upload className="h-4 w-4 mr-2" />
            Cargar CSV/XLSX
          </button>
        </div>
        
        <button 
            onClick={() => {
                const csvContent = "data:text/csv;charset=utf-8," 
                    + "Nombre,NIT,Direccion,Telefono,Email,Tipo,CantidadUnidades,DescripcionUnidades\n"
                    + "Edificio A,900123456,Calle 123,5551234,admin@edificioa.com,Residencial,10,Apartamentos";
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", "plantilla_asistencia.csv");
                document.body.appendChild(link);
                link.click();
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Descargar Plantilla
        </button>
      </div>

      {/* Form Modal/Panel */}
      {isFormOpen && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              {editingIndex !== null ? 'Editar Registro' : 'Nuevo Registro'}
            </h4>
            <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-medium text-gray-700">Nombre del Copropietario</label>
              <input 
                required
                type="text" 
                placeholder="Ej: Juan Pérez / Inversiones SAS"
                value={form.nombre}
                onChange={e => setForm({...form, nombre: e.target.value})}
                disabled={role === 'uploader' && editingIndex !== null} // Role 2 cannot edit existing
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700">NIT / Identificación</label>
              <input 
                required
                type="text" 
                placeholder="Ej: 900123456-1"
                value={form.nit}
                onChange={e => setForm({...form, nit: e.target.value})}
                disabled={role === 'uploader' && editingIndex !== null}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700">Dirección</label>
              <input 
                type="text" 
                placeholder="Ej: Carrera 15 # 80-20"
                value={form.direccion}
                onChange={e => setForm({...form, direccion: e.target.value})}
                disabled={role === 'uploader' && editingIndex !== null}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700">Teléfono</label>
              <input 
                type="tel" 
                placeholder="Ej: 300 123 4567"
                value={form.telefono}
                onChange={e => setForm({...form, telefono: e.target.value})}
                disabled={role === 'uploader' && editingIndex !== null}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700">Correo</label>
              <input 
                type="email" 
                placeholder="Ej: contacto@ejemplo.com"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                disabled={role === 'uploader' && editingIndex !== null}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700">Tipo</label>
              <select 
                value={form.tipo}
                onChange={e => setForm({...form, tipo: e.target.value})}
                disabled={role === 'uploader' && editingIndex !== null}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option>Residencial</option>
                <option>Comercial</option>
                <option>Mixta</option>
                <option>Turística</option>
                <option>Otra</option>
              </select>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700">Cantidad Unidades</label>
              <input 
                type="number" 
                placeholder="Ej: 1"
                value={form.cantidadUnidades}
                onChange={e => setForm({...form, cantidadUnidades: e.target.value})}
                disabled={role === 'uploader' && editingIndex !== null}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-base font-medium text-gray-700">Descripción de Unidades</label>
              <textarea 
                value={form.descripcionUnidades}
                onChange={e => setForm({...form, descripcionUnidades: e.target.value})}
                disabled={role === 'uploader' && editingIndex !== null}
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Ej: Apartamentos, Casas, Locales..."
              />
            </div>
            
            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
              <button 
                type="button" 
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              {/* Role 2 cannot save edits to existing items, but can save new ones */}
              {!(role === 'uploader' && editingIndex !== null) && (
                <button 
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Save className="h-4 w-4 mr-2 inline" />
                  Guardar
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Copropiedad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidades</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No hay registros. Carga un CSV o agrega uno manualmente.
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.nit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.tipo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.cantidadUnidades} <span className="text-xs text-gray-400">({item.descripcionUnidades})</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{item.email}</div>
                      <div className="text-xs">{item.telefono}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {/* Edit Button: Visible to all, but behaves differently */}
                        <button 
                          onClick={() => startEdit(index)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Ver / Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        
                        {/* Delete Button: Only for Admin */}
                        {role === 'admin' && (
                          <button 
                            onClick={() => deleteItem(index)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


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
        return <AsistenciaTab />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Sticky Header with Title and Tabs */}
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        {/* Title Section */}
        <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                Asamblea y Votaciones
              </h2>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 px-4 sm:px-6">
          <div className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium whitespace-nowrap
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
      </div>

      <div className="mt-6">
        {renderContent()}
      </div>
    </div>
  )
}

export default AsambleaVotaciones
