import React, { useState, useEffect } from 'react'
import { Card, Button, Input, Space, Divider, Typography, Switch, List, Tag, Table, Statistic, Row, Col, Modal, Form, InputNumber, message, Empty, Tabs, Spin } from 'antd'
import { Settings, Plus, PlayCircle, BarChart2, PlusCircle, Trash2, Clock, CheckCircle } from 'lucide-react'
import { votingService } from '../../services/api'

const { Title, Text } = Typography

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

  const fetchData = async () => {
    try {
      // 1. Obtener asamblea activa
      const assemblyRes = await votingService.getActiveAssembly()
      if (assemblyRes.success && assemblyRes.data) {
        setActiveAssembly(assemblyRes.data)
      } else {
        setActiveAssembly(null)
      }

      // 2. Obtener pregunta activa
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
      // Si hay una pregunta activa, solo refrescar resultados
      // Si NO hay, buscar si se lanzó una nueva
      const currentQuestion = activeQuestion; // Captura para el closure si es necesario o mejor usar ref o estado actualizado

      // Intentar refrescar todo periódicamente
      fetchData()
    }, 10000) // Cada 10s
    return () => clearInterval(interval)
  }, []) // Solo al montar

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

  const handleLaunchQuestion = async (values) => {
    try {
      if (!activeAssembly) {
        message.warning('Primero debes tener una asamblea activa')
        return
      }

      setLoading(true)
      const options = values.options.split(',').map(o => o.trim())
      const response = await votingService.createQuestion({
        assembly_id: activeAssembly.id,
        question_text: values.question_text,
        options: JSON.stringify(options),
        allow_observations: values.allow_observations || false
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

  // Componentes Internos para organizar la UI
  const ControlPanel = () => (
    <Row gutter={24}>
      <Col span={8}>
        <Card title="Estado de Asamblea" className="h-full border-t-4 border-t-indigo-500 shadow-sm">
          <Space orientation="vertical" className="w-full">
            <div className="flex justify-between items-center mb-4">
              <Text strong>Estado:</Text>
              <Tag color={activeAssembly?.is_active ? 'green' : 'red'}>
                {activeAssembly?.is_active ? 'ASAMBLEA ACTIVA' : 'INACTIVA'}
              </Tag>
            </div>
            <Button
              block
              icon={<PlusCircle size={18} className="mr-2" />}
              onClick={() => setAssemblyModalOpen(true)}
            >
              Nueva Asamblea
            </Button>
            <Divider className="my-2" />
            <Button
              type="primary"
              block
              size="large"
              disabled={!activeAssembly}
              icon={<PlayCircle size={18} className="mr-2" />}
              className="bg-indigo-600"
              onClick={() => setIsModalOpen(true)}
            >
              Lanzar Nueva Pregunta
            </Button>
          </Space>
        </Card>
      </Col>

      <Col span={16}>
        <Card
          title="Resultados en Tiempo Real"
          className="h-full shadow-sm"
          extra={activeQuestion && (
            <Tag icon={<Clock size={12} className="mr-1" />} color="blue">
              Pregunta en curso
            </Tag>
          )}
        >
          {activeQuestion ? (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <Text type="secondary" className="block text-xs uppercase font-bold mb-1">Pregunta Activa</Text>
                <Title level={4} className="m-0">{activeQuestion.question_text}</Title>
              </div>

              <Row gutter={16}>
                <Col span={12}>
                  <Statistic title="Votos Totales" value={results?.total_votes || 0} prefix={<BarChart2 size={16} />} />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Estado"
                    value={activeQuestion.is_active ? 'Abierta' : 'Cerrada'}
                    styles={{ content: { color: activeQuestion.is_active ? '#3f8600' : '#cf1322' } }}
                  />
                </Col>
              </Row>

              <Table
                columns={columns}
                dataSource={tableData}
                pagination={false}
                size="small"
                className="mt-4"
              />

              {results?.observations?.length > 0 && (
                <div className="mt-4">
                  <Text strong>Observaciones Recientes:</Text>
                  <List
                    className="mt-2 max-h-40 overflow-y-auto"
                    size="small"
                    bordered
                    dataSource={results.observations.slice(-5)}
                    renderItem={item => <List.Item><Text italic>"{item}"</Text></List.Item>}
                  />
                </div>
              )}
            </div>
          ) : (
            <Empty description="No hay ninguna pregunta activa en este momento" />
          )}
        </Card>
      </Col>
    </Row>
  )

  const HistoryPanel = () => (
    <div className="space-y-6">
      <Row gutter={24}>
        <Col span={10}>
          <Card title="Asambleas Pasadas" className="shadow-sm">
            <List
              loading={historyLoading}
              dataSource={historyAssemblies}
              renderItem={item => (
                <List.Item
                  className={`cursor-pointer hover:bg-gray-50 p-3 rounded-md transition-colors ${selectedAssembly?.id === item.id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''}`}
                  onClick={() => handleSelectHistoryAssembly(item)}
                >
                  <List.Item.Meta
                    title={item.name}
                    description={new Date(item.created_at).toLocaleDateString()}
                  />
                  <Tag color={item.is_active ? 'green' : 'default'}>
                    {item.is_active ? 'Activa' : 'Cerrada'}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={14}>
          <Card title={selectedAssembly ? `Preguntas de: ${selectedAssembly.name}` : 'Seleccione una asamblea'} className="shadow-sm">
            {selectedAssembly ? (
              <List
                loading={historyLoading}
                dataSource={assemblyQuestions}
                locale={{ emptyText: 'Esta asamblea no tiene preguntas asociadas' }}
                renderItem={item => (
                  <List.Item
                    actions={[
                      <Button type="link" onClick={() => handleViewHistoricalQuestion(item)}>Ver Resultados</Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={item.question_text}
                      description={`${new Date(item.created_at).toLocaleString()} - ${JSON.parse(item.options).length} opciones`}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="Seleccione una asamblea de la lista para ver sus preguntas" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )

  const tabItems = [
    {
      key: '1',
      label: (
        <span>
          <Settings size={18} className="inline mr-2" />
          Control Actual
        </span>
      ),
      children: <ControlPanel />
    },
    {
      key: '2',
      label: (
        <span>
          <Clock size={18} className="inline mr-2" />
          Historial
        </span>
      ),
      children: <HistoryPanel />
    }
  ]

  return (
    <div className="space-y-6">
      <Title level={3} className="flex items-center m-0 mb-4">
        Panel de Administración de Votaciones
      </Title>

      <Tabs
        defaultActiveKey="1"
        items={tabItems}
        size="large"
        className="bg-white p-6 rounded-xl shadow-md border"
        onChange={(key) => { if (key === '2') fetchHistory() }}
      />

      {/* Modal Nueva Asamblea */}
      <Modal
        title="Crear Nueva Asamblea"
        open={assemblyModalOpen}
        onCancel={() => setAssemblyModalOpen(false)}
        footer={null}
      >
        <Form form={assemblyForm} layout="vertical" onFinish={handleCreateAssembly}>
          <Form.Item name="name" label="Nombre de la Asamblea" rules={[{ required: true }]}>
            <Input placeholder="Ej: Asamblea General Ordinaria 2024" />
          </Form.Item>
          <Button type="primary" block htmlType="submit">Crear Asamblea</Button>
        </Form>
      </Modal>

      {/* Modal Lanzar Pregunta */}
      <Modal
        title="Configurar Nueva Pregunta"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleLaunchQuestion}>
          <Form.Item
            name="question_text"
            label="Texto de la Pregunta"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={3} placeholder="¿Aprueba usted el presupuesto?..." />
          </Form.Item>

          <Form.Item
            name="options"
            label="Opciones (Separadas por comas)"
            rules={[{ required: true }]}
            extra="Ej: Sí, No, Abstengo"
          >
            <Input placeholder="Sí, No, Abstengo" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="duration"
                label="Tiempo Límite (Minutos)"
                initialValue={2}
                rules={[{ required: true }]}
              >
                <InputNumber min={1} max={120} className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="allow_observations"
                label="Permitir Observaciones"
                valuePropName="checked"
                initialValue={false}
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Button type="primary" block size="large" htmlType="submit" loading={loading} className="mt-4 bg-indigo-600">
            Lanzar Pregunta a Residentes
          </Button>
        </Form>
      </Modal>

      {/* Modal Resultados Históricos */}
      <Modal
        title="Resultados de la Votación"
        open={resultsModalOpen}
        onCancel={() => setResultsModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setResultsModalOpen(false)}>Cerrar</Button>
        ]}
        width={700}
      >
        {historicalResults ? (
          <div className="space-y-4">
            <Title level={4} className="m-0">{historicalResults.question_text}</Title>
            <Statistic title="Votos Totales" value={historicalResults.total_votes} />
            <Table
              columns={[
                { title: 'Opción', dataIndex: 'option', key: 'option' },
                { title: 'Votos', dataIndex: 'votes', key: 'votes' },
                {
                  title: 'Porcentaje', key: 'percent', render: (_, record) => (
                    <Text>{historicalResults.total_votes > 0 ? ((record.votes / historicalResults.total_votes) * 100).toFixed(1) : 0}%</Text>
                  )
                }
              ]}
              dataSource={Object.entries(historicalResults.results).map(([option, votes]) => ({
                key: option,
                option,
                votes
              }))}
              pagination={false}
              size="small"
            />
            {historicalResults.observations?.length > 0 && (
              <div className="mt-4">
                <Text strong>Observaciones:</Text>
                <List
                  size="small"
                  bordered
                  dataSource={historicalResults.observations}
                  renderItem={item => <List.Item><Text italic>"{item}"</Text></List.Item>}
                />
              </div>
            )}
          </div>
        ) : (
          <Spin size="large" className="flex justify-center p-10" />
        )}
      </Modal>
    </div>
  )
}

export default AdminVotingPanel
