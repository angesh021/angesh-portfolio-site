import React, { useEffect, useRef } from 'react';
import { motion, useSpring } from 'framer-motion';
import { Skeleton } from '../../ui/Skeleton';

interface DonutChartProps {
    isLoading: boolean;
    data: { label: string; value: number; color: string }[];
    onFilterChange: (filter: string) => void;
    activeFilter: string;
}

const AnimatedCounter = ({ value }: { value: number }) => {
    const ref = useRef<HTMLDivElement>(null);
    const spring = useSpring(0, { mass: 0.8, stiffness: 100, damping: 15 });

    useEffect(() => {
        spring.set(value);
    }, [value, spring]);

    useEffect(() => {
        const unsubscribe = spring.on("change", (latest) => {
            if (ref.current) {
                ref.current.textContent = Math.round(latest).toLocaleString();
            }
        });
        return () => unsubscribe();
    }, [spring]);

    return <div ref={ref} className="donut-chart-total">0</div>;
};

const SkeletonDonutChart: React.FC = () => (
    <div className="donut-chart-container flex items-center justify-between gap-4 h-full">
        <div className="donut-chart relative flex-shrink-0 flex items-center justify-center p-4">
             <Skeleton variant="circular" className="w-[120px] h-[120px]" />
        </div>
        <div className="chart-legend w-full flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="legend-item flex items-center gap-2">
                    <Skeleton variant="circular" className="w-3 h-3 flex-shrink-0" />
                    <Skeleton className="w-16 h-4" variant="text" />
                    <Skeleton className="w-10 h-4 ml-auto" variant="text" />
                </div>
            ))}
        </div>
    </div>
);


const DonutChart: React.FC<DonutChartProps> = ({ isLoading, data, onFilterChange, activeFilter }) => {
    if (isLoading) {
        return <SkeletonDonutChart />;
    }

    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);

    let accumulatedPercentage = 0;

    return (
        <div className="donut-chart-container">
            <div className="donut-chart">
                <svg width="150" height="150" viewBox="0 0 150 150">
                    <circle cx="75" cy="75" r={radius} fill="transparent" stroke="var(--dash-sidebar-bg)" strokeWidth="15" />
                    {data.map((item, index) => {
                        const percentage = totalValue > 0 ? item.value / totalValue : 0;
                        const offset = -circumference * accumulatedPercentage;
                        accumulatedPercentage += percentage;
                        return (
                            <motion.circle
                                key={item.label}
                                cx="75" cy="75" r={radius} fill="transparent"
                                stroke={item.color} strokeWidth="15"
                                strokeDasharray={`${circumference * percentage} ${circumference * (1 - percentage)}`}
                                strokeDashoffset={offset}
                                transform="rotate(-90 75 75)"
                                initial={{ strokeDasharray: `0 ${circumference}` }}
                                animate={{ strokeDasharray: `${circumference * percentage} ${circumference * (1 - percentage)}` }}
                                transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                            />
                        )
                    })}
                </svg>
                <div className="donut-chart-center">
                    <AnimatedCounter value={totalValue} />
                    <div className="donut-chart-label">Total Visits</div>
                </div>
            </div>
            <div className="chart-legend">
                <button onClick={() => onFilterChange('All')} className={`legend-item-button ${activeFilter === 'All' ? 'active' : ''}`}>
                    <div className="legend-item">
                        <div className="legend-dot" style={{ background: 'linear-gradient(45deg, var(--dash-purple), var(--dash-yellow), var(--dash-accent))' }}></div>
                        <span>All Sources</span>
                    </div>
                </button>
                {data.map(item => (
                    <button key={item.label} onClick={() => onFilterChange(item.label)} className={`legend-item-button ${activeFilter === item.label ? 'active' : ''}`}>
                        <div className="legend-item">
                            <div className="legend-dot" style={{ backgroundColor: item.color }}></div>
                            <span>{item.label}</span>
                            <span className="ml-auto font-semibold">{totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(0) : 0}%</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default DonutChart;
