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

export const handleError = (error) => {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
};
