import React from 'react'
import { User, Building, Mail, Phone, Hash, Shield } from 'lucide-react'

const DatosPersonales = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const tenant = JSON.parse(localStorage.getItem('tenant') || '{}')

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                {/* Header con gradiente */}
                <div className="h-32 bg-gradient-to-r from-primary-600 to-indigo-600 flex items-center px-8">
                    <div className="bg-white p-3 rounded-full shadow-lg">
                        <User className="h-12 w-12 text-primary-600" />
                    </div>
                    <div className="ml-6 text-white">
                        <h1 className="text-3xl font-bold">{user.first_name} {user.last_name}</h1>
                        <p className="text-primary-100 opacity-90 uppercase tracking-widest text-sm font-semibold">{user.role || 'Copropietario'}</p>
                    </div>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Información del Usuario */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center">
                                <Shield className="mr-2 h-5 w-5 text-primary-500" />
                                Información de la Cuenta
                            </h2>

                            <div className="flex items-start space-x-4">
                                <div className="bg-gray-50 p-2 rounded-lg">
                                    <Mail className="h-5 w-5 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Correo Electrónico</p>
                                    <p className="text-gray-700 font-medium">{user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="bg-gray-50 p-2 rounded-lg">
                                    <Hash className="h-5 w-5 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ID de Usuario</p>
                                    <p className="text-gray-700 font-medium">#{user.id}</p>
                                </div>
                            </div>
                        </div>

                        {/* Información del Conjunto */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center">
                                <Building className="mr-2 h-5 w-5 text-secondary-500" />
                                Información de Residencia
                            </h2>

                            <div className="flex items-start space-x-4">
                                <div className="bg-gray-50 p-2 rounded-lg">
                                    <Building className="h-5 w-5 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Conjunto Residencial</p>
                                    <p className="text-gray-700 font-medium">{tenant.name || 'No especificado'}</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="bg-gray-50 p-2 rounded-lg">
                                    <Hash className="h-5 w-5 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Dirección</p>
                                    <p className="text-gray-700 font-medium">{tenant.address || 'No especificada'}</p>
                                </div>
                            </div>

                            {tenant.phone && (
                                <div className="flex items-start space-x-4">
                                    <div className="bg-gray-50 p-2 rounded-lg">
                                        <Phone className="h-5 w-5 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Teléfono Administración</p>
                                        <p className="text-gray-700 font-medium">{tenant.phone}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-12 bg-primary-50 rounded-xl p-6 border border-primary-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-primary-800 font-bold text-lg">¿Necesitas actualizar tus datos?</h3>
                            <p className="text-primary-600">Comunícate directamente con la administración del conjunto.</p>
                        </div>
                        <button className="bg-primary-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-700 transition-colors shadow-md">
                            Contactar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DatosPersonales
