import React, { useState } from 'react'
import { Vote, Timer, CheckCircle, Info, ChevronRight } from 'lucide-react'

const VotacionesUsuario = () => {
    // Mock data for demonstration - would normally come from an API
    const [votaciones, setVotaciones] = useState([
        {
            id: 1,
            titulo: "Aprobación de Presupuesto 2026",
            descripcion: "Votación para aprobar el presupuesto operativo del próximo año fiscal.",
            estado: "activa",
            tiempoRestante: "00:45:12",
            opciones: ["Aprobar", "No Aprobar", "Abstenerse"]
        },
        {
            id: 2,
            titulo: "Elección de Consejo de Administración",
            descripcion: "Selección de los nuevos miembros para el consejo del periodo 2026-2027.",
            estado: "activa",
            tiempoRestante: "01:20:00",
            opciones: ["Lista 1", "Lista 2", "Voto en Blanco"]
        }
    ])

    const [votoSeleccionado, setVotoSeleccionado] = useState(null)
    const [votoRealizado, setVotoRealizado] = useState(false)

    const handleVotar = (id) => {
        if (!votoSeleccionado) return
        setVotoRealizado(true)
        // API call would happen here
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Panel de Votaciones</h1>
                    <p className="mt-1 text-lg text-gray-500">Participa en las decisiones de tu comunidad.</p>
                </div>
                <div className="bg-indigo-100 p-3 rounded-2xl shadow-inner">
                    <Vote className="h-8 w-8 text-indigo-600" />
                </div>
            </div>

            {!votoRealizado ? (
                <div className="space-y-6">
                    {votaciones.map((votacion) => (
                        <div key={votacion.id} className="bg-white shadow-lg rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-green-100 text-green-800">
                                        <span className="w-2 h-2 mr-2 bg-green-500 rounded-full animate-pulse"></span>
                                        {votacion.estado}
                                    </span>
                                    <div className="flex items-center text-gray-500 text-sm font-semibold bg-gray-50 px-3 py-1 rounded-lg">
                                        <Timer className="h-4 w-4 mr-2 text-indigo-500" />
                                        Termina en: {votacion.tiempoRestante}
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-2">{votacion.titulo}</h3>
                                <p className="text-gray-600 mb-6 leading-relaxed">{votacion.descripcion}</p>

                                <div className="space-y-3">
                                    {votacion.opciones.map((opcion) => (
                                        <button
                                            key={opcion}
                                            onClick={() => setVotoSeleccionado(opcion)}
                                            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all font-semibold ${votoSeleccionado === opcion
                                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                                    : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50 text-gray-700'
                                                }`}
                                        >
                                            {opcion}
                                            {votoSeleccionado === opcion && <CheckCircle className="h-5 w-5 text-indigo-600" />}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    disabled={!votoSeleccionado}
                                    onClick={() => handleVotar(votacion.id)}
                                    className={`mt-8 w-full py-4 rounded-xl font-bold text-lg shadow-lg transform transition-all active:scale-95 ${votoSeleccionado
                                            ? 'bg-gradient-to-r from-indigo-600 to-primary-600 text-white hover:from-indigo-700 hover:to-primary-700 shadow-indigo-200'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    Emitir Voto
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white p-12 rounded-3xl shadow-xl text-center border border-indigo-50 border-t-4 border-t-indigo-600">
                    <div className="bg-green-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">¡Voto Registrado con Éxito!</h2>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">Tu participación es fundamental para el conjunto. Puedes ver los resultados en tiempo real en la ventana de Monitoreo.</p>
                    <button
                        onClick={() => setVotoRealizado(false)}
                        className="text-indigo-600 font-bold flex items-center justify-center mx-auto hover:text-indigo-800"
                    >
                        Ver otras votaciones <ChevronRight className="ml-1 h-5 w-5" />
                    </button>
                </div>
            )}

            <div className="mt-8 bg-indigo-50 p-6 rounded-2xl flex items-start space-x-4">
                <Info className="h-6 w-6 text-indigo-600 mt-1 flex-shrink-0" />
                <p className="text-indigo-800 text-sm font-medium leading-relaxed">
                    Tu voto es anónimo y seguro. Nuestro sistema utiliza cifrado de extremo a extremo para garantizar que tu elección sea privada y que los resultados sean transparentes e inalterables.
                </p>
            </div>
        </div>
    )
}

export default VotacionesUsuario
