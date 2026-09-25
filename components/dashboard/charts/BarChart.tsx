import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '../../ui/Skeleton';

interface BarChartProps {
  isLoading: boolean;
  data: { label: string; value: number; tooltip: string }[];
}

const SkeletonBarChart: React.FC = () => (
    <div className="chart-container h-full min-h-[200px]">
        <div className="bar-chart flex items-end justify-between h-full w-full gap-2 pt-8 pb-4">
            {Array.from({length: 6}).map((_, index) => (
                <div key={index} className="flex flex-col items-center gap-2 w-full h-full justify-end">
                    <Skeleton className="w-8" style={{ height: `${Math.random() * 60 + 20}%` }} />
                    <Skeleton className="w-10 h-3" variant="text" />
                </div>
            ))}
        </div>
    </div>
);


const BarChart: React.FC<BarChartProps> = ({ isLoading, data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (isLoading) {
    return <SkeletonBarChart />;
  }
  
  const maxValue = Math.max(...data.map(d => d.value), 0) || 100;

  return (
    <div className="chart-container" onMouseLeave={() => setHoveredIndex(null)}>
      <div className="bar-chart">
        {data.map((item, index) => (
          <div key={item.label} className="flex flex-col items-center gap-2 h-full justify-end">
            <motion.div
              className={`bar-chart-bar ${hoveredIndex === index ? 'highlighted' : ''} ${hoveredIndex !== null && hoveredIndex !== index ? 'faded' : ''}`}
              initial={{ height: 0 }}
              animate={{ height: `${(item.value / maxValue) * 100}%` }}
              transition={{ duration: 0.5, delay: index * 0.02, ease: 'easeOut' }}
              onHoverStart={() => setHoveredIndex(index)}
            >
              <div className="tooltip">{item.tooltip}</div>
            </motion.div>
            <span className="text-xs text-[var(--dash-text-secondary)]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BarChart;
