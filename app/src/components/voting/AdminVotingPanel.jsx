import React, { useState, useEffect } from 'react'
import { Card, Button, Input, Space, Divider, Typography, Switch, List, Tag, Table, Statistic, Row, Col, Modal, Form, InputNumber, message, Empty, Tabs, Spin, Select } from 'antd'
import { Settings, Plus, PlayCircle, BarChart2, PlusCircle, Trash2, Clock, CheckCircle, XCircle, PieChart, Users } from 'lucide-react'
import { votingService } from '../../services/api'

const { Title, Text } = Typography
const { Option } = Select // Desestructuración de Option

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
  const [remainingTime, setRemainingTime] = useState(null)
  const [onlineCount, setOnlineCount] = useState(0)
  const [onlineUsersModalOpen, setOnlineUsersModalOpen] = useState(false)
  const [onlineUsersList, setOnlineUsersList] = useState([])

  useEffect(() => {
    const fetchOnlineCount = async () => {
      try {
        const res = await votingService.getOnlineCount()
        if (res?.success) {
          setOnlineCount(res.data.count)
          if (res.data.users) {
            setOnlineUsersList(res.data.users)
          }
        }
      } catch (e) {
        console.error("Error fetching online count:", e)
      }
    }
    
    fetchOnlineCount()
    const interval = setInterval(fetchOnlineCount, 10000)
    return () => clearInterval(interval)
  }, [])

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

  useEffect(() => {
    if (!activeQuestion || !activeQuestion.is_active || !activeQuestion.end_time) {
      setRemainingTime(null)
      return
    }

    const updateRemainingTimer = () => {
      let endTimeString = activeQuestion.end_time
      if (!endTimeString.endsWith('Z') && !endTimeString.includes('+')) {
        endTimeString += 'Z'
      }

      const end = new Date(endTimeString).getTime()
      const now = new Date().getTime()
      const diff = end - now

      if (diff <= 0) {
        setRemainingTime('00:00:00')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setRemainingTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      )
    }

    updateRemainingTimer()
    const interval = setInterval(updateRemainingTimer, 1000)
    return () => clearInterval(interval)
  }, [activeQuestion])

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
      const options = (values.options_list || [])
        .map(o => o?.trim())
        .filter(o => o && o !== "")

      if (options.length === 0) {
        message.error('Debe ingresar al menos una opción de respuesta')
        setLoading(false)
        return
      }

      const response = await votingService.createQuestion({
        assembly_id: activeAssembly.id,
        question_text: values.question_text,
        options: JSON.stringify(options),
        allow_observations: values.allow_observations || false,
        voting_type: values.voting_type // Nuevo campo enviado a la API
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
    { title: 'Propiedad', dataIndex: 'property', key: 'property' },
    { title: 'Coeficiente', dataIndex: 'coefficient', key: 'coefficient' },
    { title: 'Opción', dataIndex: 'option', key: 'option' },
    { title: 'Hora', dataIndex: 'date', key: 'date', render: (text) => formatDate(text) },
  ]

  const tableData = results?.votes_detail 
    ? results.votes_detail.map((vote, index) => ({
        key: index,
        property: vote.property,
        coefficient: vote.coefficient,
        option: vote.option,
        date: vote.date
      }))
    : (results ? Object.entries(results.results).map(([option, votes]) => ({
        key: option,
        property: 'N/A', 
        coefficient: 0,
        option,
        votes, 
        date: ''
      })) : [])

  const totalCoefficient = results?.votes_detail 
    ? results.votes_detail.reduce((acc, vote) => acc + (vote.coefficient || 0), 0)
    : 0

  const ControlPanel = () => (
    <Row gutter={24}>
      <Col span={8}>
        <Card
          title="Estado de Asamblea"
          className="h-full border-t-4 border-t-indigo-500 shadow-sm"
        >
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
                <Tag color="blue" className="flex items-center gap-2">
                  <Clock size={14} />
                  <span>{elapsedTime}</span>
                </Tag>
              </div>
            )}

            <Button
              block
              icon={<PlusCircle size={18} className="mr-2" />}
              onClick={() => setAssemblyModalOpen(true)}
            >
              Nueva Asamblea
            </Button>
            {activeAssembly?.is_active && (
              <Button
                block
                danger
                className="mt-2"
                icon={<XCircle size={18} className="mr-2" />}
                onClick={handleCloseAssembly}
                loading={loading}
              >
                Cerrar Asamblea
              </Button>
            )}
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
          extra={
            activeQuestion && (
              <Tag color="blue" className="flex items-center gap-2">
                <Clock size={14} />
                <span>Pregunta en curso {remainingTime ? `- Tiempo restante: ${remainingTime}` : ''}</span>
              </Tag>
            )
          }
        >
          {activeQuestion ? (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <Text
                  type="secondary"
                  className="block text-xs uppercase font-bold mb-1"
                >
                  Pregunta Activa
                </Text>
                <Title level={4} className="m-0">
                  {activeQuestion.question_text}
                </Title>
              </div>

              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="Votos Totales"
                    value={results?.total_votes || 0}
                    prefix={<BarChart2 size={16} />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Total Coeficiente"
                    value={totalCoefficient * 100}
                    prefix={<PieChart size={16} />}
                    suffix="%"
                    precision={2}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Estado"
                    value={activeQuestion.is_active ? 'Abierta' : 'Cerrada'}
                    styles={{ content: { color: activeQuestion.is_active ? '#3f8600' : '#cf1322' } }}
                  />
                </Col>
                {results && Object.entries(results.results).map(([option, votes]) => (
                  <Col span={8} key={option}>
                    <Statistic
                      title={option}
                      value={votes}
                      suffix={`(${results.total_votes > 0 ? ((votes / results.total_votes) * 100).toFixed(1) : 0}%)`}
                      valueStyle={{ fontSize: '1.2rem' }}
                    />
                  </Col>
                ))}
              </Row>

              <Table
                columns={columns}
                dataSource={tableData}
                pagination={false}
                size="small"
              />

              {results?.observations?.length > 0 && (
                <div className="mt-4">
                  <Text strong>Observaciones Recientes:</Text>
                  <List
                    className="mt-2 max-h-40 overflow-y-auto"
                    size="small"
                    bordered
                    dataSource={results.observations.slice(-5)}
                    renderItem={(item) => (
                      <List.Item>
                        <Text italic>"{item}"</Text>
                      </List.Item>
                    )}
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
                    description={
                      <div className="flex flex-col gap-1 mt-1">
                        <Text type="secondary" className="text-xs">
                          Inicio: {formatDate(item.created_at)}
                        </Text>
                        {item.end_time && (
                          <Text type="secondary" className="text-xs">
                            Fin: {formatDate(item.end_time)}
                          </Text>
                        )}
                      </div>
                    }
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
                      description={`${formatDate(item.created_at)} - ${JSON.parse(item.options).length} opciones`}
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
      <div className="flex justify-between items-center mb-4">
        <Title level={3} className="flex items-center m-0">
          Panel de Administración de Votaciones
        </Title>
        <div 
          onClick={() => setOnlineUsersModalOpen(true)}
          className="flex items-center text-blue-600 bg-blue-50 px-4 py-2 rounded-xl border border-blue-200 shadow-sm cursor-pointer hover:bg-blue-100 transition-colors"
        >
          <Users size={20} className="mr-2" />
          <span className="font-bold text-xl mr-2">{onlineCount}</span>
          <span className="text-sm font-medium text-blue-800 uppercase tracking-wide">En línea</span>
        </div>
      </div>

      <Modal
        title="Usuarios En Línea"
        open={onlineUsersModalOpen}
        onCancel={() => setOnlineUsersModalOpen(false)}
        footer={null}
      >
        <div className="max-h-96 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {onlineUsersList.length > 0 ? (
            onlineUsersList.map((user, idx) => (
              <div key={idx} className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3 shadow-sm">
                  <Users size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 truncate">
                    {user.first_name || ''} {user.last_name || ''}
                  </p>
                  <div className="flex flex-col text-xs">
                    <span className="text-gray-500 truncate">{user.email}</span>
                    <span className="text-gray-400 capitalize">{user.role}</span>
                  </div>
                </div>
                <div className="h-2 w-2 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No hay usuarios conectados en este momento.</p>
            </div>
          )}
        </div>
      </Modal>

      <Tabs
        defaultActiveKey="1"
        items={tabItems}
        size="large"
        className="bg-white p-6 rounded-xl shadow-md border"
        onChange={(key) => { if (key === '2') fetchHistory() }}
      />

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

      {/* Modal Lanzar Pregunta MODIFICADO */}
      <Modal
        title="Configurar Nueva Pregunta"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleLaunchQuestion} initialValues={{ options_list: [""], voting_type: 'nominal' }}>
          <Form.Item
            name="question_text"
            label="Texto de la Pregunta"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={3} placeholder="¿Aprueba usted el presupuesto?..." />
          </Form.Item>

          {/* Nuevo campo de selección de tipo de votación */}
          <Form.Item
            name="voting_type"
            label="Tipo de Votación"
            rules={[{ required: true, message: 'Por favor seleccione un tipo de votación' }]}
          >
            <Select placeholder="Seleccione el tipo de cálculo">
              <Option value="coefficient">Por Coeficiente</Option>
              <Option value="nominal">Nominal (1 voto por unidad)</Option>
            </Select>
          </Form.Item>

          <Form.List name="options_list">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Form.Item
                    label={index === 0 ? "Opciones de respuesta" : ""}
                    required={false}
                    key={field.key}
                    style={{ marginBottom: 8 }}
                  >
                    <Form.Item
                      {...field}
                      validateTrigger={['onChange', 'onBlur']}
                      noStyle
                    >
                      <Input 
                        placeholder={`Opción ${index + 1}`} 
                        style={{ width: fields.length > 1 ? '90%' : '100%' }}
                        onChange={(e) => {
                          if (index === fields.length - 1 && e.target.value.trim() !== "") {
                            add();
                          }
                        }}
                      />
                    </Form.Item>
                    {fields.length > 1 && (
                      <Trash2
                        className="inline-block ml-2 cursor-pointer text-red-500"
                        size={18}
                        onClick={() => remove(field.name)}
                      />
                    )}
                  </Form.Item>
                ))}
              </>
            )}
          </Form.List>

          <Row gutter={16} className="mt-4">
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
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="Votos Totales" value={historicalResults.total_votes} prefix={<BarChart2 size={16} />} />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="Total Coeficiente" 
                  value={historicalResults?.votes_detail 
                    ? historicalResults.votes_detail.reduce((acc, vote) => acc + (vote.coefficient || 0), 0) * 100
                    : 0
                  } 
                  suffix="%"
                  prefix={<PieChart size={16} />} 
                  precision={2}
                />
              </Col>
            </Row>
            <Table
              columns={[
                { title: 'Propiedad', dataIndex: 'property', key: 'property' },
                { title: 'Coeficiente', dataIndex: 'coefficient', key: 'coefficient' },
                { title: 'Opción', dataIndex: 'option', key: 'option' },
                { title: 'Hora', dataIndex: 'date', key: 'date', render: (text) => formatDate(text) }
              ]}
              dataSource={historicalResults?.votes_detail ? historicalResults.votes_detail.map((vote, index) => ({
                key: index,
                property: vote.property,
                coefficient: vote.coefficient,
                option: vote.option,
                date: vote.date
              })) : (historicalResults ? Object.entries(historicalResults.results).map(([option, votes]) => ({
                key: option,
                property: 'N/A',
                coefficient: 0,
                option,
                date: '',
                votes
              })) : [])}
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </div>
        ) : (
          <Spin size="large" className="flex justify-center p-10" />
        )}
      </Modal>
    </div>
  )
}

export default AdminVotingPanel