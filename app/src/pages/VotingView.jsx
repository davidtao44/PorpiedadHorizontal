import React, { useState, useEffect } from 'react'
import { Layout, Typography, Spin, Empty, Card, Alert, Breadcrumb } from 'antd'
import { Vote, ShieldAlert, Users } from 'lucide-react'
import { votingService } from '../services/api'
import UserVotingCard from '../components/voting/UserVotingCard'
import AdminVotingPanel from '../components/voting/AdminVotingPanel'

const { Content } = Layout
const { Title, Text, Paragraph } = Typography

const VotingView = () => {
  const [loading, setLoading] = useState(true)
  const [activeQuestion, setActiveQuestion] = useState(null)
  const [error, setError] = useState(null)
  
  // Obtener info del usuario localmente para permisos rápidos
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin = user.is_admin || user.role === 'admin'

  const fetchActiveVoting = async () => {
    try {
      setLoading(true)
      const response = await votingService.getActiveVoting()
      if (response.success) {
        setActiveQuestion(response.data)
      } else {
        setError(response.message)
      }
    } catch (err) {
      console.error('Error fetching active voting:', err)
      setError('Error al conectar con el servidor de votaciones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActiveVoting()
    // Polling cada 30 segundos si no hay pregunta activa para el usuario
    const interval = setInterval(() => {
      if (!isAdmin && !activeQuestion) fetchActiveVoting()
    }, 30000)
    return () => clearInterval(interval)
  }, [isAdmin, activeQuestion])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <Breadcrumb items={[
          { title: 'Dashboard' },
          { title: 'Votación' }
        ]} />
        <div className="flex items-center mt-2">
          <div className="bg-indigo-600 p-2 rounded-lg mr-4">
            <Vote className="text-white h-6 w-6" />
          </div>
          <div>
            <Title level={2} className="m-0">Módulo de Votación</Title>
            <Text type="secondary">Participe en las decisiones de su conjunto residencial</Text>
          </div>
        </div>
      </div>

      <Content>
        {isAdmin ? (
          /* VISTA ADMINISTRADOR */
          <div className="space-y-6">
            <Alert
              title="Modo Administrador"
              description="Como administrador, puedes gestionar las asambleas, lanzar preguntas y ver los resultados en tiempo real."
              type="info"
              showIcon
              icon={<ShieldAlert size={20} />}
              className="mb-6"
            />
            <AdminVotingPanel />
          </div>
        ) : (
          /* VISTA USUARIO RESIDENTE */
          <div className="max-w-2xl mx-auto">
            {loading ? (
              <Card className="flex justify-center items-center py-20">
                <Spin size="large">
                  <div className="mt-4 text-indigo-600">Buscando votaciones activas...</div>
                </Spin>
              </Card>
            ) : activeQuestion ? (
              <UserVotingCard 
                question={activeQuestion} 
                onVoteSuccess={() => fetchActiveVoting()} 
              />
            ) : (
              <Card className="text-center py-16 shadow-sm border-dashed">
                <Users className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <Title level={4} className="text-gray-500">No hay votaciones activas</Title>
                <Paragraph className="text-gray-400 max-w-sm mx-auto">
                  {error || "No estás en tiempo para responder preguntas, esperando al administrador."}
                </Paragraph>
              </Card>
            )}
          </div>
        )}
      </Content>
    </div>
  )
}

export default VotingView
