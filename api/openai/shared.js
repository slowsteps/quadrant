import OpenAI from 'openai';

export const config = {
    runtime: 'edge',
};

export const extractJson = (text) => {
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

export const createOpenAIClient = () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OpenAI API key not configured');
    }
    return new OpenAI({ apiKey });
};

export const generateLogoUrl = (domain) => {
    if (domain && typeof domain === 'string') {
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    }
    return null;
};

export const sanitizeResult = (result) => {
    if (typeof result.xValue !== 'number' || typeof result.yValue !== 'number') {
        throw new Error('Invalid coordinates from AI');
    }

    if (!result.usps || !Array.isArray(result.usps)) {
        result.usps = [];
    }

    if (!result.specifications || typeof result.specifications !== 'object') {
        result.specifications = {};
    }

    if (!result.sources || !Array.isArray(result.sources)) {
        result.sources = [];
    }

    result.xValue = Math.max(0, Math.min(100, result.xValue));
    result.yValue = Math.max(0, Math.min(100, result.yValue));

    if (result.domain) {
        result.logoUrl = generateLogoUrl(result.domain);
    }

    return result;
};


export const constructPrompt = ({ type, params }) => {
    const {
        productName,
        domain,
        projectTitle,
        xAxis,
        yAxis,
        context,
        constraints = [],
        specifications = [],
        targetQuadrant,
        targetDescription,
        quadrantStats
    } = params;

    const constraintsText = constraints.length > 0
        ? `\nConstraints (MUST FOLLOW):\n${constraints.map(c => `- ${c}`).join('\n')}`
        : '\nConstraints: None';

    const specificationsText = specifications.length > 0
        ? `\nSpecifications to provide:\n${specifications.map(s => `- ${s}`).join('\n')}`
        : '';

    // Instructions shared across all prompt types
    const commonValues = `
1. xValue (0-100) - absolute position on X-axis (${xAxis.leftLabel} -> ${xAxis.rightLabel})
2. yValue (0-100) - absolute position on Y-axis (${yAxis.leftLabel} -> ${yAxis.rightLabel})
3. domain - the company's primary domain (e.g., "slack.com")${domain ? ` - verify or correct: "${domain}"` : ''}
4. reasoning - brief explanation (max 1 sentence)
5. usps - ${specifications.length > 0 ? `${Math.min(10, specifications.length + 5)}` : '5'} key highlights/specs (max 5 words each).
${specifications.length > 0 ? `6. specifications - values for: ${specifications.join(', ')}.` : ''}
7. sources - list of URLs found via web search if web search tool is used.`;

    const commonRules = `
IMPORTANT RULES:
- Use the FULL range 0-100. DO NOT default to 50.
- 0 means extremely "${xAxis.leftLabel}", 100 means extremely "${xAxis.rightLabel}".
- **ALWAYS use METRIC units**.
- If web search tool is used, **INCLUDE THE SOURCE URLs** in the 'sources' array.
${constraintsText}
${specificationsText}`;

    // JSON Structure Template
    const jsonStructure = `{
  "xValue": 15,
  "yValue": 85,
  "domain": "example.com",
  "reasoning": "...",
  "usps": ["USP 1", "USP 2", "USP 3", "USP 4", "USP 5"${specifications.length > 0 ? ', "USP 6", "USP 7"' : ''}]${specifications.length > 0 ? `,\n  "specifications": { ${specifications.map(s => `"${s}": "value"`).join(', ')} }` : ''},
  "sources": ["url1", "url2"]
}`;

    // --- ENRICH ---
    if (type === 'enrich') {
        return `Enrich the product "${productName}" for a quadrant map${projectTitle ? ` for the project "${projectTitle}"` : ''}.
Axes:
- X: ${xAxis.label} (${xAxis.leftLabel}=0, ${xAxis.rightLabel}=100)
- Y: ${yAxis.label} (${yAxis.leftLabel}=0, ${yAxis.rightLabel}=100)

Context (other products):
${context || "No other products yet."}

Based on general knowledge about "${productName}", provide:
${commonValues}

${commonRules}

Respond ONLY in JSON:
${jsonStructure}`;
    }

    // --- SUGGESTION ---
    if (type === 'suggestion') {
        return `You are analyzing a quadrant map${projectTitle ? ` for "${projectTitle}"` : ''}.
Axes:
- X: ${xAxis.label} (${xAxis.leftLabel}=0, ${xAxis.rightLabel}=100)
- Y: ${yAxis.label} (${yAxis.leftLabel}=0, ${yAxis.rightLabel}=100)

Current Distribution:
- Top-Right: ${quadrantStats.topRight}, Top-Left: ${quadrantStats.topLeft}
- Bottom-Right: ${quadrantStats.bottomRight}, Bottom-Left: ${quadrantStats.bottomLeft}

The ${targetQuadrant} quadrant (${targetDescription}) is underrepresented.

Task:
Suggest ONE REAL, EXISTING competing product/company for the ${targetQuadrant} quadrant.
- Must be REAL.
- Must fit the quadrant.
- **DO NOT** suggest products with idential or very similar names to those listed below in Active products.

Active products:
${context}

Provide details for the suggested product:
0. name - Product Name
${commonValues}

${commonRules}

Respond ONLY in JSON:
{
  "name": "Product Name",
  "xValue": 75,
  "yValue": 50,
  "domain": "example.com",
  "reasoning": "...",
  "usps": ["USP 1", "USP 2", ... ]${specifications.length > 0 ? `,\n  "specifications": { ${specifications.map(s => `"${s}": "value"`).join(', ')} }` : ''},
  "sources": ["url1", "url2"]
}`;
    }

    throw new Error(`Unknown prompt type: ${type}`);
};

export const handleError = (error) => {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
};
