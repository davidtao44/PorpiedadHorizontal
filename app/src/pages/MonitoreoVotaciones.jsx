import React from 'react'
import { Activity, Users, Globe, Award, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const MonitoreoVotaciones = () => {
    // Mock data for the chart
    const data = [
        { name: 'Aprobar', votos: 145, color: '#4F46E5' },
        { name: 'No Aprobar', votos: 28, color: '#EF4444' },
        { name: 'Abstenerse', votos: 12, color: '#9CA3AF' },
    ]

    const totalVotos = data.reduce((sum, item) => sum + item.votos, 0)
    const quorumActual = "74.5%"

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Monitoreo en Tiempo Real</h1>
                    <p className="mt-1 text-lg text-gray-500">Resultados en vivo de las votaciones actuales.</p>
                </div>
                <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-full border border-green-100">
                    <span className="w-3 h-3 bg-green-500 rounded-full animate-ping"></span>
                    <span className="text-green-700 font-bold text-sm tracking-widest uppercase">En Vivo</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-lg border-b-4 border-indigo-500">
                    <div className="flex items-center text-indigo-500 mb-2">
                        <Users className="h-5 w-5 mr-2" />
                        <span className="text-xs font-bold uppercase tracking-wider">Votos Totales</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{totalVotos}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-lg border-b-4 border-emerald-500">
                    <div className="flex items-center text-emerald-500 mb-2">
                        <Globe className="h-5 w-5 mr-2" />
                        <span className="text-xs font-bold uppercase tracking-wider">Quórum Actual</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{quorumActual}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-lg border-b-4 border-amber-500">
                    <div className="flex items-center text-amber-500 mb-2">
                        <Award className="h-5 w-5 mr-2" />
                        <span className="text-xs font-bold uppercase tracking-wider">Tendencia</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">Aprobar</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Card */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-xl">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center">
                            <TrendingUp className="mr-2 text-indigo-500" />
                            Distribución de Votos
                        </h3>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }}
                                    dy={10}
                                />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="votos" radius={[8, 8, 0, 0]} barSize={60}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Breakdown Card */}
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-50">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                        <Activity className="mr-2 text-primary-500" />
                        Detalle
                    </h3>
                    <div className="space-y-6">
                        {data.map((item) => {
                            const percentage = ((item.votos / totalVotos) * 100).toFixed(1)
                            return (
                                <div key={item.name}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold text-gray-600">{item.name}</span>
                                        <span className="text-sm font-extrabold text-gray-900">{percentage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000 ease-out"
                                            style={{
                                                width: `${percentage}%`,
                                                backgroundColor: item.color
                                            }}
                                        ></div>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-400 font-medium">{item.votos} votos registrados</p>
                                </div>
                            )
                        })}
                    </div>

                    <div className="mt-10 pt-6 border-t border-gray-100 text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Última Actualización</p>
                        <p className="text-sm font-bold text-indigo-600">{new Date().toLocaleTimeString()}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MonitoreoVotaciones
