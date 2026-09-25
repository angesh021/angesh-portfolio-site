import React, { useState, useEffect, useMemo } from 'react';
import { Star, GitFork, Code } from 'lucide-react';
import { motion } from 'framer-motion';
import { useI18n } from '../../../hooks/useI18n';
import { getContent } from '../../../lib/contentService';
import { Project } from '../../../types';

interface ProjectStat extends Project {
    stars: number;
    forks: number;
}

interface ProjectStatsProps {
    onProjectSelect: (project: Project) => void;
}

const ProjectStatSkeleton: React.FC = () => (
    <div className="project-stats-item">
        <div className="project-stat-details">
            <div className="skeleton-loader w-10 h-10 is-circle" />
            <div className="project-stat-info">
                <div className="skeleton-loader w-32 h-5 mb-2" />
                <div className="skeleton-loader w-24 h-4" />
            </div>
        </div>
        <div className="project-stat-counts">
            <div className="skeleton-loader w-12 h-5 mb-2" />
            <div className="skeleton-loader w-10 h-4" />
        </div>
    </div>
);

const listVariants = { visible: { transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } };

const ProjectStats: React.FC<ProjectStatsProps> = ({ onProjectSelect }) => {
    const { language } = useI18n();
    const projects = useMemo(() => getContent<Project[]>('projects', language) || [], [language]);
    const [stats, setStats] = useState<ProjectStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            await new Promise(resolve => setTimeout(resolve, 1500)); 
            const simulatedStats = projects.map(project => ({
                ...project,
                stars: (project.title.length * 37) % 250 + 20,
                forks: (project.title.length * 13) % 50 + 5,
            }));
            setStats(simulatedStats.sort((a, b) => b.stars - a.stars));
            setLoading(false);
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="project-stats-list">
                {[...Array(5)].map((_, i) => <ProjectStatSkeleton key={i} />)}
            </div>
        )
    }

    return (
        <motion.div 
          className="project-stats-list"
          variants={listVariants}
          initial="hidden"
          animate="visible"
        >
            {stats.map(stat => (
                <motion.button 
                    onClick={() => onProjectSelect(stat)} 
                    key={stat.id} 
                    className="project-stats-item"
                    variants={itemVariants}
                >
                    <div className="project-stat-details">
                        <div className="project-stat-icon"><Code size={18} /></div>
                        <div className="project-stat-info">
                            <p className="name">{stat.title}</p>
                            <p className="date">{stat.status}</p>
                        </div>
                    </div>
                    <div className="project-stat-counts">
                        <p className="stars flex items-center justify-end gap-1">{stat.stars} <Star size={14} /></p>
                        <p className="forks flex items-center justify-end gap-1">{stat.forks} <GitFork size={14} /></p>
                    </div>
                </motion.button>
            ))}
        </motion.div>
    );
};

export default ProjectStats;
