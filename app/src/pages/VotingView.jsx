import React, { useState } from 'react';
import { Card, Button, Radio, Space, Typography, Tag, Empty, Progress, Divider, Alert } from 'antd';
import { CheckSquareOutlined, CheckCircleOutlined, ClockCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const VotingView = () => {
  const [activePolls, setActivePolls] = useState([
    {
      id: 1,
      question: '¿Aprueba el presupuesto para la vigencia 2024?',
      description: 'Basado en el informe presentado por el consejo de administración el pasado 15 de marzo.',
      status: 'OPEN',
      hasVoted: false,
      options: ['SÍ', 'NO', 'ABSTENCIÓN'],
      endsAt: new Date(Date.now() + 3600000).toISOString()
    },
    {
      id: 2,
      question: 'Elección de Revisora Fiscal',
      description: 'Seleccione una de las candidatas propuestas para el periodo 2024-2025.',
      status: 'OPEN',
      hasVoted: true,
      selectedOption: 'Candidata B - Maria Lopez',
      options: ['Candidata A - Ana Perez', 'Candidata B - Maria Lopez', 'Voto en Blanco'],
      endsAt: new Date(Date.now() + 1800000).toISOString()
    }
  ]);

  const [selectedOptions, setSelectedOptions] = useState({});

  const handleVote = (pollId) => {
    const poll = activePolls.find(p => p.id === pollId);
    if (!selectedOptions[pollId]) {
      return;
    }
    
    // Simulación de voto
    const updatedPolls = activePolls.map(p => 
      p.id === pollId ? { ...p, hasVoted: true, selectedOption: selectedOptions[pollId] } : p
    );
    setActivePolls(updatedPolls);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <Title level={2} className="m-0">Votaciones y Asamblea</Title>
          <Text type="secondary">Participe activamente en las decisiones de su conjunto</Text>
        </div>
        <Tag color="blue" icon={<ClockCircleOutlined />} className="px-3 py-1">ASAMBLEA EN CURSO</Tag>
      </div>

      <Alert
        message="Participación Activa"
        description="Recuerde que su voto es fundamental para el quórum y la toma de decisiones. El voto es una vez por unidad privada."
        type="info"
        showIcon
        className="mb-8"
      />

      <div className="space-y-6">
        {activePolls.length === 0 ? (
          <Card className="text-center py-12">
            <Empty description="No hay votaciones activas en este momento" />
          </Card>
        ) : (
          activePolls.map(poll => (
            <Card 
              key={poll.id} 
              className={`shadow-md border-l-4 ${poll.hasVoted ? 'border-primary-500' : 'border-orange-500'}`}
              title={
                <div className="flex justify-between items-center py-2">
                  <span className="text-lg font-semibold whitespace-normal">{poll.question}</span>
                  {poll.hasVoted ? (
                    <Tag icon={<CheckCircleOutlined />} color="success">VOTO REGISTRADO</Tag>
                  ) : (
                    <Tag icon={<ClockCircleOutlined />} color="warning">PENDIENTE</Tag>
                  )}
                </div>
              }
            >
              <Paragraph className="text-gray-600 mb-6">{poll.description}</Paragraph>
              
              {!poll.hasVoted ? (
                <div className="space-y-6">
                  <Divider orientation="left" plain>Opciones de Voto</Divider>
                  <Radio.Group 
                    className="w-full"
                    onChange={(e) => setSelectedOptions({ ...selectedOptions, [poll.id]: e.target.value })}
                    value={selectedOptions[poll.id]}
                  >
                    <Space direction="vertical" className="w-full">
                      {poll.options.map(opt => (
                        <Card hoverable size="small" className={`w-full transition-all ${selectedOptions[poll.id] === opt ? 'border-primary-500 bg-primary-50' : ''}`}>
                          <Radio value={opt} className="w-full py-2">
                            <span className="text-base">{opt}</span>
                          </Radio>
                        </Card>
                      ))}
                    </Space>
                  </Radio.Group>
                  <div className="flex justify-end pt-4">
                    <Button 
                      type="primary" 
                      size="large" 
                      icon={<CheckSquareOutlined />} 
                      disabled={!selectedOptions[poll.id]}
                      onClick={() => handleVote(poll.id)}
                      className="px-8"
                    >
                      Enviar Voto
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 p-6 rounded-lg text-center border border-green-100">
                  <div className="mb-4">
                    <Text type="secondary">Usted votó por:</Text>
                    <div className="text-xl font-bold text-green-700 mt-1">{poll.selectedOption}</div>
                  </div>
                  <Text type="secondary" className="text-xs">Identificador de voto: {Math.random().toString(36).substring(7).toUpperCase()}</Text>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      <div className="mt-12 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
        <Title level={4} icon={<InfoCircleOutlined />}>Información Técnica</Title>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            <Text strong>Quórum Actual:</Text>
            <Progress percent={68} status="active" strokeColor="#0284c7" />
            <Text type="secondary" className="text-xs">Requerido: 51% para toma de decisiones normales.</Text>
          </div>
          <div className="flex flex-col justify-center">
            <Text>Su unidad tiene un coeficiente de:</Text>
            <Text strong className="text-lg">0.825%</Text>
            <Text type="secondary" className="text-xs">El sistema calcula su voto ponderado automáticamente.</Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotingView;
