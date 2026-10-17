import { createClient } from "@supabase/supabase-js";

// These two values are public by design. Data is protected by row-level
// security rules in the database, so each client can only see their own records.
const SUPABASE_URL = "https://pcgnnersydheydendqhd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_62RZ8N-VzwMRcIMCip_now_rX4rROKW";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
