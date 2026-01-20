import React, { useState, useEffect } from 'react'
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Tag, 
  Space, 
  message, 
  Popconfirm,
  Card,
  Typography,
  InputNumber
} from 'antd'
import { 
  HomeOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined,
  SearchOutlined,
  GlobalOutlined
} from '@ant-design/icons'

import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

const { Title } = Typography

const TenantManagement = () => {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingTenant, setEditingTenant] = useState(null)
  const [form] = Form.useForm()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [searchText, setSearchText] = useState('')
  
  const { user: currentUser } = useAuth()

  // Cargar tenants
  const loadTenants = async (page = 1, search = '') => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: pagination.pageSize,
        search
      }
      
      const response = await api.get('/api/v1/tenants', { params })
      
      if (response.data) {
        setTenants(response.data.items)
        setPagination({
          ...pagination,
          current: response.data.page,
          total: response.data.total
        })
      }
    } catch (error) {
      console.error('Error loading tenants:', error)
      message.error('Error al cargar propiedades horizontales')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTenants()
  }, [])

  // Limpiar campos cuando se abre modal de nueva PH
  useEffect(() => {
    if (modalVisible && !editingTenant) {
      form.resetFields()
    }
  }, [modalVisible, editingTenant, form])

  // Manejar creación/edición de tenant
  const handleTenantSubmit = async (values) => {
    try {
      if (editingTenant) {
        // Actualizar
        const response = await api.put(`/api/v1/tenants/${editingTenant.id}`, values)
        if (response.data.success) {
          message.success('Propiedad horizontal actualizada correctamente')
        }
      } else {
        // Crear
        const response = await api.post('/api/v1/tenants', values)
        if (response.data.success) {
          message.success('Propiedad horizontal creada correctamente')
        }
      }
      setModalVisible(false)
      form.resetFields()
      setEditingTenant(null)
      loadTenants(pagination.current, searchText)
    } catch (error) {
      console.error('Error saving tenant:', error)
      message.error(error.response?.data?.detail || 'Error al guardar propiedad horizontal')
    }
  }

  const handleDeleteTenant = async (tenantId) => {
    try {
      await api.delete(`/api/v1/tenants/${tenantId}`)
      message.success('Propiedad horizontal desactivada correctamente')
      loadTenants(pagination.current, searchText)
    } catch (error) {
      message.error('Error al desactivar propiedad horizontal')
    }
  }

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space orientation="vertical" size={0}>
          <span className="font-medium">{text}</span>
          <span className="text-xs text-gray-500">Cod: {record.code}</span>
        </Space>
      )
    },
    {
      title: 'NIT',
      dataIndex: 'nit',
      key: 'nit',
    },
    {
      title: 'Contacto',
      key: 'contact',
      render: (text, record) => (
        <Space orientation="vertical" size={0}>
          <span className="text-sm">{record.email || 'N/A'}</span>
          <span className="text-xs text-gray-500">{record.phone || 'N/A'}</span>
        </Space>
      )
    },
    {
      title: 'Estado',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Activo' : 'Inactivo'}
        </Tag>
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
              setEditingTenant(record)
              form.setFieldsValue(record)
              setModalVisible(true)
            }} 
          />
          <Popconfirm
            title="¿Estás seguro de desactivar esta PH?"
            onConfirm={() => handleDeleteTenant(record.id)}
            okText="Sí"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger disabled={!record.is_active} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2}>Gestión de Propiedades Horizontales</Title>
          <span className="text-gray-500">Administra todos los conjuntos residenciales del sistema</span>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => {
            setEditingTenant(null)
            setModalVisible(true)
          }}
        >
          Nueva PH
        </Button>
      </div>

      <Card>
        <div className="mb-4 flex gap-4">
          <Input 
            placeholder="Buscar por nombre..." 
            prefix={<SearchOutlined />} 
            onChange={e => setSearchText(e.target.value)}
            onPressEnter={() => loadTenants(1, searchText)}
            style={{ maxWidth: 300 }}
          />
          <Button onClick={() => loadTenants(1, searchText)}>Buscar</Button>
        </div>

        <Table 
          columns={columns} 
          dataSource={tenants} 
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            onChange: (page) => loadTenants(page, searchText)
          }}
        />
      </Card>

      <Modal
        title={editingTenant ? "Editar PH" : "Nueva PH"}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleTenantSubmit}
          initialValues={{ is_active: true, currency: 'COP', interest_rate: 0.02 }}
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label="Nombre del Conjunto"
              rules={[{ required: true, message: 'El nombre es requerido' }]}
            >
              <Input prefix={<HomeOutlined />} />
            </Form.Item>
            <Form.Item
              name="code"
              label="Código Único"
              rules={[{ required: true, message: 'El código es requerido' }]}
            >
              <Input disabled={!!editingTenant} placeholder="EJ: VILLA_MERCEDES" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="nit" label="NIT">
              <Input />
            </Form.Item>
            <Form.Item name="email" label="Email de Contacto">
              <Input />
            </Form.Item>
          </div>

          <Form.Item name="address" label="Dirección">
            <Input />
          </Form.Item>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item name="phone" label="Teléfono">
              <Input />
            </Form.Item>
            <Form.Item name="currency" label="Moneda">
              <Input maxLength={3} />
            </Form.Item>
            <Form.Item name="interest_rate" label="Tasa de Interés Mora">
              <InputNumber step={0.01} min={0} max={1} style={{ width: '100%' }} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default TenantManagement
