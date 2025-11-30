import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar se é POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { email, password, userData } = await req.json()

    // Validar dados recebidos
    if (!email || !password || !userData) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, userData' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar cliente Supabase com service_role (permissões admin)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,  // Auto-confirmar email
      user_metadata: {
        name: userData.name
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: `Erro ao criar usuário: ${authError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Criar perfil em public.users
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        name: userData.name,
        role: userData.role,
        location_id: userData.locationId,
        job_title: userData.jobTitle,
        default_daily_goal: userData.defaultDailyGoal,
        daily_rate: userData.dailyRate,
        half_day_rate: userData.halfDayRate,
        absence_penalty: userData.absencePenalty,
        bonus_per_unit: userData.bonusPerUnit
      })

    if (profileError) {
      console.error('Profile error:', profileError)
      
      // Se falhou ao criar perfil, deletar usuário do auth para manter consistência
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      
      return new Response(
        JSON.stringify({ error: `Erro ao criar perfil: ${profileError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sucesso!
    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: authData.user.id,
        email: email,
        message: 'Usuário criado com sucesso!' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
