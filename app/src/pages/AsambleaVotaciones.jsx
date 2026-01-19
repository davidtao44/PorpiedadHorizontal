import React, { useState } from 'react'
import * as XLSX from 'xlsx' 
import { 
  Vote, 
  FileSignature, 
  Settings, 
  Activity, 
  UserCheck,
  Copy,
  Send,        
  UploadCloud, 
  Eye,         
  Edit2,       
  Trash2,      
  Save,        
  X,           
  Download     
} from 'lucide-react'

const AsambleaVotaciones = () => {
  const [activeTab, setActiveTab] = useState('votaciones')
  const [modalidad, setModalidad] = useState('presencial')
  const zoomLink = 'https://zoom.us/j/1234567890?pwd=example'
  const [aplicaEtapa, setAplicaEtapa] = useState('no')
  const [etapa, setEtapa] = useState('')

  const [datosMasivos, setDatosMasivos] = useState([])
  const [loading, setLoading] = useState(false)
  
  const [editIdx, setEditIdx] = useState(-1)
  const [editData, setEditData] = useState({})
  
  const [nuevoRegistro, setNuevoRegistro] = useState({
    primer_nombre: '', segundo_nombre: '', primer_apellido: '', segundo_apellido: '',
    cedula: '', torre: '', apartamento: '', unidad: '', correo: ''
  })

  const [previewData, setPreviewData] = useState(null)

  const configSistema = {
    nombreSistema: "VOTACIONES PH 360",
    urlPlataforma: "www.votacionesph.com/acceso",
    telefonoSoporte: "(601) 555-0199",
    correoSoporte: "soporte@votacionesph.com",
    nombreAdministrador: "Carlos Gerente",
    conjunto: "Conjunto Residencial Los Álamos"
  }

  const handleCopyZoomLink = () => {
    navigator.clipboard.writeText(zoomLink)
    alert('Link de Zoom copiado al portapapeles')
  }


  const handleEjecutarEnvioMasivo = async () => {
    setLoading(true)
    try {
      // 👇👇 AQUÍ INGRESAS TU RUTA O LINK DEL JSON 👇👇
      const endpoint = 'https://tu-api.com/api/v1/propietarios/cartas'; 
      // 2. Realizamos la petición
      // const response = await fetch(endpoint, ...);
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockData = [
        { primer_nombre: "Juan", segundo_nombre: "David", primer_apellido: "Pérez", segundo_apellido: "López", cedula: "10203040", torre: "1", apartamento: "101", unidad: "Residencial A", correo: "juan@test.com" },
        { primer_nombre: "Maria", segundo_nombre: "", primer_apellido: "Gómez", segundo_apellido: "", cedula: "50607080", torre: "2", apartamento: "405", unidad: "Residencial A", correo: "maria@test.com" }
      ];
      setDatosMasivos(mockData);
      
      if(mockData.length > 0) {
        setPreviewData(mockData[0]); 
      }
      alert(`Datos cargados: ${mockData.length} registros.`);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  const startEdit = (index, item) => { setEditIdx(index); setEditData({ ...item }) }
  const cancelEdit = () => { setEditIdx(-1); setEditData({}) }
  const saveEdit = (index) => {
    const updated = [...datosMasivos]; updated[index] = editData; setDatosMasivos(updated); setEditIdx(-1)
  }
  const handleEditChange = (e) => { setEditData(prev => ({ ...prev, [e.target.name]: e.target.value })) }
  const deleteRow = (index) => { if(window.confirm('¿Eliminar?')) setDatosMasivos(datosMasivos.filter((_, i) => i !== index)) }
  
  const handleManualChange = (e) => { setNuevoRegistro(prev => ({ ...prev, [e.target.name]: e.target.value })) }
  
  const agregarRegistroManual = (e) => {
    e.preventDefault(); 
    if (!nuevoRegistro.primer_nombre || !nuevoRegistro.cedula) return alert("Faltan datos");
    setDatosMasivos([...datosMasivos, nuevoRegistro]);
    setNuevoRegistro({ primer_nombre: '', segundo_nombre: '', primer_apellido: '', segundo_apellido: '', cedula: '', torre: '', apartamento: '', unidad: '', correo: '' });
  }

  const handleExcelUpload = (e) => {
    const file = e.target.files[0]; 
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(ws, { defval: "" });
        
        const normalize = (str) => str ? str.toString().toLowerCase().replace(/[\s_-]/g, '') : '';

        const findValue = (row, ...posiblesNombres) => {
          const rowKeys = Object.keys(row);
          for (let nombre of posiblesNombres) {
            const keyEncontrada = rowKeys.find(k => normalize(k) === normalize(nombre));
            if (keyEncontrada) return row[keyEncontrada];
          }
          return '';
        };

        const formatted = jsonData.map(row => ({
          primer_nombre: findValue(row, 'primer_nombre', 'primer nombre', 'nombre1', 'nombre'),
          segundo_nombre: findValue(row, 'segundo_nombre', 'segundo nombre', 'nombre2'),
          primer_apellido: findValue(row, 'primer_apellido', 'primer apellido', 'apellido1', 'apellido'),
          segundo_apellido: findValue(row, 'segundo_apellido', 'segundo apellido', 'apellido2'),
          cedula: findValue(row, 'cedula', 'documento', 'identificacion', 'id'),
          torre: findValue(row, 'torre', 'bloque'),
          apartamento: findValue(row, 'apartamento', 'apto', 'numero', 'interior'),
          unidad: findValue(row, 'unidad', 'conjunto'),
          correo: findValue(row, 'correo', 'email', 'e-mail', 'mail')
        }));
        
        const validRows = formatted.filter(r => r.primer_nombre || r.cedula);

        if (validRows.length === 0) {
          alert('No se encontraron datos válidos. Verifica los encabezados de tu Excel.');
          return;
        }

        setDatosMasivos([...datosMasivos, ...validRows]);
        if(validRows.length > 0) setPreviewData(validRows[0]); 
        alert(`Se cargaron ${validRows.length} registros exitosamente.`);

      } catch (error) { 
        console.error(error);
        alert('Error leyendo el archivo Excel. Asegúrate de que no esté corrupto.'); 
      }
    };
    reader.readAsArrayBuffer(file);
  }

  const handleDownloadTemplate = () => {
    const headers = [
      {
        primer_nombre: "Juan",
        segundo_nombre: "Carlos",
        primer_apellido: "Perez",
        segundo_apellido: "Diaz",
        cedula: "123456789",
        torre: "Torre 1",
        apartamento: "101",
        unidad: "Conjunto Residencial",
        correo: "ejemplo@correo.com"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Formato Masivo");
    
    const wscols = [
      {wch:15}, {wch:15}, {wch:15}, {wch:15}, {wch:15}, {wch:10}, {wch:10}, {wch:20}, {wch:25}
    ];
    ws['!cols'] = wscols;

    XLSX.writeFile(wb, "Formato Masivo.xlsx");
  }

  const handleConfirmarEnvio = () => { if (window.confirm(`¿Enviar a ${datosMasivos.length} destinatarios?`)) alert(`Enviando...`); }

  const renderCartaModal = () => {
    if (!previewData) return null;

    const fechaActual = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    const nombreCompleto = `${previewData.primer_nombre} ${previewData.segundo_nombre || ''} ${previewData.primer_apellido} ${previewData.segundo_apellido || ''}`.trim();
    const cedula = previewData.cedula;
    const unidad = previewData.unidad || configSistema.conjunto;
    const torre = previewData.torre || configSistema.torre;
    const apartamento = previewData.apartamento || configSistema.apartamento;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl h-[85vh] flex flex-col">
          {/* Header Modal */}
          <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600"/> Vista Previa de la Carta
            </h3>
            <button onClick={() => setPreviewData(null)} className="text-gray-500 hover:text-red-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Body Modal */}
          <div className="flex-1 overflow-y-auto p-8 font-serif text-gray-800 leading-relaxed">
            <p className="mb-8">Ciudad, {fechaActual}</p>
            <p className="mb-1">Señor(a)</p>
            <p className="font-bold mb-1 uppercase">{nombreCompleto}</p>
            <p className="mb-1">Cédula: {cedula}</p>
            <p className="mb-8">Copropietario(a) Torre {torre} Apartamento {apartamento} Conjunto {unidad}</p>
            <p className="mb-4">Cordial saludo,</p>
            <p className="mb-4 text-justify">
              Por medio de la presente nos permitimos informarle que se le ha otorgado el acceso al sistema tecnológico <strong>{configSistema.nombreSistema}</strong>, el cual tiene como finalidad optimizar la gestión administrativa y mejorar la comunicación a través de la plataforma.
            </p>
            <p className="mb-4">
              A continuación, encontrará las credenciales correspondientes para ingresar al sistema:
            </p>
            <div className="bg-gray-100 p-4 rounded-md border border-gray-200 mb-6 font-mono text-sm mx-auto max-w-md">
              <p><strong>Usuario:</strong> {previewData.cedula}</p>
              <p><strong>Contraseña:</strong> {previewData.cedula} <span className="text-gray-400 text-xs">(Genérica)</span></p>
            </div>
            <p className="mb-2">Asimismo, el enlace de acceso a la plataforma es el siguiente:</p>
            <p className="mb-8 text-blue-600 underline">
              <a href={`https://${configSistema.urlPlataforma}`} target="_blank" rel="noreferrer">{configSistema.urlPlataforma}</a>
            </p>
            <p className="mb-8 text-justify">
              Agradecemos su atención y quedamos atentos a cualquier inquietud o requerimiento adicional. Para comunicarse con el área de atención y soporte del sistema, podrá hacerlo a través de los siguientes canales:
            </p>
            <ul className="list-none mb-12 pl-0">
              <li><strong>Teléfono:</strong> {configSistema.telefonoSoporte}</li>
              <li><strong>Correo electrónico:</strong> {configSistema.correoSoporte}</li>
            </ul>
            <p className="mb-1">Atentamente,</p>
            <div className="mt-8 mb-1 border-t border-black w-64 pt-2"></div>
            <p className="font-bold">{configSistema.nombreAdministrador}</p>
            <p>Administrador(a) {unidad}</p>
          </div>

          {/* Footer Modal */}
          <div className="p-4 border-t bg-gray-50 rounded-b-lg flex justify-end">
             <button onClick={() => setPreviewData(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
               Cerrar Vista Previa
             </button>
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'votaciones', label: 'Votaciones', icon: Vote },
    { id: 'poderes', label: 'Poderes', icon: FileSignature },
    { id: 'parametrizacion', label: 'Parametrización', icon: Settings },
    { id: 'tiempo-real', label: 'Tiempo Real', icon: Activity },
    { id: 'asistencia', label: 'Asistencia', icon: UserCheck },
    { id: 'envio-masivo', label: 'Envío Masivo', icon: Send },
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
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Gestión de Poderes
            </h3>

            <form className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Quien lo cargó */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cargado por
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
                  placeholder="Juanito Perez"
                />
              </div>

              {/* Tipo documento */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tipo de documento
                </label>
                <select className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm">
                  <option value="">Seleccione</option>
                  <option>CC(Cédula de Ciudadanía)</option>
                  <option>CE(Cédula de Extranjería)</option>
                  <option>Pasaporte</option>
                </select>
              </div>

              {/* Número documento */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Número de documento
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
                  placeholder="123456789"
                />
              </div>

              {/* Nombre copropietario */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nombre del copropietario
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
                  placeholder="Juanito Perez"
                />
              </div>

              {/* Tipo doc copropietario */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tipo documento copropietario
                </label>
                <select className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm">
                  <option value="">Seleccione</option>
                  <option>CC(Cédula de Ciudadanía)</option>
                  <option>CE(Cédula de Extranjería)</option>
                  <option>Pasaporte</option>
                </select>
              </div>

              {/* Número doc copropietario */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Documento copropietario
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
                  placeholder="123456789"
                />
              </div>

              {/* Torre */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Torre
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
                  placeholder="Torre A"
                />
              </div>

              {/* Apartamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Apartamento
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
                  placeholder="123"
                />
              </div>

              {/* Etapa */}
              <div>
                {/* ¿Aplica Etapa? */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    ¿Aplica etapa?
                  </label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
                    value={aplicaEtapa}
                    onChange={(e) => {
                      setAplicaEtapa(e.target.value)
                      if (e.target.value === 'no') {
                        setEtapa('')
                      }
                    }}
                  >
                    <option value="si">Sí aplica</option>
                    <option value="no">No aplica</option>
                  </select>
                </div>

                {/* Etapa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Etapa
                  </label>
                  <input
                    type="text"
                    value={etapa}
                    onChange={(e) => setEtapa(e.target.value)}
                    disabled={aplicaEtapa === 'no'}
                    className={`mt-1 w-full rounded-md border p-2 text-sm ${
                      aplicaEtapa === 'no'
                        ? 'bg-gray-100 cursor-not-allowed'
                        : 'border-gray-300'
                    }`}
                    placeholder="Etapa 1"
                  />
                </div>
              </div>

              {/* Archivo */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Por favor sube el archivo del poder escaneado (PDF, PNG, JPG)
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="mt-1 w-full text-sm"
                />
              </div>

              {/* Botón */}
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-6 py-2 text-sm text-white hover:bg-blue-700"
                >
                  Guardar poder
                </button>
              </div>
            </form>
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

      case 'envio-masivo':
        return (
          <div className="space-y-8 pb-10">
            {/* Modal Carta */}
            {renderCartaModal()}

            <div className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Módulo de Envío Masivo</h3>
                <button onClick={handleEjecutarEnvioMasivo} disabled={loading} className="flex items-center gap-2 rounded-md px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 shadow">
                  {loading ? <Activity className="animate-spin h-5 w-5"/> : <UploadCloud className="h-5 w-5"/>}
                  <span>{loading ? 'Cargando...' : 'Cargar Datos'}</span>
                </button>
              </div>

              {datosMasivos.length > 0 ? (
                <div className="animate-fade-in mt-4">
                  <div className="overflow-x-auto border rounded-lg max-h-[400px]">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500">Acciones</th>
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500">Primer Nombre</th>
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500">Segundo Nombre</th>
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500">Primer Apellido</th>
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500">Segundo Apellido</th>
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500">Cédula</th>
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500">Torre</th>
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500">Apartamento</th>
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500">Unidad</th>
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500">Correo</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {datosMasivos.map((dato, index) => {
                          const isEditing = editIdx === index;
                          return (
                            <tr key={index} className={isEditing ? "bg-blue-50" : "hover:bg-gray-50"}>
                              <td className="px-3 py-2 whitespace-nowrap text-sm flex gap-2">
                                {/* Botón OJO para ver la carta */}
                                {!isEditing && (
                                  <button 
                                    onClick={() => setPreviewData(dato)} 
                                    className="text-gray-500 hover:text-gray-800"
                                    title="Ver Carta Generada"
                                  >
                                    <Eye size={16}/>
                                  </button>
                                )}
                                {isEditing ? (
                                  <>
                                    <button onClick={() => saveEdit(index)} className="text-green-600"><Save size={16}/></button>
                                    <button onClick={cancelEdit} className="text-red-600"><X size={16}/></button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => startEdit(index, dato)} className="text-blue-600"><Edit2 size={16}/></button>
                                    <button onClick={() => deleteRow(index)} className="text-red-400"><Trash2 size={16}/></button>
                                  </>
                                )}
                              </td>
                              
                              <td className="px-3 py-2 text-sm">
                                {isEditing ? (
                                  <input name="primer_nombre" value={editData.primer_nombre} onChange={handleEditChange} className="w-full border rounded text-xs p-1" />
                                ) : (
                                  <span>{dato.primer_nombre}</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-sm">
                                {isEditing ? (
                                  <input name="segundo_nombre" value={editData.segundo_nombre} onChange={handleEditChange} className="w-full border rounded text-xs p-1" />
                                ) : (
                                  <span>{dato.segundo_nombre}</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-sm">
                                {isEditing ? (
                                  <input name="primer_apellido" value={editData.primer_apellido} onChange={handleEditChange} className="w-full border rounded text-xs p-1" />
                                ) : (
                                  <span>{dato.primer_apellido}</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-sm">
                                {isEditing ? (
                                  <input name="segundo_apellido" value={editData.segundo_apellido} onChange={handleEditChange} className="w-full border rounded text-xs p-1" />
                                ) : (
                                  <span>{dato.segundo_apellido}</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-sm">{isEditing ? <input name="cedula" value={editData.cedula} onChange={handleEditChange} className="w-20 border" /> : dato.cedula}</td>
                              <td className="px-3 py-2 text-sm">{isEditing ? <input name="torre" value={editData.torre} onChange={handleEditChange} className="w-20 border" /> : dato.torre}</td>
                              <td className="px-3 py-2 text-sm">{isEditing ? <input name="apartamento" value={editData.apartamento} onChange={handleEditChange} className="w-20 border" /> : dato.apartamento}</td>
                              <td className="px-3 py-2 text-sm">{isEditing ? <input name="unidad" value={editData.unidad} onChange={handleEditChange} className="w-20 border" /> : dato.unidad}</td>
                              <td className="px-3 py-2 text-sm">{isEditing ? <input name="correo" value={editData.correo} onChange={handleEditChange} className="w-full border" /> : dato.correo}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button onClick={handleConfirmarEnvio} className="flex items-center rounded-md bg-green-600 px-6 py-2 text-white hover:bg-green-700">
                      <Send className="mr-2 h-4 w-4" /> Confirmar Envío
                    </button>
                  </div>
                </div>
              ) : <div className="mt-8 text-center py-10 border-2 dashed bg-gray-50">Sin datos</div>}
            </div>

            {/* Formularios manuales y de Excel */}
             <div className="rounded-lg bg-white p-6 shadow border-t-4 border-blue-500">
                <h4 className="text-lg font-semibold mb-4">Agregar Manualmente</h4>
                <form onSubmit={agregarRegistroManual} className="grid grid-cols-4 gap-2">
                   {/* Inputs minimizados para ahorrar espacio en este ejemplo */}
                   <input required name="primer_nombre" placeholder="Primer Nombre" value={nuevoRegistro.primer_nombre} onChange={handleManualChange} className="border p-2 rounded"/>
                   <input required name="segundo_nombre" placeholder="Segundo Nombre" value={nuevoRegistro.segundo_nombre} onChange={handleManualChange} className="border p-2 rounded"/>
                   <input required name="primer_apellido" placeholder="Primer Apellido" value={nuevoRegistro.primer_apellido} onChange={handleManualChange} className="border p-2 rounded"/>
                   <input required name="segundo_apellido" placeholder="Segundo Apellido" value={nuevoRegistro.segundo_apellido} onChange={handleManualChange} className="border p-2 rounded"/>
                   <input required name="cedula" placeholder="Cédula" value={nuevoRegistro.cedula} onChange={handleManualChange} className="border p-2 rounded"/>
                   <input name="correo" placeholder="Correo" value={nuevoRegistro.correo} onChange={handleManualChange} className="border p-2 rounded"/>
                   <input name="torre" placeholder="Torre" value={nuevoRegistro.torre} onChange={handleManualChange} className="border p-2 rounded"/>
                   <input name="apartamento" placeholder="Apartamento" value={nuevoRegistro.apartamento} onChange={handleManualChange} className="border p-2 rounded"/>
                   <input name="unidad" placeholder="Unidad" value={nuevoRegistro.unidad} onChange={handleManualChange} className="border p-2 rounded"/>
                   <button type="submit" className="bg-gray-800 text-white rounded">+ Agregar</button>
                </form>
             </div>

             <div className="rounded-lg bg-white p-6 shadow border-t-4 border-green-500">
                <div className="flex justify-between items-center mb-4">
                   <h4 className="text-lg font-semibold">Importar Excel</h4>
                   <button
                     type="button"
                     onClick={handleDownloadTemplate}
                     className="flex items-center text-sm text-green-600 hover:text-green-800 font-medium"
                   >
                     <Download className="mr-2 h-4 w-4" /> Descargar Planilla
                   </button>
                </div>
                <input type="file" accept=".xlsx, .xls" onChange={handleExcelUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100"/>
             </div>
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