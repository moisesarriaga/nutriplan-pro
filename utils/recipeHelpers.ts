
/**
 * Estimates the number of servings based on the instructions text or total calories.
 */
export const calculateServings = (instructions: string, totalCalories: number): number => {
    // 1. Try to find explicit mentions in text (e.g., "Rende 4 porções", "Serve 2 pessoas")
    const servingRegex = /(?:rende|serve|rendimento|porções|pessoas)\s*[:]?\s*(\d+)/i;
    const match = instructions.match(servingRegex);
    if (match) {
        return parseInt(match[1], 10);
    }

    // 2. Estimate based on calories (assuming ~600kcal per main meal portion)
    if (totalCalories > 0) {
        const estimated = Math.round(totalCalories / 600);
        return Math.max(1, estimated);
    }

    // 3. Fallback
    return 1;
};

/**
 * Normalizes calories to a per-serving value.
 */
export const getCaloriesPerServing = (totalCalories: number, servings: number): number => {
    if (!servings || servings <= 0) return totalCalories;
    return Math.round(totalCalories / servings);
};

/**
 * Calculates preparation time from instructions.
 */
export const calculatePrepTime = (instructions: string): string => {
    if (!instructions) return '30 min';

    const minuteRegex = /(\d+)\s*(?:minutos?|min|m\b)/gi;
    const hourRegex = /(\d+)\s*(?:horas?|h\b)/gi;

    let totalMinutes = 0;
    let match;

    while ((match = minuteRegex.exec(instructions)) !== null) {
        totalMinutes += parseInt(match[1], 10);
    }

    while ((match = hourRegex.exec(instructions)) !== null) {
        totalMinutes += parseInt(match[1], 10) * 60;
    }

    if (totalMinutes === 0) {
        const stepCount = instructions.split('\n').filter(s => s.trim().length > 0).length;
        return stepCount > 0 ? `${stepCount * 10} min` : '30 min';
    }

    if (totalMinutes < 60) {
        return `${totalMinutes} min`;
    }

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
};

/**
 * Calculates difficulty based on preparation time.
 */
export const calculateDifficulty = (timeString: string): string => {
    const minRegex = /(\d+)\s*min/;
    const hourRegex = /(\d+)\s*h/;

    let totalMinutes = 0;

    const hourMatch = timeString.match(hourRegex);
    if (hourMatch) {
        totalMinutes += parseInt(hourMatch[1], 10) * 60;
    }

    const minMatch = timeString.match(minRegex);
    if (minMatch) {
        totalMinutes += parseInt(minMatch[1], 10);
    }

    if (totalMinutes === 0) return 'Médio';

    if (totalMinutes <= 20) return 'Fácil';
    if (totalMinutes <= 60) return 'Médio';
    return 'Difícil';
};
