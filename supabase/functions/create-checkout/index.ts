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

    const { productId, subscriptionId, orderId } = await req.json();
    if (!productId) throw new Error("Product ID is required");
    logStep("Request body parsed", { productId, subscriptionId, orderId });

    // Get product details with Stripe price ID
    const { data: product, error: productError } = await supabaseClient
      .from('subscription_products')
      .select('*')
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (productError || !product) throw new Error("Product not found or inactive");
    if (!product.stripe_price_id) throw new Error("Stripe price ID not configured for this product");
    logStep("Product retrieved", { productName: product.name, price: product.price, stripePriceId: product.stripe_price_id });

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

    // Create checkout session using Stripe Price ID
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: product.stripe_price_id, // Use the Stripe price ID directly
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/dashboard/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/subscriptions?canceled=true`,
      client_reference_id: user.id, // Used in webhook to identify user
      metadata: {
        user_id: user.id,
        restaurant_id: restaurant.id,
        product_id: productId,
        subscription_id: subscriptionId,
        order_id: orderId,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Update existing subscription and order with Stripe session ID if provided
    if (subscriptionId) {
      await supabaseClient
        .from('customer_subscriptions')
        .update({
          stripe_checkout_session_id: session.id,
          stripe_customer_id: customerId,
        })
        .eq('id', subscriptionId);
      logStep("Subscription updated with Stripe session ID");
    }

    if (orderId) {
      await supabaseClient
        .from('subscription_orders')
        .update({
          gateway_transaction_id: session.id,
          payment_status: 'pending',
        })
        .eq('id', orderId);
      logStep("Order updated with Stripe session ID");
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