import { supabase } from './supabaseClient';

interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: string;
  locationId?: string | null;
  jobTitle?: string | null;
  defaultDailyGoal?: number | null;
  dailyRate?: number | null;
  halfDayRate?: number | null;
  absencePenalty?: number | null;
  bonusPerUnit?: number | null;
}

export async function createUserWithEdge(payload: CreateUserPayload) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kwnbyiqzrphkembkwyvd.supabase.co';

    const response = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
        userData: {
          name: payload.name,
          role: payload.role,
          locationId: payload.locationId,
          jobTitle: payload.jobTitle,
          defaultDailyGoal: payload.defaultDailyGoal,
          dailyRate: payload.dailyRate,
          halfDayRate: payload.halfDayRate,
          absencePenalty: payload.absencePenalty,
          bonusPerUnit: payload.bonusPerUnit
        }
      })
    });

    const text = await response.text();
    let result: any = {};
    try { result = text ? JSON.parse(text) : {}; } catch (e) { return { success: false, error: 'Invalid JSON response from Edge Function', raw: text }; }

    if (!response.ok) {
      return { success: false, error: result.error || result.message || `Status ${response.status}`, status: response.status };
    }

    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export default createUserWithEdge;
