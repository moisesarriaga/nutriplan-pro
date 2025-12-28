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
        if (!user) {
            setSubscription(null);
            setLoading(false);
            return;
        }

        try {
            // Call the database function to get subscription with features
            const { data, error } = await supabase
                .rpc('get_user_subscription_features', { p_user_id: user.id });

            if (error) {
                console.error('Error fetching subscription:', error);
                // Default to free plan if error
                setSubscription({
                    plan_type: 'free',
                    status: 'active',
                    has_calorie_tracking: false,
                    has_price_sum: false,
                    has_family_plan: false,
                    has_priority_support: false,
                });
            } else if (data && data.length > 0) {
                setSubscription(data[0]);
            } else {
                // No subscription found, create free subscription
                const { error: insertError } = await supabase
                    .from('subscriptions')
                    .insert({
                        user_id: user.id,
                        plan_type: 'free',
                        status: 'active',
                    });

                if (!insertError) {
                    setSubscription({
                        plan_type: 'free',
                        status: 'active',
                        has_calorie_tracking: false,
                        has_price_sum: false,
                        has_family_plan: false,
                        has_priority_support: false,
                    });
                }
            }
        } catch (error) {
            console.error('Error in fetchSubscription:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscription();
    }, [user]);

    const hasFeature = (feature: string): boolean => {
        if (!subscription || subscription.status !== 'active') {
            return false;
        }

        switch (feature) {
            case 'calorie_tracking':
                return subscription.has_calorie_tracking;
            case 'price_sum':
                return subscription.has_price_sum;
            case 'family_plan':
                return subscription.has_family_plan;
            case 'priority_support':
                return subscription.has_priority_support;
            default:
                return false;
        }
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
