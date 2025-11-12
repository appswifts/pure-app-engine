# Apply Manual Payment Migration

## Quick Setup (Copy & Paste)

### Option 1: Supabase Dashboard (Easiest)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "+ New Query"
5. Copy and paste the entire contents of `supabase/migrations/create_manual_payment_tables.sql`
6. Click "Run" button (or press Ctrl+Enter)
7. Done! ✅

### Option 2: Supabase CLI

```bash
# If you have Supabase CLI linked to your project
cd c:\Users\FH\Desktop\blank-project\pure-app-engine
npx supabase db push

# Or apply specific migration
npx supabase db reset
```

### Option 3: Direct SQL Connection

If you have your database connection string:

```bash
# Replace with your actual connection string
$DB_URL = "postgresql://postgres:[password]@[host]:5432/postgres"

# Apply migration
Get-Content supabase\migrations\create_manual_payment_tables.sql | psql $DB_URL
```

## Verify Installation

After running the migration, verify the tables were created:

```sql
-- Run this in Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('manual_payments', 'manual_subscriptions');
```

You should see:
- `manual_payments`
- `manual_subscriptions`

## Test the System

1. Start your dev server:
```bash
npm run dev
```

2. Open browser console (F12)

3. Check for initialization message:
```
🔌 Initializing Payment System...
✓ Payment gateway registered: Manual Payment (manual)
✓ Payment system initialized: 4/4 gateways enabled
Enabled gateways: Manual Payment
```

4. Test creating a manual payment:
```javascript
// In browser console
import { paymentService } from '@/lib/payments';

const payment = await paymentService.createPayment(
  'manual',
  29000,
  'RWF',
  {
    paymentMethod: 'bank_transfer',
    customerEmail: 'test@example.com',
    customerName: 'Test User'
  }
);

console.log(payment);
// Should see payment instructions!
```

## Troubleshooting

### "Table already exists" error
Tables were already created. You're good to go! ✅

### "Permission denied" error
Make sure you're using a service role key or running as database owner.

### "Syntax error" in SQL
Make sure you copied the entire SQL file contents, including the `--` comments.

### Migration file not found
Check that the file exists at:
`c:\Users\FH\Desktop\blank-project\pure-app-engine\supabase\migrations\create_manual_payment_tables.sql`

## Next Steps

Once migration is applied:

1. ✅ Update your `.env` with actual bank/mobile money details
2. ✅ Start dev server: `npm run dev`
3. ✅ Test manual payment creation
4. ✅ Build admin verification UI
5. ✅ Read `MANUAL_PAYMENT_GUIDE.md` for full usage

## Need Help?

Check the documentation:
- `PAYMENT_SYSTEM_README.md` - Quick start
- `MANUAL_PAYMENT_GUIDE.md` - Manual payment details
- `PAYMENT_SYSTEM_GUIDE.md` - Complete guide
