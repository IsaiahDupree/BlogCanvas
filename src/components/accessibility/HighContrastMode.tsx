'use client';

import { useEffect, useState } from 'react';
import { Monitor } from 'lucide-react';

export function HighContrastMode() {
    const [isHighContrast, setIsHighContrast] = useState(false);

    useEffect(() => {
        // Check if user prefers high contrast
        const prefersHighContrast = window.matchMedia('(prefers-contrast: more)').matches;
        const savedPreference = localStorage.getItem('highContrast') === 'true';

        setIsHighContrast(prefersHighContrast || savedPreference);
    }, []);

    useEffect(() => {
        // Apply high contrast mode to document
        if (isHighContrast) {
            document.documentElement.classList.add('high-contrast');
            localStorage.setItem('highContrast', 'true');
        } else {
            document.documentElement.classList.remove('high-contrast');
            localStorage.setItem('highContrast', 'false');
        }
    }, [isHighContrast]);

    const toggleHighContrast = () => {
        setIsHighContrast(prev => !prev);
    };

    return (
        <button
            onClick={toggleHighContrast}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={`${isHighContrast ? 'Disable' : 'Enable'} high contrast mode`}
            aria-pressed={isHighContrast}
        >
            <Monitor className="h-4 w-4" />
            <span>High Contrast {isHighContrast ? 'On' : 'Off'}</span>
        </button>
    );
}

export default HighContrastMode;
