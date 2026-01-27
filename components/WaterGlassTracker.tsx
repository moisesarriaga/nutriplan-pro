import React from 'react';

interface SegmentedWaterBarProps {
    consumed: number; // in ml
    goal: number; // in ml
    className?: string;
}

const SegmentedWaterBar: React.FC<SegmentedWaterBarProps> = ({ consumed, goal, className = '' }) => {
    // Calculate fill percentage
    const fillPercentage = Math.min((consumed / goal) * 100, 100);

    // Calculate number of segments (glasses) - each glass = 250ml
    const totalGlasses = Math.ceil(goal / 250);
    const filledGlasses = Math.floor(consumed / 250);
    const partialFill = (consumed % 250) / 250; // Partial fill for current glass

    // Get color based on percentage
    const getColor = (percentage: number) => {
        if (percentage >= 100) return 'bg-green-500';
        if (percentage >= 75) return 'bg-blue-500';
        if (percentage >= 50) return 'bg-yellow-500';
        if (percentage >= 25) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const progressColor = getColor(fillPercentage);

    return (
        <div className={`w-full ${className}`}>
            {/* Segmented Bar */}
            <div className="flex gap-1 items-end h-3">
                {Array.from({ length: totalGlasses }).map((_, index) => {
                    const isFilled = index < filledGlasses;
                    const isPartial = index === filledGlasses && partialFill > 0;

                    return (
                        <div
                            key={index}
                            className="flex-1 bg-slate-100 dark:bg-white/5 rounded-sm overflow-hidden relative"
                        >
                            {/* Fill */}
                            {isFilled && (
                                <div className={`h-full ${progressColor} transition-all duration-500`} />
                            )}
                            {isPartial && (
                                <div
                                    className={`h-full ${progressColor} transition-all duration-500`}
                                    style={{ width: `${partialFill * 100}%` }}
                                />
                            )}

                            {/* Droplet icon in each segment */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <svg
                                    className={`w-2 h-2 ${isFilled || isPartial ? 'text-white/40' : 'text-slate-300 dark:text-slate-700'}`}
                                    viewBox="0 0 12 16"
                                    fill="currentColor"
                                >
                                    <path d="M6 0C6 0 2 4 2 7C2 9.2 3.8 11 6 11C8.2 11 10 9.2 10 7C10 4 6 0 6 0Z" />
                                </svg>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Labels */}
            <div className="flex justify-between mt-1 text-[9px] text-slate-400 dark:text-slate-600 font-medium">
                <span>0ml</span>
                <span>{(goal / 2).toLocaleString()}ml</span>
                <span>{goal.toLocaleString()}ml</span>
            </div>
        </div>
    );
};

export default SegmentedWaterBar;
