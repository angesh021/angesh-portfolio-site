import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface StatCardProps {
    isLoading: boolean;
    title: string;
    amount: string;
    label: string;
    change: string;
    changeType: 'positive' | 'negative';
}

const SkeletonStatCard: React.FC = () => (
    <div>
        <div className="dash-card-header !mb-4">
            <div className="skeleton-loader w-32 h-6" />
        </div>
        <div className="stat-card-content">
            <div>
                <div className="skeleton-loader w-24 h-9 mb-2" />
                <div className="skeleton-loader w-40 h-4" />
            </div>
            <div className="skeleton-loader w-16 h-6 rounded-full" />
        </div>
    </div>
);


const StatCard: React.FC<StatCardProps> = ({ isLoading, title, amount, label, change, changeType }) => {
    if (isLoading) {
        return <SkeletonStatCard />;
    }
    
    return (
        <div>
            <div className="dash-card-header !mb-4">
                <h2 className="dash-card-title">{title}</h2>
            </div>
            <div className="stat-card-content">
                <div>
                    <p className="stat-card-amount">{amount}</p>
                    <p className="stat-card-label">{label}</p>
                </div>
                <div className={`stat-card-change ${changeType}`}>
                    {changeType === 'positive' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                    <span>{change}</span>
                </div>
            </div>
        </div>
    );
};

export default StatCard;
