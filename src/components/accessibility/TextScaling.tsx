'use client';

import { useEffect, useState } from 'react';
import { Type, Minus, Plus } from 'lucide-react';

const FONT_SIZES = {
    small: 14,
    normal: 16,
    large: 18,
    xlarge: 20,
    xxlarge: 24
} as const;

type FontSizeKey = keyof typeof FONT_SIZES;

export function TextScaling() {
    const [fontSize, setFontSize] = useState<FontSizeKey>('normal');

    useEffect(() => {
        // Load saved preference
        const savedSize = localStorage.getItem('fontSize') as FontSizeKey;
        if (savedSize && FONT_SIZES[savedSize]) {
            setFontSize(savedSize);
        }
    }, []);

    useEffect(() => {
        // Apply font size to document root
        document.documentElement.style.fontSize = `${FONT_SIZES[fontSize]}px`;
        localStorage.setItem('fontSize', fontSize);
    }, [fontSize]);

    const increaseFontSize = () => {
        const sizes: FontSizeKey[] = ['small', 'normal', 'large', 'xlarge', 'xxlarge'];
        const currentIndex = sizes.indexOf(fontSize);
        if (currentIndex < sizes.length - 1) {
            setFontSize(sizes[currentIndex + 1]);
        }
    };

    const decreaseFontSize = () => {
        const sizes: FontSizeKey[] = ['small', 'normal', 'large', 'xlarge', 'xxlarge'];
        const currentIndex = sizes.indexOf(fontSize);
        if (currentIndex > 0) {
            setFontSize(sizes[currentIndex - 1]);
        }
    };

    const resetFontSize = () => {
        setFontSize('normal');
    };

    const sizes: FontSizeKey[] = ['small', 'normal', 'large', 'xlarge', 'xxlarge'];
    const currentIndex = sizes.indexOf(fontSize);

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={decreaseFontSize}
                disabled={currentIndex === 0}
                className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Decrease text size"
            >
                <Minus className="h-4 w-4" />
            </button>

            <button
                onClick={resetFontSize}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Reset text size to normal"
            >
                <Type className="h-4 w-4" />
                <span className="hidden sm:inline">{fontSize}</span>
            </button>

            <button
                onClick={increaseFontSize}
                disabled={currentIndex === sizes.length - 1}
                className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Increase text size"
            >
                <Plus className="h-4 w-4" />
            </button>
        </div>
    );
}

export default TextScaling;
