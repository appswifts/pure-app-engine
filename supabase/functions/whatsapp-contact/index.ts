import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { restaurantId, itemName, itemPrice, currency } = await req.json();

    // Validate inputs
    if (!restaurantId || !itemName || !itemPrice || !currency) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for secure access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get restaurant details (including WhatsApp number)
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('name, whatsapp_number, subscription_status')
      .eq('id', restaurantId)
      .single();

    if (error || !restaurant) {
      console.error('Restaurant not found:', error);
      return new Response(
        JSON.stringify({ error: 'Restaurant not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if restaurant has valid subscription (security check)
    if (restaurant.subscription_status !== 'active' && restaurant.subscription_status !== 'trial') {
      return new Response(
        JSON.stringify({ error: 'Restaurant subscription is not active' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate WhatsApp number
    if (!restaurant.whatsapp_number || !restaurant.whatsapp_number.match(/^\+[1-9][0-9]{6,14}$/)) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing WhatsApp number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the order attempt for security monitoring
    await supabase
      .from('security_audit_log')
      .insert({
        table_name: 'whatsapp_orders',
        operation: 'ORDER_ATTEMPT',
        new_values: {
          restaurant_id: restaurantId,
          item_name: itemName,
          item_price: itemPrice,
          currency: currency,
          ip_address: req.headers.get('cf-connecting-ip') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown'
        }
      });

    // Return sanitized data (never expose full WhatsApp number in logs)
    return new Response(
      JSON.stringify({
        whatsappNumber: restaurant.whatsapp_number,
        restaurantName: restaurant.name
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('WhatsApp contact error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});