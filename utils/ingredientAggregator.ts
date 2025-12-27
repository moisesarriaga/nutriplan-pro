export interface AggregatedIngredient {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    checked: boolean;
}

/**
 * Normalize ingredient names for better matching
 */
export const normalizeIngredientName = (name: string): string => {
    return name.toLowerCase().trim()
        .replace(/\s+/g, ' ') // normalize spaces
        .replace(/^(o|a|os|as|um|uma)\s+/i, ''); // remove articles
};

/**
 * Convert units to base units (g or ml)
 */
export const convertToBaseUnit = (quantity: number, unit: string): { quantity: number; unit: string } => {
    const lowerUnit = unit.toLowerCase();

    // Weight conversions
    if (lowerUnit === 'kg') {
        return { quantity: quantity * 1000, unit: 'g' };
    }

    // Volume conversions
    if (lowerUnit === 'l' || lowerUnit === 'litro' || lowerUnit === 'litros') {
        return { quantity: quantity * 1000, unit: 'ml' };
    }

    // Already in base unit
    if (lowerUnit === 'g' || lowerUnit === 'grama' || lowerUnit === 'gramas') {
        return { quantity, unit: 'g' };
    }

    if (lowerUnit === 'ml' || lowerUnit === 'mililitro' || lowerUnit === 'mililitros') {
        return { quantity, unit: 'ml' };
    }

    // Keep as is for other units (unidade, colher, xícara, etc.)
    return { quantity, unit };
};

/**
 * Normalize units from base to display format (g→kg if ≥1000, ml→L if ≥1000)
 */
export const normalizeDisplayUnit = (quantity: number, unit: string): { quantity: number; unit: string } => {
    const lowerUnit = unit.toLowerCase();

    // Convert g to kg if ≥ 1000g
    if (lowerUnit === 'g' && quantity >= 1000) {
        return { quantity: quantity / 1000, unit: 'kg' };
    }

    // Convert ml to L if ≥ 1000ml
    if (lowerUnit === 'ml' && quantity >= 1000) {
        return { quantity: quantity / 1000, unit: 'L' };
    }

    return { quantity, unit };
};

/**
 * Aggregate ingredients from multiple recipes
 * Groups by normalized name and sums quantities (converting to same unit)
 */
export const aggregateIngredients = (
    ingredients: Array<{ id?: string; name: string; quantity: number; unit: string }>
): AggregatedIngredient[] => {
    const aggregationMap = new Map<string, { name: string; quantity: number; unit: string; originalName: string }>();

    ingredients.forEach((ing) => {
        const normalizedName = normalizeIngredientName(ing.name);
        const { quantity: baseQuantity, unit: baseUnit } = convertToBaseUnit(ing.quantity, ing.unit);

        if (aggregationMap.has(normalizedName)) {
            const existing = aggregationMap.get(normalizedName)!;

            // Only sum if units are compatible
            if (existing.unit === baseUnit) {
                existing.quantity += baseQuantity;
            } else {
                // Different units, keep as separate items
                const key = `${normalizedName}_${baseUnit}`;
                aggregationMap.set(key, {
                    name: ing.name,
                    quantity: baseQuantity,
                    unit: baseUnit,
                    originalName: ing.name
                });
            }
        } else {
            aggregationMap.set(normalizedName, {
                name: ing.name,
                quantity: baseQuantity,
                unit: baseUnit,
                originalName: ing.name
            });
        }
    });

    // Convert back to display units and create final list
    const aggregatedList: AggregatedIngredient[] = [];

    aggregationMap.forEach((value, key) => {
        const { quantity, unit } = normalizeDisplayUnit(value.quantity, value.unit);

        aggregatedList.push({
            id: key,
            name: value.originalName,
            quantity: Math.round(quantity * 100) / 100, // Round to 2 decimal places
            unit,
            checked: true
        });
    });

    return aggregatedList.sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Example usage:
 * 
 * const ingredients = [
 *   { name: 'Farinha de trigo', quantity: 450, unit: 'g' },
 *   { name: 'farinha de trigo', quantity: 600, unit: 'g' },
 *   { name: 'Leite', quantity: 500, unit: 'ml' },
 *   { name: 'leite', quantity: 600, unit: 'ml' }
 * ];
 * 
 * const result = aggregateIngredients(ingredients);
 * // Result:
 * // [
 * //   { id: 'farinha de trigo', name: 'Farinha de trigo', quantity: 1.05, unit: 'kg', checked: true },
 * //   { id: 'leite', name: 'Leite', quantity: 1.1, unit: 'L', checked: true }
 * // ]
 */
