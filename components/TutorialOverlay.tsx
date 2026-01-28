import React, { useEffect, useState } from 'react';
import { useTutorial } from '../contexts/TutorialContext';

const TutorialOverlay: React.FC = () => {
    const { isStarted, activeStep, steps, nextStep, skipTutorial } = useTutorial();
    const [spotlightStyles, setSpotlightStyles] = useState<React.CSSProperties>({});
    const [tooltipStyles, setTooltipStyles] = useState<React.CSSProperties>({});
    const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('bottom');

    const currentStep = steps[activeStep];

    useEffect(() => {
        if (isStarted && currentStep) {
            const element = document.getElementById(currentStep.targetId);
            if (element) {
                const rect = element.getBoundingClientRect();
                const padding = 12;

                setSpotlightStyles({
                    top: rect.top - padding,
                    left: rect.left - padding,
                    width: rect.width + padding * 2,
                    height: rect.height + padding * 2,
                    display: 'block'
                });

                // Positioning logic
                const screenWidth = window.innerWidth;
                const screenHeight = window.innerHeight;
                const tooltipWidth = Math.min(screenWidth - 40, 320);
                const estimatedTooltipHeight = 350; // Increased estimate for safety
                const paddingFromEdge = 20;

                const spaceBelow = screenHeight - rect.bottom;
                const spaceAbove = rect.top;

                let preferredPosition: 'top' | 'bottom' = 'bottom';

                // Decide position based on available space
                if (spaceBelow < estimatedTooltipHeight && spaceAbove > spaceBelow) {
                    preferredPosition = 'top';
                }

                setTooltipPosition(preferredPosition);

                // Horizontal centering with edge safety
                let leftValue = rect.left + rect.width / 2;
                leftValue = Math.max(padding + tooltipWidth / 2, Math.min(screenWidth - padding - tooltipWidth / 2, leftValue));

                const styles: React.CSSProperties = {
                    left: leftValue,
                    width: tooltipWidth,
                    transform: 'translateX(-50%)', // Only horizontal transform now
                    display: 'block',
                    maxHeight: 'calc(100vh - 80px)', // Ensure it fits on screen
                    overflowY: 'auto'
                };

                if (preferredPosition === 'bottom') {
                    styles.top = Math.max(paddingFromEdge, rect.bottom + 20);
                    styles.bottom = 'auto'; // Let it grow downwards
                } else {
                    styles.bottom = Math.max(paddingFromEdge, screenHeight - rect.top + 20);
                    styles.top = 'auto'; // Let it grow upwards
                }

                setTooltipStyles(styles);

                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                setSpotlightStyles({ display: 'none' });
                setTooltipStyles({
                    top: '50%',
                    left: '50%',
                    width: Math.min(window.innerWidth - 40, 320),
                    transform: 'translate(-50%, -50%)',
                    display: 'block'
                });
            }
        }
    }, [isStarted, activeStep, currentStep]);

    if (!isStarted) return null;

    return (
        <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden">
            {/* Spotlight & Backdrop (using huge box-shadow for rounded corners) */}
            {spotlightStyles.top !== undefined ? (
                <div
                    className="absolute border-2 border-primary rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.7),0_0_20px_rgba(59,130,246,0.3)] transition-all duration-500"
                    style={spotlightStyles}
                />
            ) : (
                <div className="absolute inset-0 bg-black/70 pointer-events-auto" />
            )}

            {/* Tooltip Content */}
            <div
                className="absolute bg-white dark:bg-surface-dark rounded-3xl shadow-2xl p-6 pointer-events-auto animate-in zoom-in-95 fade-in duration-300 border border-slate-200 dark:border-gray-800"
                style={tooltipStyles}
            >
                {/* Arrow */}
                {spotlightStyles.top !== undefined && (
                    <div
                        className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-surface-dark border-inherit rotate-45 transition-all duration-300 ${tooltipPosition === 'bottom' ? '-top-2 border-t border-l' : '-bottom-2 border-b border-r'
                            }`}
                    />
                )}

                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded">
                            Passo {activeStep + 1} de {steps.length}
                        </span>
                        <button
                            onClick={skipTutorial}
                            className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            Pular
                        </button>
                    </div>

                    <h4 className="text-lg font-bold mb-2 text-slate-900 dark:text-white leading-tight">
                        {currentStep?.title}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-[#92c9a4] mb-6 leading-relaxed">
                        {currentStep?.description}
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={nextStep}
                            className="flex-1 py-3.5 bg-primary text-background-dark font-bold rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all text-sm"
                        >
                            {activeStep === steps.length - 1 ? 'Concluir' : 'Próximo'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TutorialOverlay;
