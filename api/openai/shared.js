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

    const commonInstructions = `
4. The company's primary domain name (e.g., "slack.com", "microsoft.com")${domain ? ` - verify or correct: "${domain}"` : ''}
5. STRICTLY ADHERE to the provided constraints.
6. Provide ${specifications.length > 0 ? `${Math.min(10, specifications.length + 5)}` : '5'} key specifications or factual highlights (mix of specs and USPs, avoid marketing fluff). Max 3 words each. **ALWAYS use METRIC units** (km not miles, kg not lbs, °C not °F).
${specifications.length > 0 ? `7. Provide specification values for: ${specifications.join(', ')}. For brands, provide marketer-relevant data like Founded, Employees, Revenue, HQ Location.` : ''}`;

    if (type === 'enrich') {
        return `Enrich the product "${productName}" for a quadrant map${projectTitle ? ` for the project "${projectTitle}"` : ''} defined by:
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
5. usps - ${specifications.length > 0 ? `${Math.min(10, specifications.length + 5)}` : '5'} key highlights (mix of specs and USPs, avoid marketing fluff). Examples: "Range: 300km", "Origin: USA", "Market Cap: $50B". Max 5 words each.
${specifications.length > 0 ? `6. specifications - object with values for: ${specifications.join(', ')}. For brands (not specific products), provide marketer-relevant data like Founded, Employees, Revenue, HQ Location. For products, provide product-specific specs.` : ''}

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
  "usps": ["USP 1", "USP 2", "USP 3", "USP 4", "USP 5"${specifications.length > 0 ? ', "USP 6", "USP 7", "USP 8", "USP 9", "USP 10"' : ''}]${specifications.length > 0 ? `,\n  "specifications": { ${specifications.map(s => `"${s}": "value"`).join(', ')} }` : ''}
}`;
    }

    if (type === 'suggestion') {
        return `You are analyzing a product quadrant map${projectTitle ? ` for the project "${projectTitle}"` : ''}. The current products and their positions are:

${context}

The axes are:
- X-axis: ${xAxis.label} (${xAxis.leftLabel} = 0, ${xAxis.rightLabel} = 100)
- Y-axis: ${yAxis.label} (${yAxis.leftLabel} = 0, ${yAxis.rightLabel} = 100)

Current distribution:
- Top-Right (High/High): ${quadrantStats.topRight} products
- Top-Left (Low/High): ${quadrantStats.topLeft} products
- Bottom-Right (High/Low): ${quadrantStats.bottomRight} products
- Bottom-Left (Low/Low): ${quadrantStats.bottomLeft} products

The ${targetQuadrant} quadrant (${targetDescription}) is currently underrepresented.

${constraintsText}
${specificationsText}

Suggest ONE REAL, EXISTING competing product or company that belongs in the ${targetQuadrant} quadrant (${targetDescription}) to balance the map. Consider:
1. A REAL product or company that actually exists (do not make up fake names)
2. Appropriate positioning specifically in the ${targetQuadrant} area
3. Fill a gap or represent a different strategic position
${commonInstructions}

Respond ONLY in this exact JSON format (no markdown, no explanation):
{
  "name": "Product Name",
  "domain": "example.com",
  "xValue": 75,
  "yValue": 50,
  "reasoning": "Brief explanation of why this product fits here",
  "usps": ["USP 1", "USP 2", "USP 3", "USP 4", "USP 5"${specifications.length > 0 ? ', "USP 6", "USP 7", "USP 8", "USP 9", "USP 10"' : ''}]${specifications.length > 0 ? `,\n  "specifications": { ${specifications.map(s => `"${s}": "value"`).join(', ')} }` : ''}
}`;
    }

    if (type === 'position') {
        return `Estimate the position of the product "${productName}" on a quadrant map${projectTitle ? ` for the project "${projectTitle}"` : ''} defined by:
X-Axis: ${xAxis.label} (${xAxis.leftLabel} = 0, ${xAxis.rightLabel} = 100)
Y-Axis: ${yAxis.label} (${yAxis.leftLabel} = 0, ${yAxis.rightLabel} = 100)

Context (other products):
${context || "No other products yet."}
${constraintsText}
${specificationsText}

Based on general knowledge about "${productName}", provide:
1. xValue (0-100)
2. yValue (0-100)
3. A brief reasoning (max 1 sentence)
4. 5 key specifications or factual highlights (mix of specs and USPs, avoid marketing fluff). Examples: "Range: 300mi", "Origin: USA", "Market Cap: $50B". Max 5 words each.
${specifications.length > 0 ? `5. specifications - object with values for: ${specifications.join(', ')}. For brands, provide marketer-relevant data like Founded, Employees, Revenue, HQ Location. For products, provide product-specific specs.` : ''}

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
  "usps": ["USP 1", "USP 2", "USP 3", "USP 4", "USP 5"]${specifications.length > 0 ? `,\n  "specifications": { ${specifications.map(s => `"${s}": "value"`).join(', ')} }` : ''}
}`;
    }
};

export const handleError = (error) => {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
};
