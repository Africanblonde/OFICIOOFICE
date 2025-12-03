import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    console.log('--- Create User Function Invoked ---');
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        console.log('Responding to OPTIONS preflight.');
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        console.log('Request received, method:', req.method);
        // Verificar se é POST
        if (req.method !== 'POST') {
            console.error('Error: Method not allowed.');
            return new Response(
                JSON.stringify({ error: 'Method not allowed' }),
                { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log('Parsing request body...');
        const { email, password, userData } = await req.json();
        console.log('Request body parsed:', { email, userData });

        // Validar dados recebidos
        if (!email || !password || !userData) {
            console.error('Error: Missing required fields.');
            return new Response(
                JSON.stringify({ error: 'Missing required fields: email, password, userData' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log('Creating Supabase admin client...');
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
        console.log('Supabase admin client created.');

        // 1. Criar usuário no Supabase Auth
        console.log('Creating user in Supabase Auth...');
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                name: userData.name,
                role: userData.role
            }
        });

        if (authError) {
            console.error('Auth user creation error:', authError);
            return new Response(
                JSON.stringify({ error: `Erro ao criar usuário no Auth: ${authError.message}` }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }
        console.log('Auth user created successfully:', authData.user.id);

        // 2. Criar perfil no public.users
        console.log('Inserting user profile into public.users...');
        const profilePayload = {
            id: authData.user.id,
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
        console.log('Profile payload:', profilePayload);

        const { error: profileError } = await supabaseAdmin
            .from('users')
            .upsert(profilePayload);

        if (profileError) {
            console.error('Profile insertion error:', profileError);
            // If profile creation fails, we might want to delete the auth user, 
            // but since we are upserting, it might just be a data error.
            // For safety, if it's a new user flow, we can still try to clean up if it was a critical failure.
            // But with upsert, we are safer.
            return new Response(
                JSON.stringify({ error: `Erro ao criar/atualizar perfil do usuário: ${profileError.message}` }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }
        console.log('User profile inserted successfully.');

        // Sucesso!
        console.log('--- Create User Function Success ---');
        return new Response(
            JSON.stringify({
                success: true,
                userId: authData.user.id,
                email: email,
                message: 'Usuário criado com sucesso!'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('--- Create User Function CRASH ---');
        console.error('Unexpected error:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Erro interno do servidor' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
})
