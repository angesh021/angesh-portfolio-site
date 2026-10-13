import React, { useEffect } from 'react';
import { useMotionValue, MotionValue } from 'framer-motion';

/**
 * A hook that returns a stable 0 motion value.
 * We rely on native browser scroll physics (rubber-banding/overscroll-behavior) 
 * instead of JS event interception to prevent lag and layout shifts.
 */
export const useOverscrollBounce = (ref: React.RefObject<HTMLElement>): MotionValue<number> => {
    const y = useMotionValue(0);
    return y;
};

