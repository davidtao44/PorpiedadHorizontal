import React, { useState, useEffect } from 'react';
import { Card, Tabs, Descriptions, Button, Form, Input, message, Spin, Alert, Tag, Space, Typography, Divider } from 'antd';
import { UserOutlined, HomeOutlined, EditOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { apiService } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const { Title, Text } = Typography;

const ResidentProfile = () => {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const { user } = useAuth();

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/api/v1/residents/me/profile');
      if (response.data.success) {
        setProfileData(response.data.data);
        form.setFieldsValue(response.data.data.resident || {});
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      message.error('No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleRequestChange = async (values) => {
    try {
      // Por cada campo modificado, enviamos una solicitud de cambio
      const changedFields = Object.keys(values).filter(key => values[key] !== profileData.resident[key]);
      
      if (changedFields.length === 0) {
        setIsEditing(false);
        return;
      }

      const promises = changedFields.map(field => 
        apiService.post('/api/v1/residents/me/change-requests', {
          field_name: field,
          old_value: String(profileData.resident[field] || ''),
          new_value: String(values[field])
        })
      );

      await Promise.all(promises);
      message.success('Solicitudes de cambio enviadas al administrador');
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error submitting change requests:', error);
      message.error('Error al enviar las solicitudes');
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Spin size="large" tip="Cargando perfil..." /></div>;

  const resident = profileData?.resident;
  const property = profileData?.property;

  const items = [
    {
      key: '1',
      label: (
        <span>
          <UserOutlined />
          Información Personal
        </span>
      ),
      children: (
        <Card className="shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <Title level={4}>Mis Datos</Title>
            {!isEditing ? (
              <Button type="primary" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>
                Solicitar Cambio
              </Button>
            ) : (
              <Space>
                <Button onClick={() => setIsEditing(false)}>Cancelar</Button>
                <Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()}>
                  Enviar Solicitud
                </Button>
              </Space>
            )}
          </div>
          
          <Alert
            message="Importante"
            description="Los cambios en tus datos personales deben ser aprobados por la administración para verse reflejados."
            type="info"
            showIcon
            className="mb-6"
          />

          <Form
            form={form}
            layout="vertical"
            onFinish={handleRequestChange}
            disabled={!isEditing}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item name="first_name" label="Nombres" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="last_name" label="Apellidos" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="email" label="Correo Electrónico" rules={[{ required: true, type: 'email' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="phone" label="Teléfono">
                <Input />
              </Form.Item>
              <Form.Item label="Tipo de Documento">
                <Input value={resident?.document_type} disabled />
              </Form.Item>
              <Form.Item label="Número de Documento">
                <Input value={resident?.document_number} disabled />
              </Form.Item>
            </div>
          </Form>
        </Card>
      ),
    },
    {
      key: '2',
      label: (
        <span>
          <HomeOutlined />
          Mi Propiedad
        </span>
      ),
      children: (
        <Card className="shadow-sm">
          {!property ? (
            <Alert message="No asociado" description="Tu usuario no tiene una propiedad vinculada aún." type="warning" showIcon />
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <Space direction="vertical" size={0}>
                  <Title level={4}>Propiedad: {property.number}</Title>
                  <Text type="secondary">{user?.tenant?.name || 'Conjunto Residencial'}</Text>
                </Space>
                <Tag color="green" className="px-3 py-1 text-sm">ACTIVA</Tag>
              </div>

              <Descriptions bordered column={{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }}>
                <Descriptions.Item label="Torre/Bloque">{property.tower || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Piso">{property.floor || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Unidad">{property.number}</Descriptions.Item>
                <Descriptions.Item label="Área">{property.area} m²</Descriptions.Item>
                <Descriptions.Item label="Coeficiente">{property.coefficient * 100}%</Descriptions.Item>
                <Descriptions.Item label="Estado">PROPIETARIO</Descriptions.Item>
              </Descriptions>

              <Divider />
              
              <Title level={5}>Ubicación</Title>
              <Text>{user?.tenant?.address}</Text>
            </>
          )}
        </Card>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Title level={2} className="m-0">Perfil de Copropietario</Title>
        <Button icon={<ReloadOutlined />} onClick={fetchProfile} />
      </div>
      
      <Tabs defaultActiveKey="1" items={items} size="large" />
    </div>
  );
};

export default ResidentProfile;
