const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://kpjbkzpkwfqzpvjjmqzv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwamJrenBrd2ZxenB2amptcXp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MDY4NjEsImV4cCI6MjA1MDQ4Mjg2MX0.gKmJEZGYAOKmH2bUQHRJqhKOhfgHhQGYJKmGOKmJEZGY';

const supabase = createClient(supabaseUrl, supabaseKey);

// Subscription packages to create
const subscriptionPackages = [
  {
    name: 'Starter',
    monthly_price: 15000, // 15,000 RWF
    yearly_price: 150000, // 150,000 RWF (save 2 months)
    trial_days: 14,
    features: [
      'Up to 50 menu items',
      'Basic menu customization',
      'QR code menu',
      'Basic analytics',
      'Email support'
    ],
    is_active: true
  },
  {
    name: 'Professional',
    monthly_price: 25000, // 25,000 RWF
    yearly_price: 250000, // 250,000 RWF (save 2 months)
    trial_days: 14,
    features: [
      'Up to 200 menu items',
      'Advanced menu customization',
      'QR code menu',
      'Advanced analytics',
      'Multiple menu categories',
      'Custom branding',
      'Priority email support'
    ],
    is_active: true
  },
  {
    name: 'Enterprise',
    monthly_price: 40000, // 40,000 RWF
    yearly_price: 400000, // 400,000 RWF (save 2 months)
    trial_days: 30,
    features: [
      'Unlimited menu items',
      'Full menu customization',
      'QR code menu',
      'Advanced analytics & reports',
      'Multiple locations',
      'Custom branding',
      'API access',
      'Dedicated support',
      'Staff management',
      'Inventory tracking'
    ],
    is_active: true
  }
];

async function seedSubscriptionPackages() {
  try {
    console.log('🌱 Starting to seed subscription packages...');

    // Check if packages already exist
    const { data: existingPackages, error: checkError } = await supabase
      .from('subscription_packages')
      .select('*');

    if (checkError) {
      console.error('❌ Error checking existing packages:', checkError);
      return;
    }

    if (existingPackages && existingPackages.length > 0) {
      console.log('📦 Subscription packages already exist:', existingPackages.length);
      console.log('Existing packages:', existingPackages.map(p => p.name).join(', '));
      return;
    }

    // Insert subscription packages
    const { data, error } = await supabase
      .from('subscription_packages')
      .insert(subscriptionPackages)
      .select();

    if (error) {
      console.error('❌ Error inserting subscription packages:', error);
      return;
    }

    console.log('✅ Successfully created subscription packages:');
    data.forEach(pkg => {
      console.log(`  - ${pkg.name}: ${pkg.monthly_price} RWF/month, ${pkg.yearly_price} RWF/year`);
    });

    console.log('🎉 Subscription packages seeding completed!');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the seeding
seedSubscriptionPackages();
