import { extractJson, createOpenAIClient, sanitizeResult, handleError, constructPrompt } from './shared.js';

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const { productName, domain, axes, activeXAxisId, activeYAxisId, otherProducts, projectTitle, constraints, specifications } = await req.json();

        const openai = createOpenAIClient();

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

        const prompt = constructPrompt({
            type: 'enrich',
            params: {
                productName,
                domain,
                projectTitle,
                xAxis,
                yAxis,
                context,
                constraints,
                specifications
            }
        });

        const messages = [
            { role: "system", content: "You are a product expert. Respond with valid JSON only. Always use metric units." },
            { role: "user", content: prompt }
        ];

        const completionConfig = {
            model: "gpt-4.1-mini",
            messages: messages,
            temperature: 0.5,
            max_tokens: 800
        };

        let completion = await openai.chat.completions.create(completionConfig);

        const responseText = completion.choices[0].message.content.trim();
        const result = extractJson(responseText);

        const sanitizedResult = sanitizeResult(result);

        return new Response(JSON.stringify(sanitizedResult), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return handleError(error);
    }
}
