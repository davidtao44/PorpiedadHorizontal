import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authService, formatters } from '../services/api'
import { CheckCircle, AlertCircle, Key, LogIn, Lock, Info } from 'lucide-react'

const AutoLoginPage = () => {
    const [searchParams] = useSearchParams()
    const [status, setStatus] = useState('loading') // loading, success, error
    const [error, setError] = useState('')
    const [userData, setUserData] = useState(null)
    const navigate = useNavigate()

    useEffect(() => {
        const token = searchParams.get('token')
        if (!token) {
            setStatus('error')
            setError('No se proporcionó un token de acceso válido.')
            return
        }

        const performAutoLogin = async () => {
            console.log('Starting auto-login with token:', token.substring(0, 10) + '...');
            try {
                const response = await authService.magicLogin(token);
                console.log('Auto-login response:', response);
                setUserData(response.data.user);
                setStatus('success');
            } catch (err) {
                console.error('Auto-login error:', err);
                setStatus('error');
                setError('El enlace de acceso ha expirado o es inválido.');
            }
        }

        performAutoLogin()
    }, [searchParams])

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Validando acceso automático...</p>
                </div>
            </div>
        )
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
                <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg border-t-4 border-red-500 text-center">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
                    <h2 className="mt-4 text-2xl font-bold text-gray-900">Error de Acceso</h2>
                    <p className="mt-2 text-gray-600">{error}</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="mt-8 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                        Ir al inicio de sesión normal
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl border-t-8 border-blue-600">
                <div className="text-center space-y-4">
                    <div className="bg-green-100 p-3 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                        <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900">¡Bienvenido!</h2>
                    <p className="text-gray-600">Acceso validado correctamente para {userData?.first_name || 'Usuario'}.</p>
                </div>

                <div className="mt-10 space-y-6">
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                        <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-4 flex items-center">
                            <Key className="h-4 w-4 mr-2" /> Sus Credenciales de Acceso
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                                <span className="text-sm text-gray-500 font-medium">Usuario</span>
                                <span className="text-lg font-mono font-bold text-gray-800">{userData?.username || '---'}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                                <span className="text-sm text-gray-500 font-medium">Contraseña Temporal</span>
                                <span className="text-lg font-mono font-bold text-gray-800">
                                    {userData?.username || '---'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 flex items-start gap-3 text-xs text-blue-600 bg-blue-100 p-3 rounded-lg">
                            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <p>Por seguridad, le recomendamos cambiar su contraseña en el siguiente paso.</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/')}
                            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <LogIn className="mr-2 h-5 w-5" /> Entrar al Dashboard
                        </button>

                        <button
                            onClick={() => navigate('/change-password')}
                            className="w-full flex items-center justify-center py-3 px-4 border-2 border-blue-600 rounded-xl text-base font-bold text-blue-600 hover:bg-blue-50 transition-all"
                        >
                            <Lock className="mr-2 h-5 w-5" /> Cambiar Contraseña Ahora
                        </button>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400">
                        Sistema de Gestión de Propiedad Horizontal v1.0
                    </p>
                </div>
            </div>
        </div>
    )
}

export default AutoLoginPage
