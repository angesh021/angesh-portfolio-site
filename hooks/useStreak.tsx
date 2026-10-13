import { useState, useEffect, useCallback, createContext, useContext } from 'react';

export interface StreakState {
  points: number;
  consecutiveDays: number;
  lastVisitDate: string; // YYYY-MM-DD
  completedActions: Record<string, number>; // Maps action name to count
  unlockedLevels: string[]; // Levels already notified
}

export interface StreakLevelConfig {
  id: string;
  name: string;
  pointsRequired: number;
  badge: string;
  description: string;
  rewards: string;
}

export const STREAK_LEVELS: StreakLevelConfig[] = [
  {
    id: 'lvl1',
    name: 'Curious Explorer',
    pointsRequired: 15,
    badge: '🧭',
    description: 'You started exploring the digital space.',
    rewards: 'Level 1 Chime & Badge unlocked',
  },
  {
    id: 'lvl2',
    name: 'Interface Tinkerer',
    pointsRequired: 40,
    badge: '⚙️',
    description: 'You customized the terminal settings or changed language.',
    rewards: 'Level 2 Chime & Custom Settings enabled',
  },
  {
    id: 'lvl3',
    name: 'Deep Scholar',
    pointsRequired: 80,
    badge: '🎓',
    description: 'You thoroughly reviewed the educational & certification history.',
    rewards: 'Level 3 Premium Chime unlocked',
  },
  {
    id: 'lvl4',
    name: 'Sourcing Officer',
    pointsRequired: 130,
    badge: '💼',
    description: 'You checked out projects and details or initiated a resume download.',
    rewards: 'Level 4 Golden Seal unlocked',
  },
  {
    id: 'lvl5',
    name: 'Elite Prospect',
    pointsRequired: 200,
    badge: '⚡',
    description: 'Outstanding engagement! You are actively networking.',
    rewards: 'Level 5 Legendary Chime & Sparkles unlocked',
  },
];

interface StreakContextType {
  streak: StreakState;
  currentLevel: StreakLevelConfig;
  nextLevel: StreakLevelConfig | null;
  addPoints: (points: number, actionId: string) => void;
  simulateLevelUp: () => void;
  resetStreak: () => void;
}

const StreakContext = createContext<StreakContextType | undefined>(undefined);

const INITIAL_STREAK: StreakState = {
  points: 0,
  consecutiveDays: 1,
  lastVisitDate: '',
  completedActions: {},
  unlockedLevels: [],
};

const ACTION_COOLDOWNS: Record<string, number> = {
  explore_section: 10000, // 10s cooldown for same section
  toggle_setting: 5000,  // 5s cooldown
  change_language: 5000, // 5s
  view_project: 8000,    // 8s
  resume_download: 30000, // 30s
  type_message: 3000,    // 3s
};

const ACTION_MAX_LIMITS: Record<string, number> = {
  explore_section: 10,  // max 10 times points
  toggle_setting: 5,    // max 5 times
  change_language: 3,   // max 3 times
  view_project: 8,      // max 8 times
  resume_download: 2,   // max 2 times
  type_message: 5,      // max 5 times
};

export const StreakProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [streak, setStreak] = useState<StreakState>(INITIAL_STREAK);
  const [lastActionTimes, setLastActionTimes] = useState<Record<string, number>>({});

  // 1. Load initial state & Handle consecutive days logic on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('user_streak_state_v2');
      let currentStreak = saved ? (JSON.parse(saved) as StreakState) : { ...INITIAL_STREAK };

      const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!currentStreak.lastVisitDate) {
        // Brand new user
        currentStreak.lastVisitDate = todayStr;
        currentStreak.consecutiveDays = 1;
        currentStreak.points = 5; // Starter gift points
      } else if (currentStreak.lastVisitDate !== todayStr) {
        const lastVisit = new Date(currentStreak.lastVisitDate);
        const today = new Date(todayStr);
        const diffTime = Math.abs(today.getTime() - lastVisit.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Consecutive visit!
          currentStreak.consecutiveDays += 1;
          const streakPointsReward = Math.min(25, currentStreak.consecutiveDays * 5);
          currentStreak.points += streakPointsReward;
          currentStreak.lastVisitDate = todayStr;
        } else if (diffDays > 1) {
          // Streak broken
          currentStreak.consecutiveDays = 1;
          currentStreak.lastVisitDate = todayStr;
        }
      }

      setStreak(currentStreak);
    } catch (e) {
      console.error('Failed to parse streak from localStorage', e);
    }
  }, []);

  // 2. Persist state changes
  useEffect(() => {
    if (streak.lastVisitDate) {
      localStorage.setItem('user_streak_state_v2', JSON.stringify(streak));
    }
  }, [streak]);

  // 3. Helper to determine level from points
  const getLevelByPoints = useCallback((points: number): StreakLevelConfig => {
    let activeLevel = STREAK_LEVELS[0];
    for (const lvl of STREAK_LEVELS) {
      if (points >= lvl.pointsRequired) {
        activeLevel = lvl;
      } else {
        break;
      }
    }
    // Return base level if less than level 1 requirements
    if (points < STREAK_LEVELS[0].pointsRequired) {
      return {
        id: 'lvl0',
        name: 'Aspiring Scout',
        pointsRequired: 0,
        badge: '🌱',
        description: 'You are setting foot on your interactive journey.',
        rewards: 'Keep exploring to level up!',
      };
    }
    return activeLevel;
  }, []);

  const currentLevel = getLevelByPoints(streak.points);
  const nextLevelIdx = STREAK_LEVELS.findIndex(l => l.id === currentLevel.id) + 1;
  const nextLevel = nextLevelIdx < STREAK_LEVELS.length ? STREAK_LEVELS[nextLevelIdx] : null;

  // 4. Level-up notification processor via side-effect
  useEffect(() => {
    if (!streak.points) return;

    const newlyUnlocked: string[] = [];
    
    // Find any levels the user qualifies for but hasn't unlocked yet
    for (const lvl of STREAK_LEVELS) {
      if (streak.points >= lvl.pointsRequired && !streak.unlockedLevels.includes(lvl.id)) {
        newlyUnlocked.push(lvl.id);
      }
    }

    if (newlyUnlocked.length > 0) {
      // Mark them as unlocked immediately to prevent duplicate runs
      setStreak(prev => {
        const toAdd = newlyUnlocked.filter(id => !prev.unlockedLevels.includes(id));
        if (toAdd.length === 0) return prev;
        return {
          ...prev,
          unlockedLevels: [...prev.unlockedLevels, ...toAdd]
        };
      });
    }
  }, [streak.points, streak.unlockedLevels]);

  // 5. Public point trigger with efficient cooldown throttling
  const addPoints = useCallback((pts: number, actionId: string) => {
    const now = Date.now();
    const lastTime = lastActionTimes[actionId] || 0;
    const cooldown = ACTION_COOLDOWNS[actionId] || 2000;

    // Check action cooldown
    if (now - lastTime < cooldown) return;

    setStreak(prev => {
      const currentCount = prev.completedActions[actionId] || 0;
      const maxLimit = ACTION_MAX_LIMITS[actionId] || 999;

      // Check action maximum limit
      if (currentCount >= maxLimit) return prev;

      const newPoints = prev.points + pts;
      const newActions = {
        ...prev.completedActions,
        [actionId]: currentCount + 1,
      };

      // Save last action time
      setLastActionTimes(times => ({ ...times, [actionId]: now }));

      return {
        ...prev,
        points: newPoints,
        completedActions: newActions,
      };
    });
  }, [lastActionTimes]);

  // 6. Simulate level-up action (ideal for testing and manual activation)
  const simulateLevelUp = useCallback(() => {
    setStreak(prev => {
      let targetPoints = 15;
      for (const lvl of STREAK_LEVELS) {
        if (prev.points < lvl.pointsRequired) {
          targetPoints = lvl.pointsRequired;
          break;
        }
      }
      // If already max level, just add 50 points
      if (prev.points >= STREAK_LEVELS[STREAK_LEVELS.length - 1].pointsRequired) {
        targetPoints = prev.points + 50;
      }

      return {
        ...prev,
        points: targetPoints,
      };
    });
  }, []);

  // 7. Reset streak back to default
  const resetStreak = useCallback(() => {
    setStreak(INITIAL_STREAK);
    setLastActionTimes({});
    localStorage.removeItem('user_streak_state_v2');
  }, []);

  return (
    <StreakContext.Provider
      value={{
        streak,
        currentLevel,
        nextLevel,
        addPoints,
        simulateLevelUp,
        resetStreak,
      }}
    >
      {children}
    </StreakContext.Provider>
  );
};

export const useStreak = (): StreakContextType => {
  const context = useContext(StreakContext);
  if (context === undefined) {
    throw new Error('useStreak must be used within a StreakProvider');
  }
  return context;
};
