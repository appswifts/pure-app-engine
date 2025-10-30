import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!endpointSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    
    logStep("Stripe keys verified");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Get the raw body and signature
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("Missing stripe-signature header");
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
      logStep("Event verified", { type: event.type, id: event.id });
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      const errorMessage = err instanceof Error ? err.message : 'Signature verification failed';
      return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
    }

    // Use service role key for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event, supabaseClient);
        break;
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionEvent(event, supabaseClient, stripe);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event, supabaseClient, stripe);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event, supabaseClient, stripe);
        break;
      
      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleCheckoutCompleted(event: Stripe.Event, supabaseClient: any) {
  const session = event.data.object as Stripe.Checkout.Session;
  logStep("Processing checkout completed", { sessionId: session.id, customerId: session.customer });

  if (session.mode === 'subscription' && session.customer && session.subscription) {
    // Find restaurant by customer ID  
    const { data: restaurant, error } = await supabaseClient
      .from('restaurants')
      .select('*')
      .eq('user_id', session.client_reference_id)
      .single();

    if (error || !restaurant) {
      logStep("Restaurant not found for checkout session", { customerId: session.customer });
      return;
    }

    // Update restaurant subscription status
    await supabaseClient
      .from('restaurants')
      .update({
        subscription_status: 'active',
        current_subscription_id: session.subscription,
        updated_at: new Date().toISOString(),
      })
      .eq('id', restaurant.id);

    logStep("Restaurant subscription activated", { restaurantId: restaurant.id });
  }
}

async function handleSubscriptionEvent(event: Stripe.Event, supabaseClient: any, stripe: Stripe) {
  const subscription = event.data.object as Stripe.Subscription;
  logStep("Processing subscription event", { 
    type: event.type, 
    subscriptionId: subscription.id, 
    status: subscription.status 
  });

  // Get customer details
  const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
  if (!customer.email) {
    logStep("Customer email not found", { customerId: subscription.customer });
    return;
  }

  // Find user by email
  const { data: userData } = await supabaseClient.auth.admin.getUserByEmail(customer.email);
  if (!userData.user) {
    logStep("User not found for email", { email: customer.email });
    return;
  }

  // Find restaurant
  const { data: restaurant } = await supabaseClient
    .from('restaurants')
    .select('*')
    .eq('user_id', userData.user.id)
    .single();

  if (!restaurant) {
    logStep("Restaurant not found for user", { userId: userData.user.id });
    return;
  }

  // Determine subscription tier
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

  // Update restaurant based on subscription status
  let updateData: any = {
    current_subscription_id: subscription.id,
    updated_at: new Date().toISOString(),
  };

  switch (subscription.status) {
    case 'active':
      updateData.subscription_status = 'active';
      updateData.subscription_start_date = new Date(subscription.current_period_start * 1000).toISOString();
      updateData.subscription_end_date = new Date(subscription.current_period_end * 1000).toISOString();
      if (subscription.trial_end) {
        updateData.trial_end_date = new Date(subscription.trial_end * 1000).toISOString();
      }
      break;
    
    case 'trialing':
      updateData.subscription_status = 'trial';
      updateData.trial_end_date = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null;
      updateData.subscription_end_date = new Date(subscription.current_period_end * 1000).toISOString();
      break;
    
    case 'canceled':
    case 'incomplete_expired':
    case 'unpaid':
      updateData.subscription_status = 'inactive';
      updateData.current_subscription_id = null;
      break;
    
    default:
      updateData.subscription_status = subscription.status;
  }

  await supabaseClient
    .from('restaurants')
    .update(updateData)
    .eq('id', restaurant.id);

  // Update or create subscription record
  await supabaseClient
    .from('subscriptions')
    .upsert({
      restaurant_id: restaurant.id,
      plan_id: subscriptionTier.toLowerCase(),
      status: subscription.status === 'trialing' ? 'trialing' : subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'restaurant_id'
    });

  logStep("Restaurant subscription updated", { 
    restaurantId: restaurant.id, 
    status: subscription.status,
    tier: subscriptionTier 
  });
}

async function handlePaymentSucceeded(event: Stripe.Event, supabaseClient: any, stripe: Stripe) {
  const invoice = event.data.object as Stripe.Invoice;
  logStep("Processing payment succeeded", { invoiceId: invoice.id, customerId: invoice.customer });

  if (invoice.subscription) {
    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    
    // Get customer details
    const customer = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer;
    if (!customer.email) return;

    // Find user and restaurant
    const { data: userData } = await supabaseClient.auth.admin.getUserByEmail(customer.email);
    if (!userData.user) return;

    const { data: restaurant } = await supabaseClient
      .from('restaurants')
      .select('*')
      .eq('user_id', userData.user.id)
      .single();

    if (!restaurant) return;

    // Update restaurant with successful payment
    await supabaseClient
      .from('restaurants')
      .update({
        subscription_status: 'active',
        last_payment_date: new Date().toISOString(),
        subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', restaurant.id);

    logStep("Payment recorded successfully", { restaurantId: restaurant.id });
  }
}

async function handlePaymentFailed(event: Stripe.Event, supabaseClient: any, stripe: Stripe) {
  const invoice = event.data.object as Stripe.Invoice;
  logStep("Processing payment failed", { invoiceId: invoice.id, customerId: invoice.customer });

  if (invoice.subscription) {
    // Get customer details
    const customer = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer;
    if (!customer.email) return;

    // Find user and restaurant
    const { data: userData } = await supabaseClient.auth.admin.getUserByEmail(customer.email);
    if (!userData.user) return;

    const { data: restaurant } = await supabaseClient
      .from('restaurants')
      .select('*')
      .eq('user_id', userData.user.id)
      .single();

    if (!restaurant) return;

    // Set grace period (7 days from now)
    const gracePeriodEnd = new Date();
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

    await supabaseClient
      .from('restaurants')
      .update({
        subscription_status: 'expired',
        grace_period_end_date: gracePeriodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', restaurant.id);

    logStep("Payment failure recorded", { restaurantId: restaurant.id });
  }
}