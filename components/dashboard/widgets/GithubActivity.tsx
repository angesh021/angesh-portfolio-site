import React from 'react';
import { motion } from 'framer-motion';
import { GitCommit, GitPullRequest, AlertCircle } from 'lucide-react';
import { Skeleton } from '../../ui/Skeleton';

const mockActivity = [
    { type: 'commit', repo: 'aetherius-os-portfolio', message: 'feat: Implement interactive dashboard widgets', time: '2 hours ago' },
    { type: 'pr', repo: 'enterprise-nac-lab', message: 'Add support for EAP-TLS authentication', time: '8 hours ago' },
    { type: 'commit', repo: 'aetherius-os-portfolio', message: 'refactor: Optimize chart rendering', time: '1 day ago' },
    { type: 'issue', repo: 'bug-tracker', message: 'Investigate SQL injection vulnerability', time: '2 days ago' },
    { type: 'commit', repo: 'ccna-enterprise-lab', message: 'docs: Update network topology diagram', time: '3 days ago' },
];

const ActivityIcon: React.FC<{ type: string }> = ({ type }) => {
    switch (type) {
        case 'commit': return <GitCommit size={16} className="activity-icon" />;
        case 'pr': return <GitPullRequest size={16} className="activity-icon" />;
        case 'issue': return <AlertCircle size={16} className="activity-icon" />;
        default: return <GitCommit size={16} className="activity-icon" />;
    }
}

const SkeletonGithubActivity: React.FC = () => (
    <div className="github-activity-list flex flex-col gap-4">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="github-activity-item flex gap-3">
                <Skeleton className="w-4 h-4 mt-1" />
                <div className="w-full flex flex-col gap-2">
                    <Skeleton className="w-full h-4" variant="text" />
                    <Skeleton className="w-3/4 h-4" variant="text" />
                    <Skeleton className="w-1/4 h-3 mt-1" variant="text" />
                </div>
            </div>
        ))}
    </div>
);

const listVariants = { visible: { transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const GithubActivity: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
  if (isLoading) return <SkeletonGithubActivity />;
  
  return (
    <motion.div 
      className="github-activity-list"
      variants={listVariants}
      initial="hidden"
      animate="visible"
    >
        {mockActivity.map((activity, i) => (
            <motion.div key={i} className="github-activity-item" variants={itemVariants}>
                <ActivityIcon type={activity.type} />
                <div className="activity-text">
                    <span>{activity.message} in </span>
                    <a href="#" onClick={e => e.preventDefault()}>{activity.repo}</a>
                    <p className="activity-time">{activity.time}</p>
                </div>
            </motion.div>
        ))}
    </motion.div>
  );
};

export default GithubActivity;
