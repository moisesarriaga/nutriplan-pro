import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

interface SubscriptionFeatures {
    plan_type: 'free' | 'simple' | 'premium';
    status: 'active' | 'pending' | 'cancelled' | 'expired';
    has_calorie_tracking: boolean;
    has_price_sum: boolean;
    has_family_plan: boolean;
    has_priority_support: boolean;
}

interface SubscriptionContextType {
    subscription: SubscriptionFeatures | null;
    loading: boolean;
    refreshSubscription: () => Promise<void>;
    hasFeature: (feature: string) => boolean;
    isActive: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState<SubscriptionFeatures | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSubscription = async () => {
        // UNLOCK: Force Premium for everyone
        setSubscription({
            plan_type: 'premium',
            status: 'active',
            has_calorie_tracking: true,
            has_price_sum: true,
            has_family_plan: true,
            has_priority_support: true,
        });
        setLoading(false);
    };

    useEffect(() => {
        fetchSubscription();
    }, [user]);

    const hasFeature = (feature: string): boolean => {
        // UNLOCK: Always allow all features
        return true;
    };

    const isActive = subscription?.status === 'active';

    return (
        <SubscriptionContext.Provider
            value={{
                subscription,
                loading,
                refreshSubscription: fetchSubscription,
                hasFeature,
                isActive,
            }}
        >
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};
