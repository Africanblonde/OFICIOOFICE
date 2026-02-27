import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL');
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY');
const RECAPTCHA_SECRET = Deno.env.get('RECAPTCHA_SECRET');

console.log('Using service role from env:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'SUPABASE_SERVICE_ROLE_KEY' : (Deno.env.get('SERVICE_ROLE_KEY') ? 'SERVICE_ROLE_KEY' : 'none'));

const supabaseAdmin = createClient(
  SUPABASE_URL ?? '',
  SERVICE_ROLE ?? '',
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

async function verifyRecaptcha(token: string | undefined) {
  if (!RECAPTCHA_SECRET || !token) return true; // Not configured -> skip
  try {
    const resp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(RECAPTCHA_SECRET)}&response=${encodeURIComponent(token)}`
    });
    const body = await resp.json();
    return body.success === true;
  } catch (err) {
    console.error('recaptcha verify error', err);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const { email, password, name, jobTitle, role, companyName, companyAddress, captchaToken } = payload || {};

  if (!email || !password || !name) {
    return new Response(JSON.stringify({ error: 'Missing required fields: email, password, name' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  if (typeof password !== 'string' || password.length < 6) {
    return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const captchaOk = await verifyRecaptcha(captchaToken);
  if (!captchaOk) {
    return new Response(JSON.stringify({ error: 'reCAPTCHA validation failed' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const createResp = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        name,
        job_title: jobTitle ?? null,
        role: role ?? null,
        company: {
          name: companyName ?? null,
          address: companyAddress ?? null
        }
      }
    });

    if (createResp.error) {
      console.error('admin.createUser error', createResp.error);
      return new Response(JSON.stringify({ error: createResp.error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true, user: createResp.data?.user ?? null }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('create-account error', err);
    return new Response(JSON.stringify({ error: err?.message || 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
