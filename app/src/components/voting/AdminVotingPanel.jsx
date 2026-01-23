import React, { useState, useEffect } from 'react'
import { Card, Button, Input, Space, Divider, Typography, Switch, List, Tag, Table, Statistic, Row, Col, Modal, Form, InputNumber, message, Empty, Tabs, Spin, Select } from 'antd'
import { Settings, Plus, PlayCircle, BarChart2, PlusCircle, Trash2, Clock, CheckCircle, XCircle, Plus as PlusIcon } from 'lucide-react'
import { votingService } from '../../services/api'

const { Title, Text } = Typography
const { Option } = Select

const AdminVotingPanel = () => {
  const [activeAssembly, setActiveAssembly] = useState(null)
  const [activeQuestion, setActiveQuestion] = useState(null)
  const [results, setResults] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [assemblyModalOpen, setAssemblyModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [assemblyForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [historyAssemblies, setHistoryAssemblies] = useState([])
  const [selectedAssembly, setSelectedAssembly] = useState(null)
  const [assemblyQuestions, setAssemblyQuestions] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historicalResults, setHistoricalResults] = useState(null)
  const [resultsModalOpen, setResultsModalOpen] = useState(false)
  const [elapsedTime, setElapsedTime] = useState('00:00:00')

  const formatDate = (dateString) => {
    if (!dateString) return ''
    let dateStr = dateString
    if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
      dateStr += 'Z'
    }
    return new Date(dateStr).toLocaleString()
  }

  useEffect(() => {
    if (!activeAssembly?.created_at || !activeAssembly?.is_active) {
      setElapsedTime('00:00:00')
      return
    }

    const updateTimer = () => {
      let startTimeString = activeAssembly.created_at
      if (!startTimeString.endsWith('Z') && !startTimeString.includes('+')) {
         startTimeString += 'Z'
      }

      const start = new Date(startTimeString).getTime()
      const now = new Date().getTime()
      const diff = now - start
      
      if (diff < 0) {
         setElapsedTime('00:00:00')
         return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setElapsedTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      )
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [activeAssembly])

  const fetchData = async () => {
    try {
      const assemblyRes = await votingService.getActiveAssembly()
      if (assemblyRes.success && assemblyRes.data) {
        setActiveAssembly(assemblyRes.data)
      } else {
        setActiveAssembly(null)
      }

      const response = await votingService.getActiveVoting()
      if (response.success && response.data) {
        setActiveQuestion(response.data)
        fetchResults(response.data.id)
      } else {
        setActiveQuestion(null)
        setResults(null)
      }
    } catch (error) {
      console.error('Error fetching voting data:', error)
    }
  }

  const fetchResults = async (questionId, isHistorical = false) => {
    try {
      const response = await votingService.getResults(questionId)
      if (response.success) {
        if (isHistorical) {
          setHistoricalResults(response.data)
        } else {
          setResults(response.data)
        }
      }
    } catch (error) {
      console.error('Error fetching results:', error)
    }
  }

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true)
      const res = await votingService.getAssemblies()
      if (res.success) {
        setHistoryAssemblies(res.data)
      }
    } catch (error) {
      message.error('Error al cargar historial de asambleas')
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleSelectHistoryAssembly = async (assembly) => {
    try {
      setSelectedAssembly(assembly)
      setHistoryLoading(true)
      const res = await votingService.getAssemblyQuestions(assembly.id)
      if (res.success) {
        setAssemblyQuestions(res.data)
      }
    } catch (error) {
      message.error('Error al cargar preguntas de la asamblea')
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleViewHistoricalQuestion = async (question) => {
    fetchResults(question.id, true)
    setResultsModalOpen(true)
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => {
      fetchData()
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleCreateAssembly = async (values) => {
    try {
      const response = await votingService.createAssembly({
        name: values.name,
        tenant_id: JSON.parse(localStorage.getItem('user'))?.tenant_id,
        is_active: true
      })
      if (response.success) {
        message.success('Asamblea creada y activada')
        setAssemblyModalOpen(false)
        setActiveAssembly(response.data)
        assemblyForm.resetFields()
      }
    } catch (error) {
      message.error('Error al crear asamblea')
    }
  }

  const handleCloseAssembly = async () => {
    if (!activeAssembly) return
    
    try {
      setLoading(true)
      const response = await votingService.closeAssembly(activeAssembly.id)
      if (response.success) {
        message.success('Asamblea cerrada exitosamente')
        setActiveAssembly(prev => ({ ...prev, is_active: false }))
        if (activeQuestion) {
            setActiveQuestion(prev => ({ ...prev, is_active: false }))
        }
      }
    } catch (error) {
      message.error('Error al cerrar la asamblea')
    } finally {
      setLoading(false)
    }
  }

  const handleLaunchQuestion = async (values) => {
    try {
      if (!activeAssembly) {
        message.warning('Primero debes tener una asamblea activa')
        return
      }

      setLoading(true)
      
      // FILTRADO DE OPCIONES: Solo toma las que tienen texto y elimina espacios extra
      const options = (values.options_list || [])
        .map(opt => opt?.trim())
        .filter(opt => opt && opt !== "");

      if (options.length < 1) {
        message.error('Debes ingresar al menos una opción válida');
        setLoading(false);
        return;
      }

      const response = await votingService.createQuestion({
        assembly_id: activeAssembly.id,
        question_text: values.question_text,
        options: JSON.stringify(options),
        allow_observations: values.allow_observations || false,
        voting_type: values.voting_type 
      }, values.duration * 60)

      if (response.success) {
        message.success('Pregunta lanzada a los usuarios')
        setIsModalOpen(false)
        setActiveQuestion(response.data)
        form.resetFields()
        setResults(null)
      }
    } catch (error) {
      message.error('Error al lanzar la pregunta')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { title: 'Opción', dataIndex: 'option', key: 'option' },
    { title: 'Votos', dataIndex: 'votes', key: 'votes', sorter: (a, b) => a.votes - b.votes },
    {
      title: 'Porcentaje', key: 'percent', render: (_, record) => (
        <Text>{results?.total_votes > 0 ? ((record.votes / results.total_votes) * 100).toFixed(1) : 0}%</Text>
      )
    }
  ]

  const tableData = results ? Object.entries(results.results).map(([option, votes]) => ({
    key: option,
    option,
    votes
  })) : []

  const ControlPanel = () => (
    <Row gutter={24}>
      <Col span={8}>
        <Card title="Estado de Asamblea" className="h-full border-t-4 border-t-indigo-500 shadow-sm">
          <Space orientation="vertical" className="w-full">
            {activeAssembly && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-100">
                <Text type="secondary" className="text-xs uppercase font-bold block mb-1">Asamblea Actual</Text>
                <div className="font-semibold text-base leading-tight mb-1 text-indigo-900">{activeAssembly.name}</div>
                <div className="text-xs text-gray-500 flex items-center">
                  <Clock size={10} className="mr-1" />
                  {formatDate(activeAssembly.created_at)}
                </div>
              </div>
            )}
            <div className="flex justify-between items-center mb-4">
              <Text strong>Estado:</Text>
              <Tag color={activeAssembly?.is_active ? 'green' : 'red'}>
                {activeAssembly?.is_active ? 'ASAMBLEA ACTIVA' : 'INACTIVA'}
              </Tag>
            </div>
            {activeAssembly?.is_active && (
              <div className="flex justify-between items-center mb-4">
                <Text strong>Tiempo Transcurrido:</Text>
                <Tag icon={<Clock size={14} className="mr-1"/>} color="blue">{elapsedTime}</Tag>
              </div>
            )}
            <Button block icon={<PlusCircle size={18} className="mr-2" />} onClick={() => setAssemblyModalOpen(true)}>Nueva Asamblea</Button>
            {activeAssembly?.is_active && (
              <Button block danger className="mt-2" icon={<XCircle size={18} className="mr-2" />} onClick={handleCloseAssembly} loading={loading}>Cerrar Asamblea</Button>
            )}
            <Divider className="my-2" />
            <Button type="primary" block size="large" disabled={!activeAssembly} icon={<PlayCircle size={18} className="mr-2" />} className="bg-indigo-600" onClick={() => setIsModalOpen(true)}>Lanzar Nueva Pregunta</Button>
          </Space>
        </Card>
      </Col>
      <Col span={16}>
        <Card title="Resultados en Tiempo Real" className="h-full shadow-sm" extra={activeQuestion && (<Tag icon={<Clock size={12} className="mr-1" />} color="blue">Pregunta en curso</Tag>)}>
          {activeQuestion ? (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <Text type="secondary" className="block text-xs uppercase font-bold mb-1">Pregunta Activa</Text>
                <Title level={4} className="m-0">{activeQuestion.question_text}</Title>
              </div>
              <Row gutter={16}>
                <Col span={12}><Statistic title="Votos Totales" value={results?.total_votes || 0} prefix={<BarChart2 size={16} />} /></Col>
                <Col span={12}><Statistic title="Estado" value={activeQuestion.is_active ? 'Abierta' : 'Cerrada'} styles={{ content: { color: activeQuestion.is_active ? '#3f8600' : '#cf1322' } }} /></Col>
              </Row>
              <Table columns={columns} dataSource={tableData} pagination={false} size="small" />
            </div>
          ) : (<Empty description="No hay ninguna pregunta activa en este momento" />)}
        </Card>
      </Col>
    </Row>
  )

  const tabItems = [
    { key: '1', label: (<span><Settings size={18} className="inline mr-2" />Control Actual</span>), children: <ControlPanel /> },
    { key: '2', label: (<span><Clock size={18} className="inline mr-2" />Historial</span>), children: () => { fetchHistory(); return <div>Cargando...</div> } }
  ]

  return (
    <div className="space-y-6">
      <Title level={3} className="m-0 mb-4">Panel de Administración de Votaciones</Title>
      
      <Tabs defaultActiveKey="1" items={tabItems} size="large" className="bg-white p-6 rounded-xl shadow-md border" />

      {/* Modal Nueva Asamblea */}
      <Modal title="Crear Nueva Asamblea" open={assemblyModalOpen} onCancel={() => setAssemblyModalOpen(false)} footer={null}>
        <Form form={assemblyForm} layout="vertical" onFinish={handleCreateAssembly}>
          <Form.Item name="name" label="Nombre de la Asamblea" rules={[{ required: true }]}>
            <Input placeholder="Ej: Asamblea General Ordinaria 2024" />
          </Form.Item>
          <Button type="primary" block htmlType="submit">Crear Asamblea</Button>
        </Form>
      </Modal>

      {/* Modal Nueva Pregunta */}
      <Modal title="Configurar Nueva Pregunta" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} width={600}>
        <Form form={form} layout="vertical" onFinish={handleLaunchQuestion}>
          <Form.Item name="question_text" label="Texto de la Pregunta" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="¿Aprueba usted el presupuesto?..." />
          </Form.Item>

          <Form.Item name="voting_type" label="Tipo de Votación" rules={[{ required: true }]} initialValue="nominal">
            <Select>
              <Option value="nominal">Nominal (1 voto por usuario)</Option>
              <Option value="coefficient">Por Coeficiente (Peso por propiedad)</Option>
            </Select>
          </Form.Item>

          <Text strong className="block mb-2">Opciones de Respuesta</Text>
          <Form.List name="options_list" initialValue={[""]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Form.Item required={false} key={field.key} className="mb-2">
                    <Space className="w-full flex">
                      <Form.Item
                        {...field}
                        // Quitamos las reglas de validación obligatoria para que no marquen error al dejar vacío
                        noStyle
                      >
                        <Input 
                          placeholder={`Opción ${index + 1}`} 
                          style={{ width: '480px' }}
                          onChange={(e) => {
                            if (index === fields.length - 1 && e.target.value !== "") {
                              add();
                            }
                          }}
                        />
                      </Form.Item>
                      {fields.length > 1 && (
                        <Trash2 className="text-red-500 cursor-pointer ml-2" size={18} onClick={() => remove(field.name)} />
                      )}
                    </Space>
                  </Form.Item>
                ))}
              </>
            )}
          </Form.List>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="duration" label="Tiempo (Minutos)" initialValue={2} rules={[{ required: true }]}>
                <InputNumber min={1} max={120} className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="allow_observations" label="Observaciones" valuePropName="checked" initialValue={false}>
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Button type="primary" block size="large" htmlType="submit" loading={loading} className="mt-4 bg-indigo-600">Lanzar Pregunta</Button>
        </Form>
      </Modal>
    </div>
  )
}

export default AdminVotingPanel;