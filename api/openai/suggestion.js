import { extractJson, createOpenAIClient, sanitizeResult, handleError, constructPrompt } from './shared.js';

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
            // return `- ${p.name}: ${xAxis.label}=${xValue}/100 (${xAxis.leftLabel} to ${xAxis.rightLabel}), ${yAxis.label}=${yValue}/100 (${yAxis.leftLabel} to ${yAxis.rightLabel})`;
            return `- ${p.name}`;
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

        const prompt = constructPrompt({
            type: 'suggestion',
            params: {
                projectTitle,
                xAxis,
                yAxis,
                context: productContext,
                constraints,
                specifications,
                targetQuadrant,
                targetDescription,
                quadrantStats: quadrants
            }
        });

        console.log("prompt: " + prompt);

        const messages = [
            { role: "system", content: "You are a product strategy expert helping to analyze competitive landscapes. Always respond with valid JSON only. Always use metric units." },
            { role: "user", content: prompt }
        ];

        const completionConfig = {
            model: "gpt-4.1-mini",
            input: messages,
            tools: [
                // { type: "web_search" },
            ],

        };

        let response = await openai.responses.create(completionConfig);

        const responseText = response.output_text;
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
