import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    console.log('--- Create User Function Invoked (v4 Safe) ---');

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        if (req.method !== 'POST') {
            return new Response(
                JSON.stringify({ error: 'Method not allowed' }),
                { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const body = await req.json();
        const { email, password, userData } = body;

        if (!email || !password || !userData) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // 1. Create Auth User
        console.log('Creating Auth User:', email);
        const authResponse = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                name: userData.name,
                role: userData.role
            }
        });

        if (authResponse.error) {
            console.error('Auth Error:', authResponse.error);
            return new Response(
                JSON.stringify({ error: `Auth Error: ${authResponse.error.message}` }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const userId = authResponse.data.user.id;
        console.log('Auth User Created:', userId);

        // 2. Upsert Profile
        const profilePayload = {
            id: userId,
            name: userData.name,
            role: userData.role,
            location_id: userData.locationId ?? null,
            job_title: userData.jobTitle ?? null,
            default_daily_goal: userData.defaultDailyGoal ?? null,
            daily_rate: userData.dailyRate ?? null,
            half_day_rate: userData.halfDayRate ?? null,
            absence_penalty: userData.absencePenalty ?? null,
            bonus_per_unit: userData.bonusPerUnit ?? null
        };

        console.log('Upserting Profile:', profilePayload);
        const profileResponse = await supabaseAdmin
            .from('users')
            .upsert(profilePayload);

        if (profileResponse.error) {
            const errorMsg = profileResponse.error?.message || JSON.stringify(profileResponse.error) || 'Unknown profile error';
            console.error('Profile Error:', profileResponse.error);
            // Note: We are NOT deleting the auth user here to avoid complex rollback logic.
            // The upsert ensures we can retry safely.
            return new Response(
                JSON.stringify({ error: `Profile Error: ${errorMsg}` }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log('Success!');
        return new Response(
            JSON.stringify({
                success: true,
                userId: userId,
                email: email,
                message: 'Usuário criado com sucesso!'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('CRITICAL ERROR:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Erro interno desconhecido' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
})
