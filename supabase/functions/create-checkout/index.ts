import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
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

    const { planId, billingInterval = 'monthly' } = await req.json();
    if (!planId) throw new Error("Plan ID is required");
    logStep("Request body parsed", { planId, billingInterval });

    // Get plan details
    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (planError || !plan) throw new Error("Plan not found or inactive");
    logStep("Plan retrieved", { planName: plan.name, price: plan.price });

    // Get user's restaurant
    const { data: restaurant, error: restaurantError } = await supabaseClient
      .from('restaurants')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (restaurantError || !restaurant) throw new Error("Restaurant not found for user");
    logStep("Restaurant found", { restaurantId: restaurant.id, name: restaurant.name });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if Stripe customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing Stripe customer found", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: restaurant.name,
      });
      customerId = customer.id;
      logStep("New Stripe customer created", { customerId });
    }

    // Calculate pricing
    const amount = billingInterval === 'yearly' ? plan.price * 12 : plan.price;
    logStep("Pricing calculated", { amount, interval: billingInterval });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: plan.currency.toLowerCase(),
            product_data: {
              name: `${plan.name} Plan - ${restaurant.name}`,
              description: plan.description || `${plan.name} subscription plan`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
            recurring: {
              interval: billingInterval === 'yearly' ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/subscription?success=true`,
      cancel_url: `${req.headers.get("origin")}/subscription?canceled=true`,
      metadata: {
        user_id: user.id,
        restaurant_id: restaurant.id,
        plan_id: planId,
        billing_interval: billingInterval,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Create pending subscription record
    const { error: subscriptionError } = await supabaseClient
      .from('subscriptions')
      .insert({
        restaurant_id: restaurant.id,
        plan_id: planId,
        status: 'pending',
        billing_interval: billingInterval,
        amount: amount,
        currency: plan.currency,
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + (plan.trial_days * 24 * 60 * 60 * 1000)).toISOString(),
        created_by: user.id,
      });

    if (subscriptionError) {
      logStep("WARNING: Failed to create subscription record", { error: subscriptionError });
    } else {
      logStep("Subscription record created");
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});