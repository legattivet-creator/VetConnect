import React, { useState } from 'react';
import type { WeightEntry } from '../types';
import { useAppContext } from '../src/App';

type WeightChartProps = {
    data: WeightEntry[];
    sortOrder: 'asc' | 'desc';
};

const LB_TO_KG = 0.453592;
const GRAM_TO_KG = 0.001;

const getWeightInKg = (weight: number, unit: 'kg' | 'lb' | 'g'): number => {
    switch (unit) {
        case 'lb': return weight * LB_TO_KG;
        case 'g': return weight * GRAM_TO_KG;
        case 'kg':
        default: return weight;
    }
};

export const WeightChart: React.FC<WeightChartProps> = ({ data, sortOrder }) => {
    const { theme } = useAppContext();
    const [activePoint, setActivePoint] = useState<{ x: number, y: number, value: string, date: string } | null>(null);

    const processedData = data.map(entry => ({
        date: new Date(entry.date),
        weightKg: getWeightInKg(entry.weight, entry.unit),
        originalWeight: entry.weight,
        originalUnit: entry.unit,
    }));

    if (processedData.length < 2) {
        return null;
    }

    const width = 500;
    const height = 250;
    const padding = { top: 20, right: 30, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Sort chronologically for axis calculations
    const chronoSortedData = [...processedData].sort((a, b) => a.date.getTime() - b.date.getTime());
    const minDate = chronoSortedData[0].date;
    const maxDate = chronoSortedData[chronoSortedData.length - 1].date;
    const dateRange = maxDate.getTime() - minDate.getTime();

    const weights = processedData.map(d => d.weightKg);
    const actualMinWeight = Math.min(...weights);
    // User request: Y-axis 5 points lower than min value (ensure not negative)
    const minWeight = Math.max(0, actualMinWeight - 5);

    const actualMaxWeight = Math.max(...weights);
    // User request: Y-axis 10 points higher than max value
    const maxWeight = actualMaxWeight + 5;
    const weightRange = maxWeight - minWeight;

    // Determine reference lines
    // 1. Last inserted weight (chronologically last)
    const lastEntry = chronoSortedData[chronoSortedData.length - 1];

    // 2. Intermediate weight (middle index)
    // Only if we have at least 3 items to justify an "intermediate" separate from first/last
    const middleIndex = Math.floor((chronoSortedData.length - 1) / 2);
    const middleEntry = chronoSortedData.length >= 3 ? chronoSortedData[middleIndex] : null;

    // 3. Max weight entry
    const maxEntry = processedData.reduce((prev, current) => (prev.weightKg > current.weightKg) ? prev : current);

    // Filter unique values to avoid drawing lines on top of each other if last == max
    const uniqueRefLines = new Map();
    uniqueRefLines.set('last', { value: lastEntry.weightKg, label: 'Last' }); // Label not used but kept for structure logic if needed
    if (middleEntry && middleEntry !== lastEntry) {
        uniqueRefLines.set('middle', { value: middleEntry.weightKg, label: 'Middle' });
    }
    // Add max entry line
    // If max is substantially different from last (or identical, we might want to show it? Logic says "insert one more line for max")
    // Let's just add it. If it overlaps, it overlaps.
    uniqueRefLines.set('max', { value: maxEntry.weightKg, label: 'Max' });

    const referenceLines = Array.from(uniqueRefLines.values());

    const getX = (date: Date) => {
        if (dateRange === 0) return padding.left + chartWidth / 2;
        const timeDiff = date.getTime() - minDate.getTime();
        const position = (timeDiff / dateRange) * chartWidth;
        // If sortOrder passed is 'desc' (for list), the graph usually still goes Time -> Right.
        // But if the external sortOrder affects how points are connected, we should respect chrono order for X axis always.
        // We always plot time Left to Right.
        return padding.left + position;
    };

    const getY = (weight: number) => {
        if (weightRange === 0) return padding.top + chartHeight / 2;
        // Add 10% buffer to top/bottom if needed, but strict Min/Max requested?
        // User requested explicitly +10 on max.
        const relativeWeight = weight - minWeight;
        return padding.top + chartHeight - (relativeWeight / weightRange) * chartHeight;
    };

    // Correct Sort for Drawing Line: The line needs points in chronological order to flow left-to-right correctly
    // processedData might be in 'desc' or 'asc' from props. We used chronoSortedData for range.
    // Let's use chronoSortedData for the polyline to ensure it doesn't zig-zag.
    const points = chronoSortedData.map(d => `${getX(d.date)},${getY(d.weightKg)}`).join(' ');

    // User request: Y-axis lines color black
    const axisColor = '#000000';
    const textColor = theme === 'light' ? '#000000' : '#a3a3a3'; // Keep text adaptive or make axis text black too? 
    // "as linhas do eixo "Y" devem ser de cor preta" -> likely implies axis lines. Text usually matches axis.
    // Let's force black for axis relationships.
    const finalAxisColor = '#000000';
    const finalTextColor = '#000000';

    const lineColor = theme === 'light' ? '#2563eb' : '#3b82f6';
    const gridColor = '#000000'; // "linhas do eixo Y" -> could refer to grid/reference lines too? Let's make reference lines black too as requested.

    const formatDate = (date: Date) => {
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
    };

    // Interaction Handlers
    // Explicit click handler for points
    const handlePointClick = (e: React.MouseEvent<SVGCircleElement> | React.TouchEvent<SVGCircleElement>, dataPoint: any) => {
        e.stopPropagation(); // Prevent background click from firing
        setActivePoint({
            x: getX(dataPoint.date),
            y: getY(dataPoint.weightKg),
            value: `${dataPoint.originalWeight.toFixed(1)} ${dataPoint.originalUnit}`,
            date: formatDate(dataPoint.date)
        });
    };

    // Click anywhere else closes
    const handleDismiss = () => {
        setActivePoint(null);
    };

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto text-xs"
            aria-label="Weight history chart"
            onClick={handleDismiss}
        >
            {/* Y-Axis Line */}
            <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke={finalAxisColor} />

            {/* Min/Max Labels */}
            <text x={padding.left - 8} y={padding.top} dominantBaseline="middle" textAnchor="end" fill={finalTextColor} fontSize="10">{`${maxWeight.toFixed(1)} kg`}</text>
            <text x={padding.left - 8} y={height - padding.bottom} dominantBaseline="middle" textAnchor="end" fill={finalTextColor} fontSize="10">{`${minWeight.toFixed(1)} kg`}</text>

            {/* Reference Lines (Last & Middle & Max) */}
            {referenceLines.map((ref, idx) => (
                <g key={idx}>
                    <line
                        x1={padding.left}
                        y1={getY(ref.value)}
                        x2={width - padding.right}
                        y2={getY(ref.value)}
                        stroke={gridColor}
                        strokeDasharray="4,4"
                        strokeWidth="1"
                    />
                </g>
            ))}

            {/* X-Axis */}
            <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke={finalAxisColor} />
            <text x={padding.left} y={height - padding.bottom + 15} dominantBaseline="middle" textAnchor="start" fill={finalTextColor}>{formatDate(minDate)}</text>
            <text x={width - padding.right} y={height - padding.bottom + 15} dominantBaseline="middle" textAnchor="end" fill={finalTextColor}>{formatDate(maxDate)}</text>

            {/* Data Line */}
            <polyline points={points} fill="none" stroke={lineColor} strokeWidth="2" />

            {/* Data Points */}
            {chronoSortedData.map((d, i) => (
                <circle
                    key={i}
                    cx={getX(d.date)}
                    cy={getY(d.weightKg)}
                    r="6" // Increased click target size slightly (was 4)
                    fill={lineColor}
                    className="cursor-pointer transition-all hover:r-8" // Add hover effect
                    onClick={(e) => handlePointClick(e, d)}
                />
            ))}

            {/* Tooltip Active Point */}
            {activePoint && (
                <g onClick={(e) => e.stopPropagation()}>
                    <circle cx={activePoint.x} cy={activePoint.y} r="6" fill="white" stroke={lineColor} strokeWidth="2" />
                    <rect
                        x={activePoint.x - 40}
                        y={activePoint.y - 45}
                        width="80"
                        height="35"
                        rx="4"
                        fill="rgba(0,0,0,0.8)"
                    />
                    <text x={activePoint.x} y={activePoint.y - 30} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
                        {activePoint.value}
                    </text>
                    <text x={activePoint.x} y={activePoint.y - 18} textAnchor="middle" fill="#ccc" fontSize="9">
                        {activePoint.date}
                    </text>
                </g>
            )}
        </svg>
    );
};
