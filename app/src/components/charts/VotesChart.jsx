import React, { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';

const VotesChart = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        // Simulation parameters
        const targetSi = 45;
        const targetNo = 5;
        const stabilizationSteps = 30; // Approx 1 minute with 2s interval (adjust for "10 mins" feel or speed up for demo)
        let currentStep = 0;

        // Initial empty state or start from 0
        const initialData = [];
        let currentSi = 0;
        let currentNo = 0;

        // Helper to generate next value with smooth logarithmic-like growth
        const getNextValue = (current, target, step, totalSteps) => {
            if (step >= totalSteps) return target; // Stabilize

            const progress = step / totalSteps;
            // Ease out cubic function for smooth approach to target
            const ease = 1 - Math.pow(1 - progress, 3);

            const nextPotential = Math.floor(target * ease);

            // Ensure we don't go backwards or jump too much (smoothness)
            // Allow small variance but keep trends
            const randomVariance = Math.random() > 0.5 ? 1 : 0;

            let nextVal = nextPotential + randomVariance;
            if (nextVal > target) nextVal = target;
            if (nextVal < current) nextVal = current; // Never decrease for cumulative votes

            return nextVal;
        };

        const interval = setInterval(() => {
            setData(prevData => {
                const now = new Date();
                currentStep++;

                currentSi = getNextValue(currentSi, targetSi, currentStep, stabilizationSteps);
                currentNo = getNextValue(currentNo, targetNo, currentStep, stabilizationSteps);

                const newEntry = {
                    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    si: currentSi,
                    no: currentNo,
                };

                // Keep last 30 data points for better visibility of the trend
                const newData = [...prevData, newEntry].slice(-30);
                return newData;
            });
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-[400px] w-full bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Resultados de Votación</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 60]} /> {/* Fixed domain to see the threshold clearly */}
                    <Tooltip />
                    <Legend />

                    <ReferenceLine
                        y={30}
                        label={{
                            value: "Umbral (30)",
                            position: "insideTopRight", // Opciones: 'insideLeft', 'insideRight', 'left', 'right', etc.
                            fill: 'grey',
                            fontSize: 16
                        }}
                        stroke="red"
                        strokeDasharray="3 3"
                    />

                    <Line
                        type="monotone"
                        dataKey="si"
                        name="Sí"
                        stroke="#10B981" // emerald-500 (Green)
                        activeDot={{ r: 8 }}
                        strokeWidth={3}
                        animationDuration={1000}
                        dot={false}
                    />
                    <Line
                        type="monotone"
                        dataKey="no"
                        name="No"
                        stroke="#EF4444" // red-500 (Red)
                        activeDot={{ r: 8 }}
                        strokeWidth={3}
                        animationDuration={1000}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default VotesChart;
