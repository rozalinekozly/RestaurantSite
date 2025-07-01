import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

export const supabaseUrl = 'https://ldignxlbttqoqcvoycbj.supabase.co';
export const supabaseKey = 'eyJh...'; // truncated for clarity
export const supabase = createClient(supabaseUrl, supabaseKey);
