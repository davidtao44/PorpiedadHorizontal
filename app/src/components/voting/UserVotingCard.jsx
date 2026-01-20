import React, { useState, useEffect, useRef } from 'react'
import { Card, Button, Radio, Progress, Alert, Divider, Space, Typography, message } from 'antd'
import { Clock, Send, X, CheckCircle } from 'lucide-react'
import { votingService } from '../../services/api'

const { Title, Text, Paragraph } = Typography

const UserVotingCard = ({ question, onVoteSuccess }) => {
  const [selectedOption, setSelectedOption] = useState(null)
  const [observations, setObservations] = useState('')
  const [countdown, setCountdown] = useState(5)
  const [isCounting, setIsCounting] = useState(false)
  const [voted, setVoted] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const timerRef = useRef(null)

  // Calcular tiempo restante para la pregunta (HH:mm:ss)
  useEffect(() => {
    const updateQuestionTimer = () => {
      if (!question.end_time) return
      
      const now = new Date()
      const end = new Date(question.end_time)
      const diff = end - now

      if (diff <= 0) {
        setTimeLeft('Finalizado')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      )
    }

    const interval = setInterval(updateQuestionTimer, 1000)
    updateQuestionTimer()
    return () => clearInterval(interval)
  }, [question])

  // Lógica de los 5 segundos de espera/cancelar
  useEffect(() => {
    if (isCounting) {
      if (countdown > 0) {
        timerRef.current = setTimeout(() => {
          setCountdown(prev => prev - 1)
        }, 1000)
      } else {
        handleFinalSubmit()
      }
    }
    return () => clearTimeout(timerRef.current)
  }, [isCounting, countdown])

  const handleStartSubmit = () => {
    if (!selectedOption) {
      message.warning('Por favor selecciona una opción')
      return
    }
    setIsCounting(true)
    setCountdown(5)
  }

  const handleCancelSubmit = () => {
    setIsCounting(false)
    clearTimeout(timerRef.current)
    setCountdown(5)
  }

  const handleFinalSubmit = async () => {
    setIsCounting(false)
    try {
      const response = await votingService.submitVote({
        question_id: question.id,
        selected_option: selectedOption,
        observations: observations
      })
      if (response.success) {
        setVoted(true)
        message.success('Tu voto ya ha sido registrado')
        if (onVoteSuccess) onVoteSuccess()
      }
    } catch (error) {
      message.error(error.message || 'Error al enviar el voto')
    }
  }

  const options = JSON.parse(question.options || '[]')

  if (voted) {
    return (
      <Card className="text-center py-8">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
        <Title level={3}>¡Voto Registrado!</Title>
        <Paragraph>Muchas gracias. Su participación es fundamental para la asamblea.</Paragraph>
        <Text type="secondary">Tu voto ya ha sido registrado</Text>
      </Card>
    )
  }

  return (
    <Card 
      title={
        <div className="flex justify-between items-center">
          <span>Pregunta de Asamblea</span>
          <Space className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-sm font-mono border border-indigo-100">
            <Clock size={16} />
            {timeLeft}
          </Space>
        </div>
      }
      className="shadow-md"
    >
      <Title level={4} className="mb-6">{question.question_text}</Title>
      
      <Radio.Group 
        onChange={(e) => setSelectedOption(e.target.value)} 
        value={selectedOption}
        disabled={isCounting}
        className="w-full"
      >
        <Space orientation="vertical" className="w-full">
          {options.map((opt, index) => (
            <Card 
              key={index} 
              size="small" 
              hoverable={!isCounting}
              onClick={() => !isCounting && setSelectedOption(opt)}
              className={`mb-2 cursor-pointer transition-all ${selectedOption === opt ? 'border-indigo-500 bg-indigo-50 shadow-sm' : ''}`}
            >
              <Radio value={opt}>{opt}</Radio>
            </Card>
          ))}
        </Space>
      </Radio.Group>

      {question.allow_observations && (
        <div className="mt-6">
          <Text strong>Observaciones (Opcional):</Text>
          <textarea
            disabled={isCounting}
            className="w-full p-3 mt-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            rows={3}
            placeholder="Añade un comentario sobre tu voto..."
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
          />
        </div>
      )}

      <Divider />

      {isCounting ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Text type="secondary">Enviando respuesta automáticamente en...</Text>
            <Title level={2} className="m-0 text-indigo-600 tabular-nums">{countdown}s</Title>
          </div>
          <Progress 
            percent={((5 - countdown) / 5) * 100} 
            showInfo={false} 
            strokeColor="#4f46e5"
            status="active"
          />
          <Button 
            block 
            danger 
            size="large" 
            onClick={handleCancelSubmit}
            icon={<X size={18} className="mr-2" />}
            className="flex items-center justify-center"
          >
            Cancelar
          </Button>
        </div>
      ) : (
        <Button 
          type="primary" 
          block 
          size="large" 
          onClick={handleStartSubmit}
          disabled={!selectedOption}
          icon={<Send size={18} className="mr-2" />}
          className="bg-indigo-600 h-12 flex items-center justify-center font-medium"
        >
          Enviar respuesta
        </Button>
      )}
    </Card>
  )
}

export default UserVotingCard
