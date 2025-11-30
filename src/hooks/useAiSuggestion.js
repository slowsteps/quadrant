import { useState } from 'react';
import OpenAI from 'openai';

export function useAiSuggestion() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const generateSuggestion = async (products, axes, activeXAxisId, activeYAxisId) => {
        setIsLoading(true);
        setError(null);

        try {
            const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

            if (!apiKey) {
                throw new Error('OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env file.');
            }

            const openai = new OpenAI({
                apiKey,
                baseURL: `${window.location.origin}/api/openai`, // Proxy through Vite to avoid CORS
                dangerouslyAllowBrowser: true // Note: In production, API calls should go through a backend
            });

            // Get active axes
            const xAxis = axes.find(a => a.id === activeXAxisId);
            const yAxis = axes.find(a => a.id === activeYAxisId);

            // Build context about existing products
            const productContext = products.map(p => {
                const xValue = p.axisValues[activeXAxisId] || 50;
                const yValue = p.axisValues[activeYAxisId] || 50;
                return `- ${p.name}: ${xAxis.label}=${xValue}/100 (${xAxis.leftLabel} to ${xAxis.rightLabel}), ${yAxis.label}=${yValue}/100 (${yAxis.leftLabel} to ${yAxis.rightLabel})`;
            }).join('\n');

            // Analyze current product distribution
            const quadrants = {
                topRight: 0,    // High X, High Y
                topLeft: 0,     // Low X, High Y
                bottomRight: 0, // High X, Low Y
                bottomLeft: 0   // Low X, Low Y
            };

            products.forEach(p => {
                const x = p.axisValues[activeXAxisId] || 50;
                const y = p.axisValues[activeYAxisId] || 50;

                if (x >= 50 && y >= 50) quadrants.topRight++;
                else if (x < 50 && y >= 50) quadrants.topLeft++;
                else if (x >= 50 && y < 50) quadrants.bottomRight++;
                else quadrants.bottomLeft++;
            });

            // Find the least populated quadrant
            const entries = Object.entries(quadrants);
            entries.sort((a, b) => a[1] - b[1]);
            const targetQuadrant = entries[0][0];

            let targetDescription = "";
            switch (targetQuadrant) {
                case 'topRight': targetDescription = `High ${xAxis.label} and High ${yAxis.label}`; break;
                case 'topLeft': targetDescription = `Low ${xAxis.label} and High ${yAxis.label}`; break;
                case 'bottomRight': targetDescription = `High ${xAxis.label} and Low ${yAxis.label}`; break;
                case 'bottomLeft': targetDescription = `Low ${xAxis.label} and Low ${yAxis.label}`; break;
            }

            const prompt = `You are analyzing a product quadrant map. The current products and their positions are:

${productContext}

The axes are:
- X-axis: ${xAxis.label} (${xAxis.leftLabel} = 0, ${xAxis.rightLabel} = 100)
- Y-axis: ${yAxis.label} (${yAxis.leftLabel} = 0, ${yAxis.rightLabel} = 100)

Current distribution:
- Top-Right (High/High): ${quadrants.topRight} products
- Top-Left (Low/High): ${quadrants.topLeft} products
- Bottom-Right (High/Low): ${quadrants.bottomRight} products
- Bottom-Left (Low/Low): ${quadrants.bottomLeft} products

The ${targetQuadrant} quadrant (${targetDescription}) is currently underrepresented.

Suggest ONE REAL, EXISTING competing product that belongs in the ${targetQuadrant} quadrant (${targetDescription}) to balance the map. Consider:
1. A REAL product that actually exists (do not make up fake names)
2. Appropriate positioning specifically in the ${targetQuadrant} area
3. Fill a gap or represent a different strategic position
4. The company's primary domain name (e.g., "slack.com", "microsoft.com") for logo fetching

Respond ONLY in this exact JSON format (no markdown, no explanation):
{
  "name": "Product Name",
  "domain": "example.com",
  "xValue": 75,
  "yValue": 50,
  "reasoning": "Brief explanation of why this product fits here"
}`;

            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "You are a product strategy expert helping to analyze competitive landscapes. Always respond with valid JSON only."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 200
            });

            const responseText = completion.choices[0].message.content.trim();

            // Parse the JSON response
            let suggestion;
            try {
                suggestion = JSON.parse(responseText);
            } catch (parseError) {
                // Try to extract JSON if it's wrapped in markdown code blocks
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    suggestion = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('Failed to parse AI response');
                }
            }

            // Validate the suggestion
            if (!suggestion.name || typeof suggestion.xValue !== 'number' || typeof suggestion.yValue !== 'number') {
                throw new Error('Invalid suggestion format from AI');
            }

            // Clamp values to 0-100 range
            suggestion.xValue = Math.max(0, Math.min(100, suggestion.xValue));
            suggestion.yValue = Math.max(0, Math.min(100, suggestion.yValue));

            // Generate logo URL from domain if present
            if (suggestion.domain && typeof suggestion.domain === 'string') {
                // Use Google's favicon service which is very reliable
                suggestion.logoUrl = `https://www.google.com/s2/favicons?domain=${suggestion.domain}&sz=128`;
            } else {
                suggestion.logoUrl = null;
            }

            setIsLoading(false);
            return suggestion;

        } catch (err) {
            console.error('AI Suggestion Error:', err);
            setError(err.message);
            setIsLoading(false);
            throw err;
        }
    };

    const positionProduct = async (productName, axes, activeXAxisId, activeYAxisId, otherProducts) => {
        setIsLoading(true);
        setError(null);

        try {
            const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

            if (!apiKey) {
                throw new Error('OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env file.');
            }

            const openai = new OpenAI({
                apiKey,
                baseURL: `${window.location.origin}/api/openai`,
                dangerouslyAllowBrowser: true
            });

            const xAxis = axes.find(a => a.id === activeXAxisId);
            const yAxis = axes.find(a => a.id === activeYAxisId);

            // Context about other products to help relative positioning
            const context = otherProducts
                .filter(p => p.name !== productName)
                .slice(0, 10) // Limit context to avoid token limits
                .map(p => {
                    const x = p.axisValues[activeXAxisId] || 50;
                    const y = p.axisValues[activeYAxisId] || 50;
                    return `- ${p.name}: ${xAxis.label}=${x}, ${yAxis.label}=${y}`;
                }).join('\n');

            const prompt = `Estimate the position of the product "${productName}" on a quadrant map defined by:
X-Axis: ${xAxis.label} (${xAxis.leftLabel} = 0, ${xAxis.rightLabel} = 100)
Y-Axis: ${yAxis.label} (${yAxis.leftLabel} = 0, ${yAxis.rightLabel} = 100)

Context (other products):
${context || "No other products yet."}

Based on general knowledge about "${productName}", provide:
1. xValue (0-100)
2. yValue (0-100)
3. A brief reasoning (max 1 sentence)

IMPORTANT:
- Use the FULL range from 0 to 100. 
- 0 means extremely "${xAxis.leftLabel}" and 100 means extremely "${xAxis.rightLabel}".
- Do NOT default to 50. 
- Example: A very cheap product should be close to 0 on a Price axis (Low-High).
- Example: A very expensive product should be close to 100.

Respond ONLY in JSON:
{
  "xValue": 15,
  "yValue": 85,
  "reasoning": "..."
}`;

            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are a product expert. Respond with valid JSON only." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.5,
                max_tokens: 150
            });

            const responseText = completion.choices[0].message.content.trim();
            console.log("AI Response:", responseText);
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                const match = responseText.match(/\{[\s\S]*\}/);
                if (match) result = JSON.parse(match[0]);
                else throw new Error('Failed to parse AI response');
            }

            // Validate
            if (typeof result.xValue !== 'number' || typeof result.yValue !== 'number') {
                throw new Error('Invalid coordinates from AI');
            }

            // Clamp
            result.xValue = Math.max(0, Math.min(100, result.xValue));
            result.yValue = Math.max(0, Math.min(100, result.yValue));

            setIsLoading(false);
            return result;

        } catch (err) {
            console.error('AI Positioning Error:', err);
            setError(err.message);
            setIsLoading(false);
            throw err;
        }
    };

    return {
        generateSuggestion,
        positionProduct,
        isLoading,
        error
    };
}
