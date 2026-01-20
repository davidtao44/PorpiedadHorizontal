import React, { useState, useEffect } from 'react'
import { Table, Card, Tag, Typography, Descriptions, List, Divider } from 'antd'
import { RocketOutlined, SafetyCertificateOutlined } from '@ant-design/icons'

import { rolesService } from '../services/api'
import { ROLE_HIERARCHY } from '../constants/roleConstants'

const { Title, Paragraph } = Typography

const RoleManagement = () => {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedRowKeys, setExpandedRowKeys] = useState([])

  const loadRoles = async () => {
    setLoading(true)
    try {
      const response = await rolesService.listRoles()
      if (response.data) {
        // Ordenar por jerarquía
        const sortedRoles = response.data.sort((a, b) => b.level - a.level)
        setRoles(sortedRoles)
      }
    } catch (error) {
      console.error('Error loading roles:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRoles()
  }, [])

  const columns = [
    {
      title: 'Rol',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Nombre',
      dataIndex: 'display_name',
      key: 'display_name',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Nivel',
      dataIndex: 'level',
      key: 'level',
      sorter: (a, b) => a.level - b.level,
      render: (level) => <Tag color="orange">{level}</Tag>
    },
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
    }
  ]

  const expandedRowRender = (record) => {
    return (
      <Card title="Permisos Detallados" size="small" className="bg-gray-50">
        <List
          grid={{ gutter: 16, column: 4 }}
          dataSource={record.permissions}
          renderItem={item => (
            <List.Item>
              <Tag color="cyan" icon={<SafetyCertificateOutlined />}>
                {item}
              </Tag>
            </List.Item>
          )}
        />
      </Card>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2}><RocketOutlined /> Gestión de Roles y Permisos</Title>
        <Paragraph type="secondary">
          Vista general de los roles definidos en el sistema, su jerarquía y permisos asociados.
        </Paragraph>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={roles}
          rowKey="name"
          loading={loading}
          expandable={{
            expandedRowRender,
            expandedRowKeys,
            onExpand: (expanded, record) => {
              setExpandedRowKeys(expanded ? [record.name] : [])
            }
          }}
          pagination={false}
        />
      </Card>

      <div className="mt-8">
        <Title level={4}>Jerarquía del Sistema</Title>
        <Divider />
        <div className="flex flex-col gap-2">
          {roles.map(role => (
             <div key={role.name} className="flex items-center gap-4" style={{ paddingLeft: `${(100 - role.level) / 2}px` }}>
               <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
               <span className="font-bold">{role.display_name}</span>
               <span className="text-gray-400 text-sm">(Nivel {role.level})</span>
             </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RoleManagement
