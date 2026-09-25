import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '../../ui/Skeleton';

const mockSubmissionsData = [
    { id: 1, from: 'Ada Lovelace', subject: 'Inquiry about Project Dossier', time: '3m ago', unread: true, body: 'Impressive work on the interactive project dossiers! Could you elaborate on the technologies used for the video player and media switcher? It’s a very slick implementation.' },
    { id: 2, from: 'Charles Babbage', subject: 'Collaboration Opportunity', time: '1h ago', unread: true, body: 'Greetings. I represent a collective working on advanced analytical engines. Your profile suggests a strong aptitude for complex systems. We would be interested in discussing a potential collaboration. Please let me know your availability.' },
    { id: 3, from: 'Grace Hopper', subject: 'Feedback on UI/UX', time: '5h ago', unread: false, body: 'The Aetherius OS concept is brilliant. The attention to detail in the UI, from the bootloader to the dashboard, is top-notch. Keep up the excellent work, developer.' },
    { id: 4, from: 'Alan Turing', subject: 'Question about PoW', time: '1d ago', unread: false, body: 'Fascinating use of a client-side Proof-of-Work on your contact form. I’d be curious to know what kind of impact it has had on reducing spam submissions. A clever and practical application of cryptographic principles.' },
];

const SkeletonContactSubmissions: React.FC = () => (
    <div className="contact-submissions-list flex flex-col gap-3">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="contact-item p-4 border border-light-border dark:border-primary/10 rounded-lg bg-light-card/50 dark:bg-dark-card/50">
                 <div className="w-full flex flex-col gap-3">
                    <div className="flex justify-between items-center gap-4">
                        <Skeleton className="w-24 h-5" variant="text" />
                        <Skeleton className="w-16 h-4" variant="text" />
                    </div>
                    <Skeleton className="w-40 h-4" variant="text" />
                </div>
            </div>
        ))}
    </div>
);

const listVariants = { visible: { transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } };

const ContactSubmissions: React.FC<{ isLoading: boolean, addToast: (message: string) => void; }> = ({ isLoading, addToast }) => {
    const [submissions, setSubmissions] = useState(mockSubmissionsData);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    useEffect(() => {
        if (!isLoading) {
            const timer = setTimeout(() => {
                const newSubmission = { id: Date.now(), from: 'New User', subject: 'Random Inquiry', time: '1s ago', unread: true, body: 'This is a new simulated message.' };
                setSubmissions(prev => [newSubmission, ...prev]);
                addToast(`New submission from ${newSubmission.from}!`);
            }, 8000);
            return () => clearTimeout(timer);
        }
    }, [isLoading, addToast]);

    const handleToggle = (id: number) => {
        setExpandedId(prev => (prev === id ? null : id));
        setSubmissions(prev => prev.map(s => s.id === id ? { ...s, unread: false } : s));
    };

    if (isLoading) return <SkeletonContactSubmissions />;

    return (
        <motion.div
            className="contact-submissions-list"
            variants={listVariants}
            initial="hidden"
            animate="visible"
        >
            {submissions.map(sub => (
                <motion.div key={sub.id} variants={itemVariants}>
                     <button onClick={() => handleToggle(sub.id)} className={`contact-item ${sub.unread ? 'unread' : ''}`}>
                        <div className="contact-item-header">
                            <span className="contact-item-from">{sub.from}</span>
                            <span className="contact-item-time">{sub.time}</span>
                        </div>
                        <p className="contact-item-subject">{sub.subject}</p>
                    </button>
                    <AnimatePresence>
                    {expandedId === sub.id && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <p className="contact-item-body">{sub.body}</p>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </motion.div>
            ))}
        </motion.div>
    );
};

export default ContactSubmissions;
