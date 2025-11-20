import React from 'react';
import type { WeightEntry } from '../types';
import { useAppContext } from '../App';

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
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Determine absolute date range from the full (chronologically sorted) data for accurate axis scaling
    const chronoSortedData = [...processedData].sort((a,b) => a.date.getTime() - b.date.getTime());
    const minDate = chronoSortedData[0].date;
    const maxDate = chronoSortedData[chronoSortedData.length - 1].date;
    const dateRange = maxDate.getTime() - minDate.getTime();

    const weights = processedData.map(d => d.weightKg);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const weightRange = maxWeight - minWeight;

    const getX = (date: Date) => {
        if (dateRange === 0) return padding.left + chartWidth / 2;
        const timeDiff = date.getTime() - minDate.getTime();
        const position = (timeDiff / dateRange) * chartWidth;
        // If descending, reverse the axis by subtracting the position from the total width
        if (sortOrder === 'desc') {
            return padding.left + chartWidth - position;
        }
        return padding.left + position;
    };

    const getY = (weight: number) => {
        if (weightRange === 0) return padding.top + chartHeight / 2;
        const relativeWeight = weight - minWeight;
        return padding.top + chartHeight - (relativeWeight / weightRange) * chartHeight;
    };
    
    // In case all weights are the same
    if (weightRange === 0) {
       const y = padding.top + chartHeight / 2;
       return (
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                 <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke={theme === 'light' ? "#2563eb" : "#3b82f6"} strokeWidth="2" />
                 {processedData.map((d, i) => (
                    <circle key={i} cx={getX(d.date)} cy={y} r="4" fill={theme === 'light' ? "#2563eb" : "#3b82f6"}>
                        <title>{`${d.date.toLocaleDateString()}: ${d.originalWeight.toFixed(1)} ${d.originalUnit}`}</title>
                    </circle>
                ))}
            </svg>
       )
    }

    const points = processedData.map(d => `${getX(d.date)},${getY(d.weightKg)}`).join(' ');

    const axisColor = theme === 'light' ? '#737373' : '#a3a3a3';
    const textColor = theme === 'light' ? '#525252' : '#a3a3a3';
    const lineColor = theme === 'light' ? '#2563eb' : '#3b82f6';

    const formatDate = (date: Date) => {
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
    };

    const firstDateLabel = sortOrder === 'asc' ? minDate : maxDate;
    const lastDateLabel = sortOrder === 'asc' ? maxDate : minDate;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto text-xs" aria-label="Weight history chart">
            {/* Y-Axis */}
            <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke={axisColor} />
            <text x={padding.left - 10} y={padding.top} dominantBaseline="middle" textAnchor="end" fill={textColor}>{`${maxWeight.toFixed(1)} kg`}</text>
            <text x={padding.left - 10} y={height - padding.bottom} dominantBaseline="middle" textAnchor="end" fill={textColor}>{`${minWeight.toFixed(1)} kg`}</text>
            
            {/* X-Axis */}
            <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke={axisColor} />
            <text x={padding.left} y={height - padding.bottom + 15} dominantBaseline="middle" textAnchor="start" fill={textColor}>{formatDate(firstDateLabel)}</text>
            <text x={width - padding.right} y={height - padding.bottom + 15} dominantBaseline="middle" textAnchor="end" fill={textColor}>{formatDate(lastDateLabel)}</text>

            {/* Data Line */}
            <polyline points={points} fill="none" stroke={lineColor} strokeWidth="2" />

            {/* Data Points and Tooltips */}
            {processedData.map((d, i) => (
                <circle key={i} cx={getX(d.date)} cy={getY(d.weightKg)} r="4" fill={lineColor} className="cursor-pointer">
                    <title>{`${d.date.toLocaleDateString()}: ${d.originalWeight.toFixed(1)} ${d.originalUnit}`}</title>
                </circle>
            ))}
        </svg>
    );
};