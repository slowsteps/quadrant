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
        const { productName, domain, axes, activeXAxisId, activeYAxisId, otherProducts, projectTitle, constraints, specifications } = await req.json();
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

        const constraintsText = constraints && constraints.length > 0
            ? `\nConstraints to consider:\n${constraints.map(c => `- ${c}`).join('\n')}`
            : '';

        const specificationsText = specifications && specifications.length > 0
            ? `\nSpecifications to provide:\n${specifications.map(s => `- ${s}`).join('\n')}`
            : '';

        const prompt = `Enrich the product "${productName}" for a quadrant map${projectTitle ? ` for the project "${projectTitle}"` : ''} defined by:
X-Axis: ${xAxis.label} (${xAxis.leftLabel} = 0, ${xAxis.rightLabel} = 100)
Y-Axis: ${yAxis.label} (${yAxis.leftLabel} = 0, ${yAxis.rightLabel} = 100)

Context (other products):
${context || "No other products yet."}
${constraintsText}
${specificationsText}

Based on general knowledge about "${productName}", provide:
1. xValue (0-100) - position on X-axis
2. yValue (0-100) - position on Y-axis
3. domain - the company's primary domain (e.g., "slack.com", "microsoft.com")${domain ? ` - verify or correct: "${domain}"` : ''}
4. reasoning - brief explanation (max 1 sentence)
5. usps - ${specifications && specifications.length > 0 ? `${Math.min(10, specifications.length + 5)}` : '5'} key highlights (mix of specs and USPs, avoid marketing fluff). Examples: "Range: 300km", "Origin: USA", "Market Cap: $50B". Max 5 words each.
${specifications && specifications.length > 0 ? `6. specifications - object with values for: ${specifications.join(', ')}. For brands (not specific products), provide marketer-relevant data like Founded, Employees, Revenue, HQ Location. For products, provide product-specific specs.` : ''}

IMPORTANT:
- Use the FULL range from 0 to 100 for positioning
- 0 means extremely "${xAxis.leftLabel}" and 100 means extremely "${xAxis.rightLabel}"
- Do NOT default to 50
- Example: A very cheap product should be close to 0 on a Price axis (Low-High)
- Provide the actual company domain, not a generic one
- **ALWAYS use METRIC units** (km not miles, kg not lbs, °C not °F, etc.)
- For brands vs products: If "${productName}" is a brand/company name, provide brand-level specifications (e.g., Founded, Employees, Revenue). If it's a specific product, provide product specifications.

Respond ONLY in JSON:
{
  "xValue": 15,
  "yValue": 85,
  "domain": "example.com",
  "reasoning": "...",
  "usps": ["USP 1", "USP 2", "USP 3", "USP 4", "USP 5"${specifications && specifications.length > 0 ? ', "USP 6", "USP 7", "USP 8", "USP 9", "USP 10"' : ''}]${specifications && specifications.length > 0 ? `,\n  "specifications": { "Founded": "2008", "Employees": "50,000+", "Revenue": "$10B" }` : ''}
}`;

        const messages = [
            { role: "system", content: "You are a product expert. Respond with valid JSON only. Always use metric units." },
            { role: "user", content: prompt }
        ];

        const completionConfig = {
            model: "gpt-4o-mini",
            messages: messages,
            temperature: 0.5,
            max_tokens: 800
        };

        let completion = await openai.chat.completions.create(completionConfig);

        const responseText = completion.choices[0].message.content.trim();
        const result = extractJson(responseText);

        if (typeof result.xValue !== 'number' || typeof result.yValue !== 'number') {
            throw new Error('Invalid coordinates from AI');
        }

        if (!result.usps || !Array.isArray(result.usps)) {
            result.usps = [];
        }

        if (!result.specifications || typeof result.specifications !== 'object') {
            result.specifications = {};
        }

        result.xValue = Math.max(0, Math.min(100, result.xValue));
        result.yValue = Math.max(0, Math.min(100, result.yValue));

        // Generate logo URL from domain
        if (result.domain && typeof result.domain === 'string') {
            result.logoUrl = `https://www.google.com/s2/favicons?domain=${result.domain}&sz=128`;
        } else {
            result.logoUrl = null;
        }

        // Log which specifications were provided
        if (enableWebSearch && result.specifications && Object.keys(result.specifications).length > 0) {
            console.log(`Specifications provided for ${productName}:`);
            Object.entries(result.specifications).forEach(([key, value]) => {
                console.log(`  - ${key}: ${value}`);
            });
            console.log('');
        }

        return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
