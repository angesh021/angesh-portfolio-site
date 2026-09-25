import React from 'react';
import { motion } from 'framer-motion';
import { X, Code, Star, GitFork, GitCommit, ExternalLink } from 'lucide-react';
import { Project } from '../../../types';
import BarChart from '../charts/BarChart';

interface ProjectAnalyticsModalProps {
    project: Project;
    onClose: () => void;
}

const generateStargazerData = (projectId: string) => {
    const dataPoints = 12;
    const seed = projectId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return Array.from({ length: dataPoints }, (_, i) => {
        const value = (Math.sin((i + seed) / 2) + 1.5) * 15 + Math.random() * 10;
        const month = new Date(0, i).toLocaleString('default', { month: 'short' });
        return { label: month, value, tooltip: `${Math.round(value)} New Stars` };
    });
};

const mockCommits = [
    { hash: 'a1b2c3d', msg: 'feat: Add analytics chart component' }, { hash: 'e4f5g6h', msg: 'fix: Correct data simulation logic' },
    { hash: 'i7j8k9l', msg: 'refactor: Optimize state management' }, { hash: 'm0n1o2p', msg: 'docs: Update README with new features' },
];

const ProjectAnalyticsModal: React.FC<ProjectAnalyticsModalProps> = ({ project, onClose }) => {
    const stargazerData = generateStargazerData(project.id);

    return (
        <motion.div
            className="dash-settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="dash-settings-modal project-analytics-modal"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                role="dialog" aria-modal="true" aria-labelledby="project-analytics-title"
            >
                <div className="dash-card-header">
                    <h2 id="project-analytics-title" className="dash-card-title flex items-center gap-2">
                        <Code size={20} /> {project.title}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-[var(--dash-card-bg)] transition-colors"><X size={18} /></button>
                </div>
                
                <div className="flex gap-4 mb-4 text-sm">
                    <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[var(--dash-text-secondary)] hover:text-[var(--dash-accent)]">
                        <ExternalLink size={14}/> View on GitHub
                    </a>
                </div>

                <h3 className="text-sm font-bold text-[var(--dash-text-secondary)] uppercase mb-2">Stargazer History (Simulated)</h3>
                <BarChart isLoading={false} data={stargazerData} />
                
                <h3 className="text-sm font-bold text-[var(--dash-text-secondary)] uppercase mt-6 mb-2">Recent Commits (Simulated)</h3>
                <div className="commit-log">
                    {mockCommits.map(commit => (
                        <div key={commit.hash} className="flex items-center gap-3 p-2 border-b border-[var(--dash-glass-border)]">
                            <GitCommit size={16} className="text-[var(--dash-text-secondary)]" />
                            <span className="text-[var(--dash-accent)]">{commit.hash}</span>
                            <span>{commit.msg}</span>
                        </div>
                    ))}
                </div>

            </motion.div>
        </motion.div>
    );
};

export default ProjectAnalyticsModal;
