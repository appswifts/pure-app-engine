import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppMessage {
  phone_number: string;
  restaurant_name: string;
  message_type: 'subscription_expiry_warning' | 'subscription_expired' | 'payment_reminder';
  days_remaining?: number;
  amount_due?: number;
  currency?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_TOKEN');
    const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      console.error('WhatsApp credentials not configured');
      return new Response(
        JSON.stringify({ error: 'WhatsApp credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      phone_number, 
      restaurant_name, 
      message_type, 
      days_remaining, 
      amount_due, 
      currency = 'RWF' 
    }: WhatsAppMessage = await req.json();

    // Validate phone number format (remove any non-digits except +)
    const cleanPhoneNumber = phone_number.replace(/[^\d+]/g, '');
    
    // Remove + if present for WhatsApp API
    const whatsappNumber = cleanPhoneNumber.startsWith('+') ? cleanPhoneNumber.slice(1) : cleanPhoneNumber;

    // Generate message based on type
    let messageText = '';
    
    switch (message_type) {
      case 'subscription_expiry_warning':
        messageText = `🔔 *MenuForest Subscription Reminder*\n\n` +
          `Hi ${restaurant_name}! 👋\n\n` +
          `Your MenuForest subscription will expire in *${days_remaining} days* on your current plan.\n\n` +
          `To avoid any interruption to your QR menu service, please renew your subscription soon.\n\n` +
          `💡 *Benefits of staying active:*\n` +
          `• Keep your QR menus accessible to customers\n` +
          `• Continue receiving orders via WhatsApp\n` +
          `• Access to all menu management features\n\n` +
          `Need help with renewal? Just reply to this message!\n\n` +
          `Thank you for choosing MenuForest! 🍽️`;
        break;
        
      case 'subscription_expired':
        messageText = `⚠️ *MenuForest Subscription Expired*\n\n` +
          `Hi ${restaurant_name},\n\n` +
          `Your MenuForest subscription has expired. Your QR menus are now restricted and customers cannot access your full menu.\n\n` +
          `To restore full service immediately:\n` +
          `1️⃣ Make your renewal payment\n` +
          `2️⃣ Send us the payment confirmation\n` +
          `3️⃣ We'll activate your account within hours\n\n` +
          `Don't lose potential customers - renew today! 💼\n\n` +
          `Reply to this message for payment details.`;
        break;
        
      case 'payment_reminder':
        const amountText = amount_due ? `${amount_due.toLocaleString()} ${currency}` : 'your subscription amount';
        messageText = `💳 *Payment Reminder - MenuForest*\n\n` +
          `Hi ${restaurant_name},\n\n` +
          `This is a friendly reminder that your payment of *${amountText}* is due soon.\n\n` +
          `To ensure uninterrupted service, please process your payment at your earliest convenience.\n\n` +
          `Payment methods available:\n` +
          `💸 Mobile Money\n` +
          `🏦 Bank Transfer\n\n` +
          `Reply to this message for payment instructions!\n\n` +
          `Thank you! 🙏`;
        break;
        
      default:
        throw new Error('Invalid message type');
    }

    // Send WhatsApp message using Graph API
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: whatsappNumber,
          type: 'text',
          text: {
            body: messageText
          }
        })
      }
    );

    const responseData = await whatsappResponse.json();

    if (!whatsappResponse.ok) {
      console.error('WhatsApp API error:', responseData);
      throw new Error(`WhatsApp API error: ${responseData.error?.message || 'Unknown error'}`);
    }

    console.log('WhatsApp message sent successfully:', responseData);

    // Log the notification in our database for tracking
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // You can create a notifications table to track sent messages
    // For now, just log to console
    console.log(`Notification sent: ${message_type} to ${restaurant_name} (${phone_number})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message_id: responseData.messages?.[0]?.id,
        message: 'WhatsApp notification sent successfully' 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send WhatsApp notification';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});