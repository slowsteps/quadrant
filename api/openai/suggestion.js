import OpenAI from 'openai';

export const config = {
    runtime: 'edge',
};

const extractJson = (text) => {
    try {
        return JSON.parse(text);
    } catch (e) {
        const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
            try {
                return JSON.parse(codeBlockMatch[1]);
            } catch (e2) { }
        }
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            try {
                return JSON.parse(text.substring(firstBrace, lastBrace + 1));
            } catch (e3) { }
        }
        throw new Error(`Failed to parse AI response: ${text.substring(0, 100)}...`);
    }
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const { products, axes, activeXAxisId, activeYAxisId, constraints, projectTitle } = await req.json();
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), { status: 500 });
        }

        const openai = new OpenAI({ apiKey });

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

Suggest ONE REAL, EXISTING competing product that belongs in the ${targetQuadrant} quadrant (${targetDescription}) to balance the map. Consider:
1. A REAL product that actually exists (do not make up fake names)
2. Appropriate positioning specifically in the ${targetQuadrant} area
3. Fill a gap or represent a different strategic position
4. The company's primary domain name (e.g., "slack.com", "microsoft.com") for logo fetching
5. STRICTLY ADHERE to the provided constraints.
6. Provide 5 key specifications or factual highlights (mix of specs and USPs, avoid marketing fluff). Examples: "Range: 300mi", "Origin: USA", "Market Cap: $50B". Max 5 words each.

Respond ONLY in this exact JSON format (no markdown, no explanation):
{
  "name": "Product Name",
  "domain": "example.com",
  "xValue": 75,
  "yValue": 50,
  "reasoning": "Brief explanation of why this product fits here",
  "usps": ["USP 1", "USP 2", "USP 3", "USP 4", "USP 5"]
}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a product strategy expert helping to analyze competitive landscapes. Always respond with valid JSON only." },
                { role: "user", content: prompt }
            ],
            max_tokens: 500
        });

        const responseText = completion.choices[0].message.content.trim();
        const suggestion = extractJson(responseText);

        if (!suggestion.name || typeof suggestion.xValue !== 'number' || typeof suggestion.yValue !== 'number') {
            throw new Error('Invalid suggestion format from AI');
        }

        suggestion.xValue = Math.max(0, Math.min(100, suggestion.xValue));
        suggestion.yValue = Math.max(0, Math.min(100, suggestion.yValue));

        if (suggestion.domain && typeof suggestion.domain === 'string') {
            suggestion.logoUrl = `https://www.google.com/s2/favicons?domain=${suggestion.domain}&sz=128`;
        } else {
            suggestion.logoUrl = null;
        }

        return new Response(JSON.stringify(suggestion), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
