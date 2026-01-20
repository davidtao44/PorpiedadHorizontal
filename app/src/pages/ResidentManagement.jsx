import React, { useState, useEffect } from 'react'
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Tag, 
  Space, 
  message, 
  Popconfirm,
  Card,
  Typography,
  InputNumber,
  Row,
  Col,
  Divider,
  Switch
} from 'antd'
import { 
  UserOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined,
  SearchOutlined,
  HomeOutlined,
  IdcardOutlined
} from '@ant-design/icons'

import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

const { Option } = Select
const { Title, Text } = Typography

const ResidentManagement = () => {
  const [residents, setResidents] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingResident, setEditingResident] = useState(null)
  const [form] = Form.useForm()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [searchText, setSearchText] = useState('')
  
  const { user: currentUser } = useAuth()

  // Cargar residentes
  const loadResidents = async (page = 1, search = '') => {
    setLoading(true)
    try {
      const params = {
        page,
        size: pagination.pageSize,
        search
      }
      
      const response = await api.get('/api/v1/residents/', { params })
      
      if (response.data) {
        setResidents(response.data.items)
        setPagination({
          ...pagination,
          current: response.data.page,
          total: response.data.total
        })
      }
    } catch (error) {
      console.error('Error loading residents:', error)
      message.error('Error al cargar residentes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResidents()
  }, [])

  // Manejar creación/edición de copropietario y propiedad
  const handleResidentSubmit = async (values) => {
    try {
      setLoading(true)
      
      let propertyId = values.property_id

      // 1. Si no hay propertyId, o es una nueva propiedad, crearla
      if (!propertyId) {
        const propertyResponse = await api.post('/api/v1/properties/', {
          number: values.apartamento,
          tower: values.torre,
          unit: values.unidad,
          area: values.area,
          coefficient: values.coeficiente,
          is_active: true
        })
        propertyId = propertyResponse.data.data.id
      }

      // 2. Crear/Actualizar residente
      const residentPayload = {
        first_name: values.first_name,
        middle_name: values.middle_name,
        last_name: values.last_name,
        second_last_name: values.second_last_name,
        document_type: values.document_type || 'CC',
        document_number: values.document_number,
        email: values.email,
        phone: values.phone,
        property_id: propertyId,
        is_owner: true
      }

      if (editingResident) {
        await api.put(`/api/v1/residents/${editingResident.id}`, residentPayload)
        message.success('Copropietario actualizado correctamente')
      } else {
        const residentResponse = await api.post('/api/v1/residents/', residentPayload)
        const newResident = residentResponse.data.data
        message.success('Copropietario y Propiedad creados correctamente')

        // 3. Si se habilitó el acceso, crear el usuario
        if (values.enable_access && newResident) {
          try {
            await api.post('/api/v1/users/', {
              email: values.email,
              username: values.email,
              password: values.document_number,
              first_name: values.first_name,
              middle_name: values.middle_name,
              last_name: values.last_name,
              second_last_name: values.second_last_name,
              role: 'COPROPIETARIO',
              resident_id: newResident.id,
              tenant_id: currentUser.tenant_id,
              is_active: true
            })
            message.success('Usuario de acceso creado correctamente')
          } catch (userError) {
            console.error('Error creating user access:', userError)
            message.warning('Residente creado, pero falló la creación del usuario de acceso')
          }
        }
      }

      setModalVisible(false)
      form.resetFields()
      setEditingResident(null)
      loadResidents(pagination.current, searchText)
    } catch (error) {
      console.error('Error saving resident:', error)
      message.error(error.response?.data?.detail || 'Error al guardar copropietario')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Nombre Completo',
      key: 'fullname',
      render: (text, record) => {
        const parts = [
          record.first_name,
          record.middle_name,
          record.last_name,
          record.second_last_name
        ].filter(Boolean);
        return parts.length > 0 ? parts.join(' ') : 'N/A';
      }
    },
    {
      title: 'Cédula',
      dataIndex: 'document_number',
      key: 'document_number',
    },
    {
      title: 'Propiedad',
      key: 'property',
      render: (text, record) => record.property ? (
        <span>{record.property.number} {record.property.tower ? `(T: ${record.property.tower})` : ''}</span>
      ) : 'N/A'
    },
    {
      title: 'Correo',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Cuenta de Usuario',
      key: 'has_account',
      render: (text, record) => (
        record.user ? <Tag color="green">Activa</Tag> : <Tag color="default">Sin Acceso</Tag>
      )
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (text, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => {
              setEditingResident(record)
              const initialValues = {
                ...record,
                apartamento: record.property?.number,
                torre: record.property?.tower,
                unidad: record.property?.unit,
                area: record.property?.area,
                coeficiente: record.property?.coefficient
              }
              form.setFieldsValue(initialValues)
              setModalVisible(true)
            }} 
          />
          <Popconfirm
            title="¿Estás seguro de desactivar?"
            onConfirm={async () => {
              await api.delete(`/api/v1/residents/${record.id}`)
              loadResidents()
            }}
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2}>Gestión de Copropietarios</Title>
          <span className="text-gray-500">Administra residentes y sus unidades habitacionales</span>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => {
            setEditingResident(null)
            setModalVisible(true)
          }}
        >
          Nuevo Copropietario/Propiedad
        </Button>
      </div>

      <Card>
        <div className="mb-4 flex gap-4">
          <Input 
            placeholder="Buscar por nombre o cédula..." 
            prefix={<SearchOutlined />} 
            onChange={e => setSearchText(e.target.value)}
            onPressEnter={() => loadResidents(1, searchText)}
            style={{ maxWidth: 300 }}
          />
          <Button onClick={() => loadResidents(1, searchText)}>Buscar</Button>
        </div>

        <Table 
          columns={columns} 
          dataSource={residents} 
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            onChange: (page) => loadResidents(page, searchText)
          }}
        />
      </Card>

      <Modal
        title={editingResident ? "Editar Copropietario" : "Nuevo Copropietario y Propiedad"}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
        width={800}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleResidentSubmit}
          initialValues={{ document_type: 'CC', coeficiente: 1.0 }}
        >
          <Divider titlePlacement="left"><IdcardOutlined /> Información Personal</Divider>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="first_name" label="Primer Nombre" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="middle_name" label="Segundo Nombre">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="last_name" label="Primer Apellido" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="second_last_name" label="Segundo Apellido">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="document_type" label="Tipo Doc" rules={[{ required: true }]}>
                <Select>
                  <Option value="CC">Cédula de Ciudadanía</Option>
                  <Option value="CE">Cédula de Extranjería</Option>
                  <Option value="NIT">NIT</Option>
                  <Option value="PAS">Pasaporte</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="document_number" label="Cédula/NIT" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="Correo Electrónico" rules={[{ type: 'email' }]}>
                <Input prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement="left"><HomeOutlined /> Información de la Propiedad</Divider>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="torre" label="Torre" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="apartamento" label="Apartamento" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="unidad" label="Unidad">
                <Input placeholder="Opcional" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="area" label="Área (m2)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="coeficiente" label="Coeficiente">
                <InputNumber style={{ width: '100%' }} min={0} step={0.000001} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="phone" label="Teléfono">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="enable_access" 
                label="Habilitar Acceso de Usuario (App/Web)" 
                valuePropName="checked"
                extra="Se creará una cuenta usando el correo como usuario y la cédula como contraseña."
              >
                <Switch disabled={!!editingResident?.user} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default ResidentManagement
