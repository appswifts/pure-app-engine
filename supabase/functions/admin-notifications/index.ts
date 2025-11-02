import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  type: 'new_restaurant' | 'payment_proof' | 'subscription_renewal' | 'trial_ending';
  restaurantId: string;
  data: any;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Rate limiting map: restaurant_id -> { count, resetTime }
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { type, restaurantId, data }: NotificationRequest = await req.json();

    // Validate input
    if (!type || !restaurantId) {
      return new Response(
        JSON.stringify({ error: 'Type and restaurantId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validTypes = ['new_restaurant', 'payment_proof', 'subscription_renewal', 'trial_ending'];
    if (!validTypes.includes(type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid notification type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin OR owns the restaurant
    const { data: isAdminData } = await supabase.rpc('is_admin', { _user_id: user.id });
    const isAdmin = isAdminData === true;

    if (!isAdmin) {
      // Verify restaurant ownership
      const { data: restaurant, error: ownershipError } = await supabase
        .from('restaurants')
        .select('id')
        .eq('id', restaurantId)
        .eq('user_id', user.id)
        .single();

      if (ownershipError || !restaurant) {
        return new Response(
          JSON.stringify({ error: 'You do not have permission to send notifications for this restaurant' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Rate limiting: 10 notifications per hour per restaurant
    const now = Date.now();
    const restaurantLimit = rateLimitMap.get(restaurantId);
    
    if (restaurantLimit) {
      if (now < restaurantLimit.resetTime) {
        if (restaurantLimit.count >= 10) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded. Maximum 10 notifications per hour per restaurant.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        restaurantLimit.count++;
      } else {
        rateLimitMap.set(restaurantId, { count: 1, resetTime: now + 3600000 }); // 1 hour
      }
    } else {
      rateLimitMap.set(restaurantId, { count: 1, resetTime: now + 3600000 });
    }

    console.log(`Processing admin notification: ${type} for restaurant ${restaurantId}`);

    // Get restaurant details
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('name, email, phone, user_id')
      .eq('id', restaurantId)
      .single();

    if (restaurantError) {
      throw new Error(`Failed to get restaurant: ${restaurantError.message}`);
    }

    // Get admin users
    const { data: admins, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (adminError) {
      console.error('Failed to get admin users:', adminError);
    }

    let notificationMessage = '';
    let notificationTitle = '';

    switch (type) {
      case 'new_restaurant':
        notificationTitle = 'New Restaurant Registration';
        notificationMessage = `New restaurant "${restaurant.name}" has registered and needs subscription setup. Contact: ${restaurant.email}`;
        break;
        
      case 'payment_proof':
        notificationTitle = 'Payment Proof Submitted';
        notificationMessage = `Restaurant "${restaurant.name}" has submitted payment proof for amount ${data.amount} ${data.currency}. Reference: ${data.reference}`;
        break;
        
      case 'subscription_renewal':
        notificationTitle = 'Subscription Renewal Required';
        notificationMessage = `Restaurant "${restaurant.name}" subscription expires on ${new Date(data.expiryDate).toLocaleDateString()}. Action required.`;
        break;
        
      case 'trial_ending':
        notificationTitle = 'Trial Period Ending';
        notificationMessage = `Restaurant "${restaurant.name}" trial period ends in ${data.daysRemaining} days. Follow up required.`;
        break;
        
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    // Store notification in database for admin dashboard
    const { error: notificationError } = await supabase
      .from('admin_notifications')
      .insert({
        type,
        title: notificationTitle,
        message: notificationMessage,
        restaurant_id: restaurantId,
        data: data,
        status: 'unread'
      });

    if (notificationError) {
      console.error('Failed to store notification:', notificationError);
    }

    // Send WhatsApp notification to admins (if configured)
    const whatsappToken = Deno.env.get('WHATSAPP_TOKEN');
    const whatsappPhoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    
    if (whatsappToken && whatsappPhoneId && admins && admins.length > 0) {
      try {
        // Get admin phone numbers
        const { data: adminProfiles, error: profileError } = await supabase
          .from('profiles')
          .select('phone')
          .in('id', admins.map(a => a.user_id))
          .not('phone', 'is', null);

        if (!profileError && adminProfiles && adminProfiles.length > 0) {
          for (const profile of adminProfiles) {
            if (profile.phone && profile.phone.startsWith('+')) {
              // Send WhatsApp message
              const whatsappResponse = await fetch(`https://graph.facebook.com/v18.0/${whatsappPhoneId}/messages`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${whatsappToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  messaging_product: 'whatsapp',
                  to: profile.phone.replace('+', ''),
                  type: 'text',
                  text: {
                    body: `🔔 ${notificationTitle}\n\n${notificationMessage}`
                  }
                })
              });

              if (!whatsappResponse.ok) {
                console.error('Failed to send WhatsApp notification:', await whatsappResponse.text());
              } else {
                console.log(`WhatsApp notification sent to ${profile.phone}`);
              }
            }
          }
        }
      } catch (whatsappError) {
        console.error('WhatsApp notification error:', whatsappError);
        // Don't fail the entire function if WhatsApp fails
      }
    }

    // Send email notification to admins (if configured)
    try {
      const { error: emailError } = await supabase.functions.invoke('send-admin-email', {
        body: {
          type,
          title: notificationTitle,
          message: notificationMessage,
          restaurantData: restaurant,
          additionalData: data
        }
      });

      if (emailError) {
        console.error('Failed to send email notification:', emailError);
      }
    } catch (emailError) {
      console.error('Email notification error:', emailError);
      // Don't fail the entire function if email fails
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Admin notification sent successfully' 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in admin-notifications function:", error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to process notification'
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json", 
        ...corsHeaders 
      },
    });
  }
};

serve(handler);