import React, { useEffect, useState, useMemo, useRef } from 'react'
import { Activity, Users, Globe, Award, TrendingUp, MessageCircle } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'
import { votingService } from '../services/api'

/**
 * ✅ Normaliza la data del backend para que SIEMPRE quede así:
 * {
 *   ...otrosCampos,
 *   results: { "Sí": 10, "No": 5 },
 *   total_votes: 15
 * }
 *
 * Soporta varias formas típicas:
 * - data.results como objeto {opcion: votos}
 * - data.results como array:
 *    a) [{ option: "Sí" }, { option: "No" }] (votos crudos)
 *    b) [{ option: "Sí", votes: 10 }, ...] (agregado pero en array)
 * - data.votes / data.by_option / data.options_results como objeto o array
 * - data.options como array con votes
 */
const normalizeResults = (raw) => {
  if (!raw || typeof raw !== 'object') {
    return { results: {}, total_votes: 0 }
  }

  // 1) Intenta encontrar "dónde vienen los resultados" (objeto o array)
  const candidate =
    raw.results ??
    raw.votes ??
    raw.options_results ??
    raw.by_option ??
    raw.options ??
    raw.data ?? // por si viene anidado
    null

  let resultsObj = {}

  // 2) Si ya viene como objeto {opcion: votos}
  if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
    resultsObj = Object.fromEntries(
      Object.entries(candidate).map(([k, v]) => [String(k), Number(v) || 0])
    )
  }

  // 3) Si viene como array, lo convertimos a objeto
  if (Array.isArray(candidate)) {
    // Caso A: array de votos crudos (cada item es un voto)
    // detecta keys comunes: option, opcion, choice, value, selected_option
    const looksLikeRawVotes =
      candidate.length > 0 &&
      candidate.some(
        (x) =>
          x &&
          typeof x === 'object' &&
          (x.option || x.opcion || x.choice || x.value || x.selected_option)
      ) &&
      // si NO trae votes numéricos, probablemente es voto por voto
      !candidate.some((x) => x && typeof x === 'object' && typeof x.votes === 'number')

    if (looksLikeRawVotes) {
      for (const item of candidate) {
        const opt =
          item?.option ??
          item?.opcion ??
          item?.choice ??
          item?.value ??
          item?.selected_option ??
          '—'
        const key = String(opt)
        resultsObj[key] = (resultsObj[key] || 0) + 1
      }
    } else {
      // Caso B: array agregado: [{ option: "Sí", votes: 10 }] o variantes
      for (const item of candidate) {
        if (!item || typeof item !== 'object') continue
        const opt = item.option ?? item.opcion ?? item.name ?? item.label ?? item.value ?? '—'
        const votes = item.votes ?? item.count ?? item.total ?? item.votos ?? 0
        const key = String(opt)
        resultsObj[key] = (resultsObj[key] || 0) + (Number(votes) || 0)
      }
    }
  }

  // 4) Total: usa el del backend si existe y es válido; si no, suma resultsObj
  const backendTotal =
    raw.total_votes ?? raw.totalVotes ?? raw.total_votos ?? raw.votes_total ?? raw.total ?? null

  const totalFromBackend = Number(backendTotal)
  const totalFromObj = Object.values(resultsObj).reduce((acc, v) => acc + (Number(v) || 0), 0)

  const total_votes =
    Number.isFinite(totalFromBackend) && totalFromBackend >= 0 ? totalFromBackend : totalFromObj

  return {
    ...raw,
    results: resultsObj,
    total_votes
  }
}

const MonitoreoVotaciones = () => {
  const [results, setResults] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  const [preguntasActivas, setPreguntasActivas] = useState([])
  const [loadingPreguntas, setLoadingPreguntas] = useState(true)
  const [onlineCount, setOnlineCount] = useState(0)
  const [onlineUsersList, setOnlineUsersList] = useState([])
  const [onlineUsersModalOpen, setOnlineUsersModalOpen] = useState(false)

  const activeQuestionIdRef = useRef(null)

  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const formatRemaining = (ms) => {
    if (!ms || ms <= 0) return '00:00:00'
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    const pad2 = (n) => String(n).padStart(2, '0')
    return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`
  }

  const fetchResults = async (questionId) => {
    try {
      const res = await votingService.getResults(questionId)

      console.log('[Monitoreo] getResults qid=', questionId, '=>', res)

      if (res?.success && res?.data) {
        const normalized = normalizeResults(res.data)

        // 🔎 logs útiles para ver por qué no contaba:
        console.log('[Monitoreo] normalized.results =>', normalized.results)
        console.log('[Monitoreo] normalized.total_votes =>', normalized.total_votes)

        setResults(normalized)
        setLastUpdate(Date.now())
      } else {
        setResults(null)
      }
    } catch (e) {
      console.error('[Monitoreo] ERROR getResults:', e)
      setResults(null)
    }
  }

  const fetchActiveVoting = async () => {
    try {
      setLoadingPreguntas(true)

      const response = await votingService.getActiveVoting()

      console.log('[Monitoreo] getActiveVoting =>', response)

      if (response?.success && response.data) {
        const preguntaTexto =
          response.data.pregunta ??
          response.data.question ??
          response.data.text ??
          response.data.question_text ??
          response.data.pregunta_text ??
          response.data.title ??
          ''

        const endsAtRaw =
          response.data.ends_at ??
          response.data.end_time ??
          response.data.expires_at ??
          null

        const questionId =
          response.data.id ??
          response.data.question_id ??
          response.data.voting_id ??
          response.data.active_question_id ??
          null

        if (!questionId) {
          console.warn('[Monitoreo] No se encontró questionId en getActiveVoting:', response.data)
          setPreguntasActivas([])
          setResults(null)
          activeQuestionIdRef.current = null
          return
        }

        setPreguntasActivas([
          {
            id: questionId,
            pregunta: preguntaTexto,
            estado: 'Activa',
            endsAt: endsAtRaw
          }
        ])

        activeQuestionIdRef.current = questionId
        fetchResults(questionId)
      } else {
        setPreguntasActivas([])
        setResults(null)
        activeQuestionIdRef.current = null
      }
    } catch (e) {
      console.error('[Monitoreo] ERROR getActiveVoting:', e)
      setPreguntasActivas([])
      setResults(null)
      activeQuestionIdRef.current = null
    } finally {
      setLoadingPreguntas(false)
    }
  }

  useEffect(() => {
    fetchActiveVoting()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const qid = activeQuestionIdRef.current
      if (qid) fetchResults(qid)
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(fetchActiveVoting, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchOnlineCount = async () => {
      try {
        const res = await votingService.getOnlineCount()
        if (res?.success) {
          setOnlineCount(res.data.count)
        }
      } catch (e) {
        console.error("Error fetching online count:", e)
      }
    }
    fetchOnlineCount()
    const interval = setInterval(fetchOnlineCount, 10000)
    return () => clearInterval(interval)
  }, [])

  const palette = ['#4F46E5', '#EF4444', '#9CA3AF', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6']

  // ✅ ahora SIEMPRE es objeto gracias al normalizeResults
  const resultsObject = results?.results ?? {}

  const data = useMemo(() => {
    const obj = resultsObject
    if (!obj || typeof obj !== 'object') return []
    return Object.entries(obj).map(([name, votos], idx) => ({
      name,
      votos: Number(votos) || 0,
      color: palette[idx % palette.length]
    }))
  }, [resultsObject])

  // ✅ total SIEMPRE existe gracias al normalizeResults
  const totalVotos = Number(results?.total_votes || 0)

  const quorumActual = '74.5%'

  const tendencia = useMemo(() => {
    if (!data.length) return '—'
    const top = [...data].sort((a, b) => b.votos - a.votos)[0]
    if (!top || top.votos === 0) return '—'
    return top.name
  }, [data])

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* HEADER */}
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

      {/* Preguntas Activas */}
      <div className="mb-8 bg-white p-8 rounded-3xl shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <MessageCircle className="mr-2 text-indigo-500" />
            Preguntas Actual
          </h3>
        </div>

        <div className="space-y-4">
          {loadingPreguntas ? (
            <div className="text-sm text-gray-500">Cargando preguntas activas...</div>
          ) : preguntasActivas.length > 0 ? (
            preguntasActivas.map((q) => {
              let endsAtMs = null
              if (q.endsAt) {
                let dateStr = String(q.endsAt).replace(' ', 'T')
                if (!dateStr.endsWith('Z') && !dateStr.includes('+')) dateStr += 'Z'
                endsAtMs = new Date(dateStr).getTime()
              }

              const remainingMs = endsAtMs ? endsAtMs - now : null
              const expired = typeof remainingMs === 'number' && remainingMs <= 0

              return (
                <div
                  key={q.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{q.pregunta}</h4>
                    </div>
                  </div>

                  <div className="mt-4 md:mt-0 flex items-center gap-2">
                    {q.endsAt && !expired && (
                      <span className="text-sm font-semibold text-gray-700 tabular-nums">
                        {formatRemaining(remainingMs)}
                      </span>
                    )}

                    {expired && (
                      <span className="text-sm font-bold text-red-500 mr-2">
                        Tiempo de la pregunta ha terminado
                      </span>
                    )}

                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                        q.estado === 'Activa' && !expired
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {q.estado === 'Activa' && !expired && (
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                      )}
                      {expired ? 'Finalizada' : q.estado}
                    </span>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-sm text-gray-500">No hay preguntas activas en este momento.</div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-lg border-b-4 border-blue-500">
          <div className="flex items-center text-blue-500 mb-2">
            <Users className="h-5 w-5 mr-2" />
            <span className="text-xs font-bold uppercase tracking-wider">En Línea</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{onlineCount}</div>
        </div>

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
          <div className="text-3xl font-bold text-gray-900">{tendencia}</div>
        </div>
      </div>

      {/* Charts & Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Card */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <TrendingUp className="mr-2 text-indigo-500" />
              Distribución de Votos
            </h3>
          </div>

          <div className="h-80 w-full flex items-center justify-center">
            {data.length === 0 ? (
              <div className="text-sm text-gray-400 font-semibold">No hay datos para mostrar</div>
            ) : (
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
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar dataKey="votos" radius={[8, 8, 0, 0]} barSize={60}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-50">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <Activity className="mr-2 text-primary-500" />
            Detalle
          </h3>

          {data.length === 0 ? (
            <div className="text-sm text-gray-400 font-semibold">No hay opciones / votos aún</div>
          ) : (
            <div className="space-y-6">
              {data.map((item) => {
                const percentage = (totalVotos > 0 ? (item.votos / totalVotos) * 100 : 0).toFixed(1)
                return (
                  <div key={item.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-gray-600">{item.name}</span>
                      <span className="text-sm font-extrabold text-gray-900">{percentage}%</span>
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${percentage}%`, backgroundColor: item.color }}
                      />
                    </div>

                    <p className="mt-1 text-xs text-gray-400 font-medium">{item.votos} votos registrados</p>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-10 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Última Actualización</p>
            <p className="text-sm font-bold text-indigo-600">
              {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MonitoreoVotaciones
