import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const TEST_USERS = [
  { email: 'admin@example.com', password: 'admin123', name: 'Admin User', role: 'ADMIN' },
  { email: 'manager@example.com', password: 'manager123', name: 'General Manager', role: 'GENERAL_MANAGER' },
  { email: 'worker@example.com', password: 'worker123', name: 'Worker User', role: 'WORKER' }
];

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const results = [];

    for (const user of TEST_USERS) {
      try {
        // Try to sign up each user
        const { data, error } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            name: user.name,
            role: user.role
          }
        });

        if (error) {
          results.push({
            email: user.email,
            success: false,
            message: error.message
          });
        } else {
          results.push({
            email: user.email,
            success: true,
            userId: data.user?.id,
            message: 'User created successfully'
          });
        }
      } catch (err) {
        results.push({
          email: user.email,
          success: false,
          message: err.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Test users setup complete',
        results
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
