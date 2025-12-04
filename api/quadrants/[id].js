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

    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();

    if (req.method === 'GET') {
        const { data, error } = await supabase
            .from('quadrants')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        if (data.user_id !== user.id) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
        }

        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (req.method === 'DELETE') {
        // Verify ownership before deleting
        const { data: existing, error: fetchError } = await supabase
            .from('quadrants')
            .select('user_id')
            .eq('id', id)
            .single();

        if (fetchError) {
            return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
        }

        if (existing.user_id !== user.id) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
        }

        const { error } = await supabase
            .from('quadrants')
            .delete()
            .eq('id', id);

        if (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response('Method Not Allowed', { status: 405 });
}
