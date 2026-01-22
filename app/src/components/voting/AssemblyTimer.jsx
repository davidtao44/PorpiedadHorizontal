import React, { useState, useEffect } from 'react'
import { Card, Typography } from 'antd'
import { Clock } from 'lucide-react'

const { Text } = Typography

const AssemblyTimer = ({ assembly }) => {
  const [elapsedTime, setElapsedTime] = useState('00:00:00')

  useEffect(() => {
    if (!assembly?.created_at || !assembly?.is_active) {
      setElapsedTime('00:00:00')
      return
    }

    const updateTimer = () => {
      let startTimeString = assembly.created_at
      if (!startTimeString.endsWith('Z') && !startTimeString.includes('+')) {
         startTimeString += 'Z'
      }

      const start = new Date(startTimeString).getTime()
      const now = new Date().getTime()
      const diff = now - start
      
      if (diff < 0) {
         setElapsedTime('00:00:00')
         return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setElapsedTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      )
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [assembly])

  if (!assembly) return null

  return (
    <Card className="mb-4 bg-indigo-50 border-indigo-100 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="text-center sm:text-left">
           <Text type="secondary" className="text-xs uppercase font-bold block mb-1">Asamblea Actual</Text>
           <div className="font-bold text-lg text-indigo-900 leading-tight">{assembly.name}</div>
        </div>
        <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm border border-indigo-100">
           <Clock size={18} className="text-indigo-500 mr-2" />
           <span className="font-mono text-xl font-bold text-indigo-600">{elapsedTime}</span>
        </div>
      </div>
    </Card>
  )
}

export default AssemblyTimer
