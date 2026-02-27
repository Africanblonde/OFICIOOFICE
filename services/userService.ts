import { supabase } from './supabaseClient';

export interface CreateUserPayload {
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
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: {
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
      }
    });

    if (error) {
      return { success: false, error: error.message || 'Falha ao criar utilizador' };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export default createUserWithEdge;
