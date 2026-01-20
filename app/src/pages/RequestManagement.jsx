import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Button, Modal, Input, message, Space, Typography, Badge } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { apiService } from '../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

const RequestManagement = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchRequests = async (page = 1) => {
    setLoading(true);
    try {
      const response = await apiService.get(`/api/v1/residents/admin/requests?page=${page}&size=${pagination.pageSize}`);
      if (response.data) {
        setRequests(response.data.items);
        setPagination({
          ...pagination,
          current: page,
          total: response.data.total
        });
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      message.error('No se pudieron cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (status) => {
    if (!selectedRequest) return;

    try {
      const response = await apiService.put(`/api/v1/residents/admin/requests/${selectedRequest.id}`, {
        status,
        admin_notes: adminNotes
      });

      if (response.data.success) {
        message.success(`Solicitud ${status === 'APPROVED' ? 'aprobada' : 'rechazada'} correctamente`);
        setIsModalOpen(false);
        setAdminNotes('');
        fetchRequests(pagination.current);
      }
    } catch (error) {
      console.error('Error updating request:', error);
      message.error('Error al procesar la solicitud');
    }
  };

  const columns = [
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: 'Campo',
      dataIndex: 'field_name',
      key: 'field_name',
      render: (text) => <Tag color="blue">{text.toUpperCase()}</Tag>,
    },
    {
      title: 'Valor Anterior',
      dataIndex: 'old_value',
      key: 'old_value',
      render: (text) => <Text delete type="secondary">{text || '(vacío)'}</Text>,
    },
    {
      title: 'Valor Nuevo',
      dataIndex: 'new_value',
      key: 'new_value',
      render: (text) => <Text strong type="success">{text}</Text>,
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = { PENDING: 'orange', APPROVED: 'green', REJECTED: 'red' };
        return <Tag color={colors[status]}>{status}</Tag>;
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => {
              setSelectedRequest(record);
              setAdminNotes(record.admin_notes || '');
              setIsModalOpen(true);
            }}
          >
            Ver Detalle
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Gestión de Solicitudes</Title>
        <Button icon={<ReloadOutlined />} onClick={() => fetchRequests(pagination.current)}>Actualizar</Button>
      </div>

      <Card className="shadow-sm">
        <Table 
          columns={columns} 
          dataSource={requests} 
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            onChange: (page) => fetchRequests(page)
          }}
        />
      </Card>

      <Modal
        title="Detalle de Solicitud de Cambio"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        {selectedRequest && (
          <div className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Text type="secondary">Campo a modificar:</Text>
                <div className="mt-1"><Tag color="blue">{selectedRequest.field_name.toUpperCase()}</Tag></div>
              </div>
              <div>
                <Text type="secondary">Estado actual:</Text>
                <div className="mt-1"><Tag color="orange">{selectedRequest.status}</Tag></div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <div className="mb-4">
                <Text strong>De:</Text>
                <div className="mt-1 text-gray-500 delete">{selectedRequest.old_value || '(Sin datos)'}</div>
              </div>
              <div>
                <Text strong>A:</Text>
                <div className="mt-1 font-medium text-green-700">{selectedRequest.new_value}</div>
              </div>
            </div>

            <div>
              <Text strong>Notas del Administrador:</Text>
              <TextArea 
                rows={4} 
                className="mt-2"
                placeholder="Indique el motivo de la decisión..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                disabled={selectedRequest.status !== 'PENDING'}
              />
            </div>

            {selectedRequest.status === 'PENDING' && (
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  danger 
                  icon={<CloseOutlined />} 
                  onClick={() => handleUpdateStatus('REJECTED')}
                >
                  Rechazar
                </Button>
                <Button 
                  type="primary" 
                  icon={<CheckOutlined />} 
                  onClick={() => handleUpdateStatus('APPROVED')}
                >
                  Aprobar
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RequestManagement;
