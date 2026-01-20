import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/api'
import { toast } from 'react-hot-toast'
import { Lock, ShieldCheck, AlertCircle, Save, X } from 'lucide-react'

const PasswordChange = () => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('Las contraseñas no coinciden')
            return
        }

        if (formData.newPassword.length < 6) {
            toast.error('La nueva contraseña debe tener al menos 6 caracteres')
            return
        }

        setLoading(true)
        try {
            await authService.changePassword(formData.currentPassword, formData.newPassword)
            toast.success('Contraseña actualizada exitosamente')
            navigate('/')
        } catch (error) {
            console.error('Password change error:', error)
            toast.error(error.response?.data?.detail || 'Error al cambiar la contraseña')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto mt-10">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-blue-600 p-6 text-white text-center">
                    <ShieldCheck className="h-12 w-12 mx-auto mb-2 opacity-90" />
                    <h2 className="text-2xl font-bold">Cambiar Contraseña</h2>
                    <p className="text-blue-100 text-sm mt-1">Asegure su cuenta con una nueva contraseña</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Contraseña Actual
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    name="currentPassword"
                                    required
                                    value={formData.currentPassword}
                                    onChange={handleChange}
                                    className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                    placeholder="Ingrese su contraseña actual"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Nueva Contraseña
                            </label>
                            <input
                                type="password"
                                name="newPassword"
                                required
                                value={formData.newPassword}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Confirmar Nueva Contraseña
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                placeholder="Repita su nueva contraseña"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="flex-1 flex items-center justify-center py-2.5 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all"
                        >
                            <X className="mr-2 h-4 w-4" /> Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 flex items-center justify-center py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                                <><Save className="mr-2 h-4 w-4" /> Guardar</>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <div className="mt-8 bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 leading-relaxed">
                    <strong>Recomendación:</strong> Use una combinación de letras, números y símbolos para mayor seguridad. No comparta su contraseña con terceros.
                </p>
            </div>
        </div>
    )
}

export default PasswordChange
