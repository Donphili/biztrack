// Called once a day by Vercel (see vercel.json) so the free Supabase project
// keeps receiving activity and is not paused for inactivity.
const SUPABASE_URL = "https://pcgnnersydheydendqhd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_62RZ8N-VzwMRcIMCip_now_rX4rROKW";

export default async function handler(request, response) {
  try {
    const result = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` },
    });
    response.status(200).json({ ok: result.ok, status: result.status, at: new Date().toISOString() });
  } catch (error) {
    response.status(200).json({ ok: false, error: String(error), at: new Date().toISOString() });
  }
}
