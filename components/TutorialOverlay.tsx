import React, { useEffect, useState } from 'react';
import { useTutorial } from '../contexts/TutorialContext';

const TutorialOverlay: React.FC = () => {
    const { isStarted, activeStep, steps, nextStep, skipTutorial } = useTutorial();
    const [spotlightStyles, setSpotlightStyles] = useState<React.CSSProperties>({});
    const [tooltipStyles, setTooltipStyles] = useState<React.CSSProperties>({});

    const currentStep = steps[activeStep];

    useEffect(() => {
        if (isStarted && currentStep) {
            const element = document.getElementById(currentStep.targetId);
            if (element) {
                const rect = element.getBoundingClientRect();
                const padding = 8;

                setSpotlightStyles({
                    top: rect.top - padding,
                    left: rect.left - padding,
                    width: rect.width + padding * 2,
                    height: rect.height + padding * 2,
                    display: 'block'
                });

                // Calculate tooltip position
                let top = rect.bottom + 20;
                let left = rect.left + rect.width / 2;

                // Adjust if it goes off screen
                if (top + 200 > window.innerHeight) {
                    top = rect.top - 220;
                }

                // Center tooltip horizontally
                const tooltipWidth = 300;
                left = Math.max(20, Math.min(window.innerWidth - tooltipWidth - 20, left - tooltipWidth / 2));

                setTooltipStyles({
                    top,
                    left,
                    display: 'block'
                });

                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                // If element not found, hide spotlight but show tooltip in center
                setSpotlightStyles({ display: 'none' });
                setTooltipStyles({
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'block'
                });
            }
        }
    }, [isStarted, activeStep, currentStep]);

    if (!isStarted) return null;

    return (
        <div className="fixed inset-0 z-[200] pointer-events-none">
            {/* Dark Backdrop with Spotlight Hole */}
            <div
                className="absolute inset-0 bg-black/60 transition-all duration-500"
                style={{
                    clipPath: spotlightStyles.top !== undefined
                        ? `polygon(0% 0%, 0% 100%, ${spotlightStyles.left}px 100%, ${spotlightStyles.left}px ${spotlightStyles.top}px, ${(spotlightStyles.left as number) + (spotlightStyles.width as number)}px ${spotlightStyles.top}px, ${(spotlightStyles.left as number) + (spotlightStyles.width as number)}px ${(spotlightStyles.top as number) + (spotlightStyles.height as number)}px, ${spotlightStyles.left}px ${(spotlightStyles.top as number) + (spotlightStyles.height as number)}px, ${spotlightStyles.left}px 100%, 100% 100%, 100% 0%)`
                        : 'none'
                }}
            />

            {/* Spotlight Border */}
            {spotlightStyles.top !== undefined && (
                <div
                    className="absolute border-2 border-primary rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] transition-all duration-500"
                    style={spotlightStyles}
                />
            )}

            {/* Tooltip Content */}
            <div
                className="absolute w-[300px] bg-white dark:bg-surface-dark rounded-3xl shadow-2xl p-6 pointer-events-auto animate-in zoom-in-95 fade-in duration-300 border border-slate-200 dark:border-gray-800"
                style={tooltipStyles}
            >
                <div className="flex justify-between items-center mb-3">
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
                    {activeStep > 0 && (
                        <button
                            // This button is not in the context yet, but good for UX if added later
                            onClick={() => { }}
                            className="hidden"
                        />
                    )}
                    <button
                        onClick={nextStep}
                        className="flex-1 py-3.5 bg-primary text-background-dark font-bold rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all text-sm"
                    >
                        {activeStep === steps.length - 1 ? 'Concluir' : 'Próximo'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TutorialOverlay;
