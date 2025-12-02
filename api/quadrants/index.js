import { createClient } from '@supabase/supabase-js';

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        return new Response(JSON.stringify({ error: 'Supabase credentials not configured' }), { status: 500 });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    if (req.method === 'GET') {
        const { data, error } = await supabase
            .from('quadrants')
            .select('id, name, updated_at')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

        if (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (req.method === 'POST') {
        try {
            const body = await req.json();
            const { name, data, id } = body;

            const payload = {
                user_id: user.id,
                name,
                data,
                updated_at: new Date()
            };

            if (id) {
                payload.id = id;
            } else {
                const { data: existing } = await supabase
                    .from('quadrants')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('name', name)
                    .maybeSingle();

                if (existing) {
                    payload.id = existing.id;
                }
            }

            const { data: savedData, error } = await supabase
                .from('quadrants')
                .upsert(payload)
                .select()
                .single();

            if (error) throw error;

            return new Response(JSON.stringify(savedData), {
                headers: { 'Content-Type': 'application/json' }
            });

        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
    }

    return new Response('Method Not Allowed', { status: 405 });
}
