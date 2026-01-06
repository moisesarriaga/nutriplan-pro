import { supabase } from '../lib/supabaseClient';



export interface CreateSubscriptionResponse {
    success: boolean;
    init_point?: string;
    preapproval_id?: string;
    redirect?: string;
    error?: string;
}

/**
 * Creates a subscription via Supabase Edge Function
 */
export const createSubscription = async (
    plan: string
): Promise<CreateSubscriptionResponse> => {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            throw new Error('Usuário não autenticado');
        }

        const { data, error } = await supabase.functions.invoke('create-subscription', {
            body: {
                plan,
                userId: session.user.id
            }
        });

        if (error) {
            throw new Error(error.message || 'Erro ao criar assinatura');
        }

        return data;
    } catch (error) {
        console.error('Error creating subscription:', error);
        throw error;
    }
};

/**
 * Gets available payment methods from Mercado Pago via Supabase Edge Function
 */
export const getPaymentMethods = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            console.warn('User not authenticated, skipping payment methods fetch');
            return [];
        }

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Missing Supabase configuration');
        }

        const response = await fetch(`${supabaseUrl}/functions/v1/payment-methods`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${session.access_token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || errorData.message || `Erro ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        return [];
    }
};

/**
 * Gets the current user's subscription
 */
export const getUserSubscription = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw error;
        }

        return { data, error: null };
    } catch (error) {
        console.error('Error fetching subscription:', error);
        return { data: null, error };
    }
};

/**
 * Cancels a user's subscription
 */
export const cancelSubscription = async (userId: string) => {
    try {
        const { error } = await supabase
            .from('subscriptions')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

        if (error) {
            throw error;
        }

        return { success: true };
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};

/**
 * Checks if user has access to a specific feature
 */
export const checkFeatureAccess = async (
    userId: string,
    feature: 'calorie_tracking' | 'price_sum' | 'family_plan' | 'priority_support'
): Promise<boolean> => {
    try {
        const { data, error } = await supabase
            .rpc('get_user_subscription_features', { p_user_id: userId });

        if (error || !data || data.length === 0) {
            return false;
        }

        const subscription = data[0];

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
    } catch (error) {
        console.error('Error checking feature access:', error);
        return false;
    }
};

/**
 * Plan details
 */
export const PLANS = {
    free: {
        name: 'Grátis',
        price: 0,
        description: 'Para quem está começando a se organizar',
        features: [
            'Acesso básico ao app',
            '1 Lista de compras',
            'Sem anúncios intrusivos',
        ],
    },
    simple: {
        name: 'Simples',
        price: 39.90,
        description: 'O essencial para ter controle total',
        features: [
            'Tudo do plano Grátis',
            'Até 2 aparelhos conectados',
            'Controle de Calorias',
            'Soma automática de preços',
            'Receitas exclusivas',
        ],
    },
    premium: {
        name: 'Premium',
        price: 59.90,
        description: 'Para famílias que buscam praticidade máxima',
        features: [
            'Tudo do plano Simples',
            'Até 6 aparelhos (Plano Familiar)',
            'Prioridade no suporte',
            'Acesso antecipado a novas features',
            'Análise de consumo avançada',
        ],
    },
};
