import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Use service role key for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get user's restaurant
    const { data: restaurant, error: restaurantError } = await supabaseClient
      .from('restaurants')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (restaurantError || !restaurant) throw new Error("Restaurant not found for user");
    logStep("Restaurant found", { restaurantId: restaurant.id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if Stripe customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found, updating to inactive");
      
      // Update restaurant subscription status
      await supabaseClient
        .from('restaurants')
        .update({
          subscription_status: 'inactive',
          current_subscription_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', restaurant.id);

      return new Response(JSON.stringify({
        subscribed: false,
        status: 'inactive',
        subscription_tier: null,
        subscription_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    let subscriptionData: {
      subscribed: boolean;
      status: string;
      subscription_tier: string | null;
      subscription_end: string | null;
      trial_end: string | null;
    } = {
      subscribed: false,
      status: 'inactive',
      subscription_tier: null,
      subscription_end: null,
      trial_end: null,
    };

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
      const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null;
      
      logStep("Active subscription found", {
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd,
        trialEnd
      });

      // Determine subscription tier from the price
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      
      let subscriptionTier = "Basic";
      if (amount <= 999) {
        subscriptionTier = "Basic";
      } else if (amount <= 2999) {
        subscriptionTier = "Premium";
      } else {
        subscriptionTier = "Enterprise";
      }

      logStep("Determined subscription tier", { priceId, amount, subscriptionTier });

      subscriptionData = {
        subscribed: true,
        status: subscription.status === 'trialing' ? 'trial' : 'active',
        subscription_tier: subscriptionTier,
        subscription_end: currentPeriodEnd,
        trial_end: trialEnd,
      };

      // Update restaurant with subscription info
      await supabaseClient
        .from('restaurants')
        .update({
          subscription_status: subscription.status === 'trialing' ? 'trial' : 'active',
          subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
          subscription_end_date: currentPeriodEnd,
          trial_end_date: trialEnd,
          updated_at: new Date().toISOString(),
        })
        .eq('id', restaurant.id);

      // Update or create subscription record
      const { error: upsertError } = await supabaseClient
        .from('subscriptions')
        .upsert({
          restaurant_id: restaurant.id,
          plan_id: subscriptionTier.toLowerCase(),
          status: subscription.status === 'trialing' ? 'trialing' : 'active',
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: currentPeriodEnd,
          trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
          trial_end: trialEnd,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'restaurant_id'
        });

      if (upsertError) {
        logStep("WARNING: Failed to update subscription record", { error: upsertError });
      }

    } else {
      logStep("No active subscription found");
      
      // Update restaurant subscription status
      await supabaseClient
        .from('restaurants')
        .update({
          subscription_status: 'inactive',
          current_subscription_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', restaurant.id);
    }

    logStep("Updated database with subscription info", subscriptionData);
    return new Response(JSON.stringify(subscriptionData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});