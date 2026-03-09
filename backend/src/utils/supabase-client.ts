import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';

let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
    if (supabaseClient) {
        return supabaseClient;
    }

    const supabaseUrl = config.SUPABASE_URL;
    const supabaseKey = config.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase storage credentials are not configured.');
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    return supabaseClient;
};
