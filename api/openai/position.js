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
        const { productName, axes, activeXAxisId, activeYAxisId, otherProducts, projectTitle } = await req.json();
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), { status: 500 });
        }

        const openai = new OpenAI({ apiKey });

        const xAxis = axes.find(a => a.id === activeXAxisId);
        const yAxis = axes.find(a => a.id === activeYAxisId);

        const context = otherProducts
            .filter(p => p.name !== productName)
            .slice(0, 10)
            .map(p => {
                const x = p.axisValues[activeXAxisId] || 50;
                const y = p.axisValues[activeYAxisId] || 50;
                return `- ${p.name}: ${xAxis.label}=${x}, ${yAxis.label}=${y}`;
            }).join('\n');

        const prompt = `Estimate the position of the product "${productName}" on a quadrant map${projectTitle ? ` for the project "${projectTitle}"` : ''} defined by:
X-Axis: ${xAxis.label} (${xAxis.leftLabel} = 0, ${xAxis.rightLabel} = 100)
Y-Axis: ${yAxis.label} (${yAxis.leftLabel} = 0, ${yAxis.rightLabel} = 100)

Context (other products):
${context || "No other products yet."}

Based on general knowledge about "${productName}", provide:
1. xValue (0-100)
2. yValue (0-100)
3. A brief reasoning (max 1 sentence)
4. 5 key specifications or factual highlights (mix of specs and USPs, avoid marketing fluff). Examples: "Range: 300mi", "Origin: USA", "Market Cap: $50B". Max 5 words each.

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
  "reasoning": "...",
  "usps": ["USP 1", "USP 2", "USP 3", "USP 4", "USP 5"]
}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a product expert. Respond with valid JSON only." },
                { role: "user", content: prompt }
            ],
            max_tokens: 500
        });

        const responseText = completion.choices[0].message.content.trim();
        const result = extractJson(responseText);

        if (typeof result.xValue !== 'number' || typeof result.yValue !== 'number') {
            throw new Error('Invalid coordinates from AI');
        }

        if (!result.usps || !Array.isArray(result.usps)) {
            result.usps = [];
        }

        result.xValue = Math.max(0, Math.min(100, result.xValue));
        result.yValue = Math.max(0, Math.min(100, result.yValue));

        return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
