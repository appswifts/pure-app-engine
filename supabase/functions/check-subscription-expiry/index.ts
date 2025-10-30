import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting subscription expiry check...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
    const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

    // Find restaurants with subscriptions expiring in 7 days
    const { data: expiring7Days, error: error7 } = await supabase
      .from('restaurants')
      .select('id, name, phone, whatsapp_number, subscription_end_date, subscription_status')
      .eq('subscription_status', 'active')
      .lte('subscription_end_date', sevenDaysFromNow.toISOString())
      .gt('subscription_end_date', threeDaysFromNow.toISOString());

    // Find restaurants with subscriptions expiring in 3 days
    const { data: expiring3Days, error: error3 } = await supabase
      .from('restaurants')
      .select('id, name, phone, whatsapp_number, subscription_end_date, subscription_status')
      .eq('subscription_status', 'active')
      .lte('subscription_end_date', threeDaysFromNow.toISOString())
      .gt('subscription_end_date', now.toISOString());

    // Find restaurants with expired subscriptions (within last 3 days)
    const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
    const { data: recentlyExpired, error: errorExpired } = await supabase
      .from('restaurants')
      .select('id, name, phone, whatsapp_number, subscription_end_date, subscription_status')
      .in('subscription_status', ['expired', 'inactive'])
      .gte('subscription_end_date', threeDaysAgo.toISOString())
      .lt('subscription_end_date', now.toISOString());

    if (error7 || error3 || errorExpired) {
      console.error('Database query errors:', { error7, error3, errorExpired });
      throw new Error('Failed to query subscription data');
    }

    let notificationsSent = 0;
    const results: {
      sevenDay: Array<{ restaurant: string; status: string; error?: any; days?: number }>;
      threeDay: Array<{ restaurant: string; status: string; error?: any; days?: number }>;
      expired: Array<{ restaurant: string; status: string; error?: any }>;
    } = {
      sevenDay: [],
      threeDay: [],
      expired: []
    };

    // Send 7-day warnings
    if (expiring7Days && expiring7Days.length > 0) {
      console.log(`Found ${expiring7Days.length} subscriptions expiring in 7 days`);
      
      for (const restaurant of expiring7Days) {
        if (restaurant.whatsapp_number) {
          try {
            const daysRemaining = Math.ceil(
              (new Date(restaurant.subscription_end_date).getTime() - now.getTime()) / 
              (1000 * 60 * 60 * 24)
            );

            const response = await supabase.functions.invoke('send-whatsapp-notification', {
              body: {
                phone_number: restaurant.whatsapp_number,
                restaurant_name: restaurant.name,
                message_type: 'subscription_expiry_warning',
                days_remaining: daysRemaining
              }
            });

            if (response.error) {
              console.error(`Failed to send 7-day warning to ${restaurant.name}:`, response.error);
              results.sevenDay.push({ restaurant: restaurant.name, status: 'failed', error: response.error });
            } else {
              console.log(`7-day warning sent to ${restaurant.name}`);
              notificationsSent++;
              results.sevenDay.push({ restaurant: restaurant.name, status: 'sent', days: daysRemaining });
            }
          } catch (error) {
            console.error(`Error sending 7-day warning to ${restaurant.name}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            results.sevenDay.push({ restaurant: restaurant.name, status: 'error', error: errorMessage });
          }
        }
      }
    }

    // Send 3-day warnings
    if (expiring3Days && expiring3Days.length > 0) {
      console.log(`Found ${expiring3Days.length} subscriptions expiring in 3 days`);
      
      for (const restaurant of expiring3Days) {
        if (restaurant.whatsapp_number) {
          try {
            const daysRemaining = Math.ceil(
              (new Date(restaurant.subscription_end_date).getTime() - now.getTime()) / 
              (1000 * 60 * 60 * 24)
            );

            const response = await supabase.functions.invoke('send-whatsapp-notification', {
              body: {
                phone_number: restaurant.whatsapp_number,
                restaurant_name: restaurant.name,
                message_type: 'subscription_expiry_warning',
                days_remaining: daysRemaining
              }
            });

            if (response.error) {
              console.error(`Failed to send 3-day warning to ${restaurant.name}:`, response.error);
              results.threeDay.push({ restaurant: restaurant.name, status: 'failed', error: response.error });
            } else {
              console.log(`3-day warning sent to ${restaurant.name}`);
              notificationsSent++;
              results.threeDay.push({ restaurant: restaurant.name, status: 'sent', days: daysRemaining });
            }
          } catch (error) {
            console.error(`Error sending 3-day warning to ${restaurant.name}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            results.threeDay.push({ restaurant: restaurant.name, status: 'error', error: errorMessage });
          }
        }
      }
    }

    // Send expired notifications
    if (recentlyExpired && recentlyExpired.length > 0) {
      console.log(`Found ${recentlyExpired.length} recently expired subscriptions`);
      
      for (const restaurant of recentlyExpired) {
        if (restaurant.whatsapp_number) {
          try {
            const response = await supabase.functions.invoke('send-whatsapp-notification', {
              body: {
                phone_number: restaurant.whatsapp_number,
                restaurant_name: restaurant.name,
                message_type: 'subscription_expired'
              }
            });

            if (response.error) {
              console.error(`Failed to send expiry notification to ${restaurant.name}:`, response.error);
              results.expired.push({ restaurant: restaurant.name, status: 'failed', error: response.error });
            } else {
              console.log(`Expiry notification sent to ${restaurant.name}`);
              notificationsSent++;
              results.expired.push({ restaurant: restaurant.name, status: 'sent' });
            }
          } catch (error) {
            console.error(`Error sending expiry notification to ${restaurant.name}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            results.expired.push({ restaurant: restaurant.name, status: 'error', error: errorMessage });
          }
        }
      }
    }

    const summary = {
      success: true,
      timestamp: now.toISOString(),
      notifications_sent: notificationsSent,
      restaurants_checked: {
        expiring_7_days: expiring7Days?.length || 0,
        expiring_3_days: expiring3Days?.length || 0,
        recently_expired: recentlyExpired?.length || 0
      },
      results
    };

    console.log('Subscription expiry check completed:', summary);

    return new Response(
      JSON.stringify(summary),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in subscription expiry check:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});