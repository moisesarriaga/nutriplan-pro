import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

interface TutorialStep {
    title: string;
    description: string;
    targetId: string; // The ID of the element to highlight
}

interface TutorialContextType {
    isStarted: boolean;
    activeStep: number;
    steps: TutorialStep[];
    startTutorial: () => void;
    nextStep: () => void;
    skipTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [isStarted, setIsStarted] = useState(false);
    const [activeStep, setActiveStep] = useState(0);

    const steps: TutorialStep[] = [
        {
            title: "Bem-vindo ao NutriPlan Pro!",
            description: "Vamos fazer um tour rápido pelas principais funcionalidades para você aproveitar ao máximo seu novo app.",
            targetId: "dashboard-header"
        },
        {
            title: "Seu Resumo Diário",
            description: "Aqui você acompanha suas calorias e consumo de água em tempo real.",
            targetId: "health-summary"
        },
        {
            title: "Planejador de Refeições",
            description: "Organize sua semana! Planeje o que comer em cada refeição do dia.",
            targetId: "nav-planner"
        },
        {
            title: "Lista de Compras Inteligente",
            description: "Crie grupos de compras e gerencie seus itens de forma organizada.",
            targetId: "nav-cart"
        },
        {
            title: "Suas Receitas",
            description: "Crie e gerencie suas próprias receitas personalizadas aqui.",
            targetId: "nav-my-recipes"
        },
        {
            title: "Perfil e Metas",
            description: "Ajuste seu peso, altura e metas calóricas sempre que precisar nas configurações.",
            targetId: "nav-profile"
        }
    ];

    const startTutorial = () => {
        setIsStarted(true);
        setActiveStep(0);
    };

    const nextStep = () => {
        if (activeStep < steps.length - 1) {
            setActiveStep(prev => prev + 1);
        } else {
            finishTutorial();
        }
    };

    const skipTutorial = () => {
        finishTutorial();
    };

    const finishTutorial = async () => {
        setIsStarted(false);
        setActiveStep(0);

        if (user) {
            // Update DB flag
            try {
                await supabase
                    .from('perfis_usuario')
                    .update({ tutorial_visto: true })
                    .eq('id', user.id);
            } catch (err) {
                console.error('Error updating tutorial flag:', err);
            }
        }
    };

    return (
        <TutorialContext.Provider value={{ isStarted, activeStep, steps, startTutorial, nextStep, skipTutorial }}>
            {children}
        </TutorialContext.Provider>
    );
};

export const useTutorial = () => {
    const context = useContext(TutorialContext);
    if (context === undefined) {
        throw new Error('useTutorial must be used within a TutorialProvider');
    }
    return context;
};
