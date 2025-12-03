import { useState } from 'react';

export function useAiSuggestion() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const generateSuggestion = async (products, axes, activeXAxisId, activeYAxisId, constraints = [], projectTitle = '', specifications = []) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/openai/suggestion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    products,
                    axes,
                    activeXAxisId,
                    activeYAxisId,
                    constraints,
                    projectTitle,
                    specifications
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `API Error: ${response.statusText}`);
            }

            const suggestion = await response.json();
            setIsLoading(false);
            return suggestion;

        } catch (err) {
            console.error('AI Suggestion Error:', err);
            setError(err.message);
            setIsLoading(false);
            throw err;
        }
    };

    const positionProduct = async (productName, axes, activeXAxisId, activeYAxisId, otherProducts, projectTitle = '') => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/openai/position', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productName,
                    axes,
                    activeXAxisId,
                    activeYAxisId,
                    otherProducts,
                    projectTitle
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `API Error: ${response.statusText}`);
            }

            const result = await response.json();
            setIsLoading(false);
            return result;

        } catch (err) {
            console.error('AI Positioning Error:', err);
            setError(err.message);
            setIsLoading(false);
            throw err;
        }
    };

    const enrichProduct = async (productName, domain, axes, activeXAxisId, activeYAxisId, otherProducts, projectTitle = '', constraints = [], specifications = []) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/openai/enrich', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productName,
                    domain,
                    axes,
                    activeXAxisId,
                    activeYAxisId,
                    otherProducts,
                    projectTitle,
                    constraints,
                    specifications
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `API Error: ${response.statusText}`);
            }

            const result = await response.json();
            setIsLoading(false);
            return result;

        } catch (err) {
            console.error('AI Enrichment Error:', err);
            setError(err.message);
            setIsLoading(false);
            throw err;
        }
    };

    return {
        generateSuggestion,
        positionProduct,
        enrichProduct,
        isLoading,
        error
    };
}
