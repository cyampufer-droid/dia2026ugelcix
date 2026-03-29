import { createClient } from '@supabase/supabase-js';

// Create a Supabase client using your Supabase URL and public anon key
const supabaseUrl = 'your_supabase_url';
const supabaseAnonKey = 'your_supabase_anon_key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to test Supabase connectivity
export const testConnection = async () => {
    const { error } = await supabase.from('your_table_name').select('*').limit(1);
    if (error) {
        console.error('Error testing connection:', error);
        return false;
    }
    console.log('Connection successful!');
    return true;
};

// Function to fetch institutions
export const fetchInstitutions = async () => {
    const { data, error } = await supabase.from('institutions').select('*');
    if (error) {
        console.error('Error fetching institutions:', error);
        return null;
    }
    return data;
};

// Function to create a new institution
export const createInstitution = async (institution) => {
    const { data, error } = await supabase.from('institutions').insert([institution]);
    if (error) {
        console.error('Error creating institution:', error);
        return null;
    }
    return data;
};
