import { extractJson, createOpenAIClient, sanitizeResult, handleError } from './shared.js';

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const { products, axes, activeXAxisId, activeYAxisId, constraints, projectTitle, specifications } = await req.json();

        const openai = createOpenAIClient();

        const xAxis = axes.find(a => a.id === activeXAxisId);
        const yAxis = axes.find(a => a.id === activeYAxisId);

        const productContext = products.map(p => {
            const xValue = p.axisValues[activeXAxisId] || 50;
            const yValue = p.axisValues[activeYAxisId] || 50;
            return `- ${p.name}: ${xAxis.label}=${xValue}/100 (${xAxis.leftLabel} to ${xAxis.rightLabel}), ${yAxis.label}=${yValue}/100 (${yAxis.leftLabel} to ${yAxis.rightLabel})`;
        }).join('\n');

        const quadrants = { topRight: 0, topLeft: 0, bottomRight: 0, bottomLeft: 0 };
        products.forEach(p => {
            const x = p.axisValues[activeXAxisId] || 50;
            const y = p.axisValues[activeYAxisId] || 50;
            if (x >= 50 && y >= 50) quadrants.topRight++;
            else if (x < 50 && y >= 50) quadrants.topLeft++;
            else if (x >= 50 && y < 50) quadrants.bottomRight++;
            else quadrants.bottomLeft++;
        });

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

        const specificationsText = specifications && specifications.length > 0
            ? `\nSpecifications to provide:\n${specifications.map(s => `- ${s}`).join('\n')}`
            : '';

        const prompt = `You are analyzing a product quadrant map${projectTitle ? ` for the project "${projectTitle}"` : ''}. The current products and their positions are:

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

Constraints (MUST FOLLOW):
${constraints && constraints.length > 0 ? constraints.map(c => `- ${c}`).join('\n') : "None"}
${specificationsText}

Suggest ONE REAL, EXISTING competing product or company that belongs in the ${targetQuadrant} quadrant (${targetDescription}) to balance the map. Consider:
1. A REAL product or companythat actually exists (do not make up fake names)
2. Appropriate positioning specifically in the ${targetQuadrant} area
3. Fill a gap or represent a different strategic position
4. The company's primary domain name (e.g., "slack.com", "microsoft.com") for logo fetching
5. STRICTLY ADHERE to the provided constraints.
6. Provide ${specifications && specifications.length > 0 ? `${Math.min(10, specifications.length + 5)}` : '5'} key specifications or factual highlights (mix of specs and USPs, avoid marketing fluff). Max 3 words each. **ALWAYS use METRIC units** (km not miles, kg not lbs, °C not °F).
${specifications && specifications.length > 0 ? `7. Provide specification values for: ${specifications.join(', ')}. For brands, provide marketer-relevant data like Founded, Employees, Revenue, HQ Location.` : ''}

Respond ONLY in this exact JSON format (no markdown, no explanation):
{
  "name": "Product Name",
  "domain": "example.com",
  "xValue": 75,
  "yValue": 50,
  "reasoning": "Brief explanation of why this product fits here",
  "usps": ["USP 1", "USP 2", "USP 3", "USP 4", "USP 5"${specifications && specifications.length > 0 ? ', "USP 6", "USP 7", "USP 8", "USP 9", "USP 10"' : ''}]${specifications && specifications.length > 0 ? `,\n  "specifications": { "Founded": "2008", "Employees": "50,000+", "Revenue": "$10B" }` : ''}
}`;

        const messages = [
            { role: "system", content: "You are a product strategy expert helping to analyze competitive landscapes. Always respond with valid JSON only. Always use metric units." },
            { role: "user", content: prompt }
        ];

        const completionConfig = {
            model: "gpt-4o-mini",
            messages: messages,
            max_tokens: 800
        };

        let completion = await openai.chat.completions.create(completionConfig);

        const responseText = completion.choices[0].message.content.trim();
        const suggestion = extractJson(responseText);

        if (!suggestion.name) {
            throw new Error('Invalid suggestion format from AI: missing name');
        }

        const sanitizedSuggestion = sanitizeResult(suggestion);

        return new Response(JSON.stringify(sanitizedSuggestion), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return handleError(error);
    }
}
