import React, { useState, useEffect } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';

const AttendanceChart = () => {
    const [data, setData] = useState([]);
    const [maxCapacity, setMaxCapacity] = useState(200);

    useEffect(() => {
        // Reset simulation when capacity changes
        const steps = 30;
        let currentStep = 0;
        let currentAttendees = 0;

        // Initial mock history
        const initialData = [];

        // Helper to generate growth based on ease-out to simulate filling up
        // but always respecting the max
        const getNextAttendees = (currentVal, max, step) => {
            // Target is to reach about 80-90% of capacity eventually or full
            const target = max * 0.95;

            // Dynamic growth rate based on how far we are
            const remaining = target - currentVal;
            let growth = 0;

            if (remaining > 0) {
                // Grow faster at beginning, slower at end
                growth = Math.ceil(remaining * 0.1);
                if (growth < 1 && Math.random() > 0.5) growth = 1; // Slow trickle at end
            }

            // Add randomness
            const jitter = Math.floor(Math.random() * 3);

            let nextVal = currentVal + growth + (Math.random() > 0.8 ? jitter : 0);
            if (nextVal > max) nextVal = max;

            return nextVal;
        };

        // Start simulation
        const interval = setInterval(() => {
            currentStep++;
            setData(prevData => {
                const now = new Date();

                // If it's the very first point or reset, start fresh
                const lastVal = prevData.length > 0 ? prevData[prevData.length - 1].asistentes : 0;

                // If maxCapacity changed drastically downwards, we need to clamp immediately
                let effectiveLastVal = lastVal;
                if (effectiveLastVal > maxCapacity) effectiveLastVal = maxCapacity;

                const newAttendees = getNextAttendees(effectiveLastVal, maxCapacity, currentStep);

                const newEntry = {
                    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    asistentes: newAttendees,
                };

                // Keep last 20
                return [...prevData, newEntry].slice(-20);
            });
        }, 2000);

        return () => clearInterval(interval);
    }, [maxCapacity]);

    const handleCapacityChange = (e) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val) && val > 0) {
            setMaxCapacity(val);
            setData([]); // Clear data to restart simulation visually
        }
    };

    return (
        <div className="h-[500px] w-full bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Registro de Asistentes</h3>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Capacidad Máxima:</label>
                    <input
                        type="number"
                        value={maxCapacity}
                        onChange={handleCapacityChange}
                        className="w-24 rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-1 border"
                    />
                </div>
            </div>

            <ResponsiveContainer width="100%" height="85%">
                <AreaChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, dataMax => Math.max(dataMax, maxCapacity)]} />
                    <Tooltip />
                    <Legend />
                    <ReferenceLine y={maxCapacity} stroke="red" strokeDasharray="3 3" label="Máximo" />

                    <Area
                        type="monotone"
                        dataKey="asistentes"
                        name="Asistentes Presentes"
                        stroke="#10B981" // emerald-500
                        fill="#10B981"
                        fillOpacity={0.3}
                        animationDuration={500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AttendanceChart;
