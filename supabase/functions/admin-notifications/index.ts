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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, restaurantId, data }: NotificationRequest = await req.json();

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
      error: error.message || 'Internal server error' 
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