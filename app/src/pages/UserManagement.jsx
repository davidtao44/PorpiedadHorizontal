import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Tooltip,
  Typography
} from 'antd'
import { 
  UserOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SafetyCertificateOutlined,
  PlusOutlined,
  SearchOutlined
} from '@ant-design/icons'

import api, { rolesService } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { USER_ROLES, ROLE_DISPLAY_NAMES, ROLE_HIERARCHY } from '../constants/roleConstants'

const { Option } = Select
const { Title } = Typography

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [rolesModalVisible, setRolesModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [selectedUserForRoles, setSelectedUserForRoles] = useState(null)
  const [form] = Form.useForm()
  const [rolesForm] = Form.useForm()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [searchText, setSearchText] = useState('')
  
  const { user: currentUser, getHighestLevel } = useAuth()
  const navigate = useNavigate()
  const myLevel = getHighestLevel()

  // Cargar usuarios
  const loadUsers = async (page = 1, search = '') => {
    setLoading(true)
    try {
      const params = {
        page,
        size: pagination.pageSize,
        search
      }
      
      const response = await api.get('/api/v1/users', { params })
      
      if (response.data) {
        setUsers(response.data.items)
        setPagination({
          ...pagination,
          current: response.data.page,
          total: response.data.total
        })
      }
    } catch (error) {
      console.error('Error loading users:', error)
      message.error('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // Limpiar campos cuando se abre modal de nuevo usuario
  useEffect(() => {
    if (modalVisible && !editingUser) {
      form.resetFields()
    }
  }, [modalVisible, editingUser, form])

  // Limpiar campos cuando se abre modal de roles
  useEffect(() => {
    if (rolesModalVisible) {
      rolesForm.resetFields()
    }
  }, [rolesModalVisible, rolesForm])

  // Manejar creación/edición de usuario
  const handleUserSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        username: values.email // El backend espera 'username'
      }
      
      if (editingUser) {
        // Actualizar
        const response = await api.put(`/api/v1/users/${editingUser.id}`, payload)
        if (response.data.success) {
          message.success('Usuario actualizado correctamente')
        }
      } else {
        // Crear
        const response = await api.post('/api/v1/users', payload)
        if (response.data.success) {
          message.success('Usuario creado correctamente')
        }
      }
      setModalVisible(false)
      form.resetFields()
      setEditingUser(null)
      loadUsers(pagination.current, searchText)
    } catch (error) {
      console.error('Error saving user:', error)
      message.error(error.response?.data?.detail || 'Error al guardar usuario')
    }
  }

  // Manejar asignación de rol
  const handleRoleAssign = async (values) => {
    try {
      const { role, tenant_id } = values
      await rolesService.assignRole(selectedUserForRoles.id, role, tenant_id)
      message.success(`Rol ${role} asignado correctamente`)
      setRolesModalVisible(false)
      rolesForm.resetFields()
      loadUsers(pagination.current, searchText) // Recargar para ver actualización
    } catch (error) {
      console.error('Error assigning role:', error)
      message.error(error.response?.data?.detail || 'Error al asignar rol')
    }
  }

  // Manejar revocación de rol
  const handleRoleRevoke = async (userId, role, tenantId) => {
    try {
      await rolesService.revokeRole(userId, role, tenantId)
      message.success(`Rol revocado correctamente`)
      loadUsers(pagination.current, searchText)
    } catch (error) {
      console.error('Error revoking role:', error)
      message.error(error.response?.data?.detail || 'Error al revocar rol')
    }
  }

  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/api/v1/users/${userId}`)
      message.success('Usuario desactivado correctamente')
      loadUsers(pagination.current, searchText)
    } catch (error) {
      message.error('Error al desactivar usuario')
    }
  }

  const columns = [
    {
      title: 'Usuario',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => (
        <Space orientation="vertical" size={0}>
          <span className="font-medium">{text}</span>
          <span className="text-xs text-gray-500">{record.email}</span>
        </Space>
      )
    },
    {
      title: 'Nombre',
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
      title: 'Roles',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles, record) => (
        <Space wrap>
          {roles && roles.map(role => (
            <Tag color="blue" key={role} closable onClose={(e) => {
              e.preventDefault()
              handleRoleRevoke(record.id, role, record.tenant_id)
            }}>
              {ROLE_DISPLAY_NAMES[role] || role}
            </Tag>
          ))}
          <Button 
            type="dashed" 
            size="small" 
            icon={<PlusOutlined />} 
            onClick={() => {
              setSelectedUserForRoles(record)
              setRolesModalVisible(true)
            }}
          />
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
          <Tooltip title="Editar">
            <Button 
              icon={<EditOutlined />} 
              onClick={() => {
                setEditingUser(record)
                form.setFieldsValue(record)
                setModalVisible(true)
              }} 
            />
          </Tooltip>
          <Popconfirm
            title="¿Estás seguro de desactivar este usuario?"
            onConfirm={() => handleDeleteUser(record.id)}
            okText="Sí"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger disabled={!record.is_active} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  // Filtrar roles que el usuario actual puede asignar (solo inferiores a su nivel)
  const assignableRoles = Object.keys(USER_ROLES).filter(role => 
    ROLE_HIERARCHY[role] < myLevel
  )

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2}>Gestión de Usuarios</Title>
          <span className="text-gray-500">Administra usuarios y sus roles en el sistema</span>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => {
            setEditingUser(null)
            setModalVisible(true)
          }}
        >
          Nuevo Usuario
        </Button>
      </div>

      <Card>
        <div className="mb-4 flex gap-4">
          <Input 
            placeholder="Buscar por nombre o email..." 
            prefix={<SearchOutlined />} 
            onChange={e => setSearchText(e.target.value)}
            onPressEnter={() => loadUsers(1, searchText)}
            style={{ maxWidth: 300 }}
          />
          <Button onClick={() => loadUsers(1, searchText)}>Buscar</Button>
        </div>

        <Table 
          columns={columns} 
          dataSource={users} 
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            onChange: (page) => loadUsers(page, searchText)
          }}
        />
      </Card>

      <Modal
        title={editingUser ? "Editar Usuario" : "Nuevo Usuario"}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUserSubmit}
          initialValues={{ is_active: true }}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'El email es requerido' },
              { type: 'email', message: 'Email inválido' }
            ]}
          >
            <Input disabled={!!editingUser} prefix={<UserOutlined />} />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="Contraseña"
              rules={[
                { required: true, message: 'La contraseña es requerida' },
                { min: 6, message: 'Mínimo 6 caracteres' }
              ]}
            >
              <Input.Password />
            </Form.Item>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="first_name" label="Primer Nombre" rules={[{ required: true, message: 'Requerido' }]}>
              <Input placeholder="Ej: Juan" />
            </Form.Item>
            <Form.Item name="middle_name" label="Segundo Nombre">
              <Input placeholder="Ej: Alberto" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="last_name" label="Primer Apellido" rules={[{ required: true, message: 'Requerido' }]}>
              <Input placeholder="Ej: Pérez" />
            </Form.Item>
            <Form.Item name="second_last_name" label="Segundo Apellido">
              <Input placeholder="Ej: García" />
            </Form.Item>
          </div>

          {!editingUser && (
             <Form.Item name="role" label="Rol Inicial">
               <Select placeholder="Seleccionar rol">
                 {assignableRoles.map(role => (
                   <Option key={role} value={role}>
                     {ROLE_DISPLAY_NAMES[role]}
                   </Option>
                 ))}
               </Select>
             </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title={`Asignar Rol a ${selectedUserForRoles?.email}`}
        open={rolesModalVisible}
        onOk={() => rolesForm.submit()}
        onCancel={() => setRolesModalVisible(false)}
      >
        <Form
          form={rolesForm}
          layout="vertical"
          onFinish={handleRoleAssign}
        >
          <Form.Item
            name="role"
            label="Rol"
            rules={[{ required: true, message: 'Selecciona un rol' }]}
          >
            <Select placeholder="Seleccionar rol">
              {assignableRoles.map(role => (
                <Option key={role} value={role}>
                  {ROLE_DISPLAY_NAMES[role]}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="tenant_id"
            label="ID Tenant (Opcional)"
            tooltip="Dejar vacío para el tenant actual"
          >
            <Input type="number" placeholder="Ej: 1" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default UserManagement
