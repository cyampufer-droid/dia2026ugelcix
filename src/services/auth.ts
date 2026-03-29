// auth.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'your-supabase-url';
const supabaseAnonKey = 'your-supabase-anon-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const signup = async (email: string, password: string) => {
    const { user, error } = await supabase.auth.signUp({ email, password });
    return { user, error };
};

export const login = async (email: string, password: string) => {
    const { user, error } = await supabase.auth.signIn({ email, password });
    return { user, error };
};

export const logout = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
};

export const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
};