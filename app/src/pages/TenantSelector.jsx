import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Typography, Spin, message, Button, Layout } from 'antd'
import { HomeOutlined, ArrowRightOutlined, BankOutlined } from '@ant-design/icons'
import { authService } from '../services/api'
import { useAuth } from '../hooks/useAuth'

const { Title, Text } = Typography
const { Content } = Layout

const TenantSelector = () => {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await authService.getMyTenants()
        if (response.success) {
          setTenants(response.data)
        }
      } catch (error) {
        console.error('Error fetching tenants:', error)
        message.error('Error al cargar las propiedades horizontales')
      } finally {
        setLoading(false)
      }
    }

    fetchTenants()
  }, [])

  const handleSelectTenant = async (tenantId) => {
    setSwitching(true)
    try {
      const response = await authService.switchTenant(tenantId)
      if (response.success) {
        message.success(`Bienvenido a ${response.data.tenant.name}`)
        navigate('/')
      }
    } catch (error) {
      console.error('Error switching tenant:', error)
      message.error('No se pudo seleccionar la propiedad')
    } finally {
      setSwitching(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spin size="large" tip="Cargando propiedades..." />
      </div>
    )
  }

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Content className="p-8 max-w-6xl mx-auto w-full">
        <div className="text-center mb-12 mt-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/LOGOPAGINA.webp" 
              alt="Logo" 
              className="h-20 w-auto"
            />
          </div>
          <Title level={2}>Bienvenido, {user?.first_name || 'Usuario'}</Title>
          <Text type="secondary" className="text-lg">
            Por favor, seleccione la Propiedad Horizontal que desea gestionar hoy.
          </Text>
        </div>

        <Row gutter={[24, 24]} justify="center">
          {tenants.map((tenant) => (
            <Col xs={24} sm={12} md={8} lg={6} key={tenant.id}>
              <Card
                hoverable
                className="h-full border-2 hover:border-indigo-500 transition-all duration-300 shadow-sm"
                cover={
                  <div className="h-40 bg-indigo-50 flex items-center justify-center text-indigo-500">
                    <BankOutlined style={{ fontSize: '64px' }} />
                  </div>
                }
                onClick={() => !switching && handleSelectTenant(tenant.id)}
              >
                <Card.Meta
                  title={<Title level={4} className="m-0 mb-2 truncate">{tenant.name}</Title>}
                  description={
                    <div className="flex flex-col gap-2">
                      <Text type="secondary">Cód: {tenant.code}</Text>
                      <Button 
                        type="primary" 
                        block 
                        icon={<ArrowRightOutlined />}
                        loading={switching}
                        className="mt-4 bg-indigo-600 hover:bg-indigo-700"
                      >
                        Gestionar
                      </Button>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>

        {tenants.length === 0 && (
          <div className="text-center mt-12">
            <Text type="danger" className="text-lg">
              No tiene propiedades horizontales asignadas. Contacte al administrador.
            </Text>
            <div className="mt-6">
              <Button onClick={() => authService.logout()}>Cerrar Sesión</Button>
            </div>
          </div>
        )}
      </Content>
    </Layout>
  )
}

export default TenantSelector
