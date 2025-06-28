# Dodo Payments Integration Setup

This document explains how to set up Dodo Payments for JDMatchr subscription management.

## Environment Variables

### Frontend (.env.local)

```env
# No DODO API keys needed in frontend - all payment processing is handled by backend
```

### Backend (Supabase Edge Functions)

Add these to your Supabase project secrets:

```bash
# Set via: supabase secrets set DODO_API_KEY=your_key
DODO_API_KEY=your_dodo_api_key
DODO_ENVIRONMENT=test_mode  # or 'live_mode' for production
DODO_WEBHOOK_SECRET=your_dodo_webhook_secret
DODO_PRODUCT_PRO_MONTHLY=prod_pro_monthly  # Your actual DODO product ID
DODO_PRODUCT_ENTERPRISE_MONTHLY=prod_enterprise_monthly  # Your actual DODO product ID
```

## Dodo Dashboard Setup

### 1. Create Products

In your Dodo Payments dashboard, create these products:

- **Free Plan**: `prod_free` - $0 (for reference)
- **Pro Monthly**: `prod_pro_monthly` - $24.99/month
- **Pro Yearly**: `prod_pro_yearly` - $249.99/year (if needed)
- **Enterprise**: `prod_enterprise_monthly` - Custom pricing

### 2. Configure Webhooks

Set up a webhook endpoint in Dodo dashboard:

**Webhook URL**: `https://your-supabase-project.supabase.co/functions/v1/dodo-webhook`

**No additional headers required** - JWT verification is disabled for this endpoint.

**Events to listen for**:

- `subscription.created`
- `subscription.updated`
- `subscription.cancelled`
- `subscription.expired`
- `payment.succeeded`
- `customer.created`

### 3. Update Product Mapping

In `src/lib/dodo-payments.ts`, update the product mapping:

```typescript
const productMapping: Record<string, string> = {
  prod_free: "free",
  prod_pro_monthly: "pro",
  prod_pro_yearly: "pro",
  prod_enterprise_monthly: "enterprise",
  prod_enterprise_yearly: "enterprise",
};
```

And in `src/components/dashboard/SettingsBilling.tsx`:

```typescript
const productMapping: Record<string, string> = {
  Pro: "prod_pro_monthly", // Use your actual Dodo product IDs
};
```

## How It Works

### Free vs Paid Plan Handling

#### Free Plans (Local Only)

- ✅ **No payment processor involvement** - handled entirely in local database
- ✅ **Instant activation** - no redirect to payment pages
- ✅ **Dodo fields remain `NULL`** - no payment processor data stored
- ✅ **Uses `update_local_subscription()`** - dedicated function for local-only plans

#### Paid Plans (Dodo + Local)

- ✅ **Dodo handles payment processing** - secure checkout flow
- ✅ **Local database maintains subscription state** - fast queries
- ✅ **Webhook keeps systems synchronized** - automatic data sync
- ✅ **Uses `sync_dodo_subscription()`** - webhook-triggered sync function

### Payment Flow

**For Free Plans:**

1. **User clicks "Free Plan"** → Direct local database update
2. **Instant activation** → No external redirects
3. **UI updates immediately** → Credits allocated

**For Paid Plans:**

1. **User clicks "Upgrade"** → Frontend calls backend Edge Function
2. **Backend creates Dodo customer and subscription** → Secure API calls to `/subscriptions` endpoint
3. **Redirects to Dodo checkout** → User completes payment securely via `payment_link`
4. **Webhook receives event** → Syncs subscription data to local database
5. **User redirected back** → Success/cancellation message shown

### Data Synchronization

- **Free Plans**: 100% local database management
- **Paid Plans**: Dodo Payments + local database sync
- **Webhooks**: Keep paid subscriptions in sync automatically

## Comprehensive Webhook Events

Following DODO's [webhook events specification](https://docs.dodopayments.com/developer-resources/webhooks/intents/webhook-events-guide), our implementation handles all subscription lifecycle events:

### **Subscription Events**

- ✅ **subscription.active**: **Smart Pro subscription handling** - UPDATEs existing Pro subscription if found, otherwise CREATEs new Pro subscription, expires other active subscriptions, maintains audit trail
- ✅ **subscription.renewed**: Resets job credits (30) and updates billing period
- ✅ **subscription.on_hold**: Logs event only (no DB changes as requested)
- ✅ **subscription.paused**: Sets subscription to paused status
- ✅ **subscription.cancelled**: Sets cancelled status, **reactivates Free plan automatically**
- ✅ **subscription.failed**: Sets subscription to failed status
- ✅ **subscription.expired**: Sets expired status, **reactivates Free plan automatically**

### **Payment Events**

- ✅ **payment.succeeded**: Updates last payment date

### **Customer Events**

- ✅ **customer.created**: Links DODO customer to local user

### **Business Logic**

- **New User**: Gets Free plan (1 credit) automatically on signup
- **Upgrade to Pro**: Smart handling - UPDATEs existing Pro subscription if found, otherwise CREATEs new Pro subscription (30 credits), expires other active subscriptions
- **Pro Renewal**: Job credits reset to 30 for new billing period
- **Pro Cancellation**: Pro subscription cancelled, user reverts to Free plan automatically
- **Pro Expiration**: Pro subscription expires, user reverts to Free plan automatically
- **Failed Payments**: Subscription marked as failed, user retains access until expiration
- **Pro Reactivation**: When failed/expired Pro subscription becomes active again, existing Pro record is updated (no duplicates)
- **One Active Subscription**: Users always have exactly one active subscription at any time

### **Subscription Period Tracking**

Our implementation tracks both billing cycles and subscription periods:

- **Billing Cycles**: Monthly/yearly automatic renewals within subscription period
- **Subscription Period**: Total commitment period (e.g., 12 months for annual plans)
- **Natural Expiry**: When subscription completes its full period commitment

**Complete Subscription Lifecycle:**

1. **New User**: Gets Free plan (1 credit) automatically
2. **Upgrade to Pro**: Pro subscription created (30 credits), Free plan expired
3. **Monthly Renewals**: Pro subscription renews, credits reset to 30
4. **Pro Cancellation/Expiry**: Pro subscription ends, Free plan reactivated (1 credit)
5. **Always Active**: User always has exactly one active subscription

**Database Fields:**

- `subscription_period_count`: Total periods in commitment (e.g., 12) - for reference only
- `subscription_period_interval`: Period type (Day/Month/Year) - for reference only
- `natural_expiry_date`: When subscription naturally expires - DODO handles timing

### **Subscription Statuses**

- `active`: Full access with job credits
- `cancelled`: Access until period end, then expires
- `expired`: No access, credits reset to 0
- `past_due`: Payment failed, grace period
- `on_hold`: DODO-managed hold (logged only)
- `paused`: Temporarily suspended
- `failed`: Payment processing failed

### Database Schema

The integration adds these fields to the `subscriptions` table:

```sql
-- Dodo-specific columns
dodo_subscription_id TEXT UNIQUE
dodo_customer_id TEXT
dodo_product_id TEXT
payment_method_id TEXT
last_payment_date TIMESTAMP WITH TIME ZONE
next_billing_date TIMESTAMP WITH TIME ZONE
billing_interval TEXT CHECK (billing_interval IN ('monthly', 'yearly', 'one_time'))
currency TEXT DEFAULT 'USD'
amount_cents INTEGER
trial_ends_at TIMESTAMP WITH TIME ZONE
metadata JSONB DEFAULT '{}'

-- Subscription period tracking columns
subscription_period_count INTEGER DEFAULT NULL
subscription_period_interval TEXT CHECK (subscription_period_interval IN ('Day', 'Month', 'Year'))
periods_completed INTEGER DEFAULT 0
natural_expiry_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
```

## Webhook-Driven Expiry

### Natural Expiry Handling

DODO automatically handles subscription expiration through webhook events:

**DODO Webhook**: `subscription.expired`

- DODO sends this event when subscriptions naturally expire
- Our webhook handler processes this event and updates the database
- No manual processing or cron jobs needed

**Period Tracking**:

- We store period info (`subscription_period_count`, `natural_expiry_date`) for reference only
- DODO handles all period counting and timing logic
- All actual expiry processing is handled by DODO webhooks

**Benefits:**

- **Automatic**: DODO handles timing and expiry logic
- **Reliable**: No dependency on our cron jobs or manual processing
- **Real-time**: Immediate webhook notification when expiry occurs

**Monitoring Query:**

```sql
-- Check subscriptions approaching natural expiry
SELECT user_id, natural_expiry_date, periods_completed, subscription_period_count
FROM subscriptions
WHERE natural_expiry_date <= NOW() + INTERVAL '7 days'
AND status = 'active';
```

## Testing

### Test Mode Setup

1. Set `VITE_DODO_ENVIRONMENT=test_mode`
2. Use Dodo test API keys
3. Create test products in Dodo dashboard
4. Test the complete flow with test payment methods

### Production Deployment

1. Set `VITE_DODO_ENVIRONMENT=live_mode`
2. Use Dodo production API keys
3. Update webhook URL to production domain
4. Test with small amounts before full launch

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**

   - Check webhook URL is correct
   - Verify Supabase function is deployed
   - Check webhook secret matches

2. **Webhook Authentication Issues (401 Unauthorized)**

   ✅ **SOLUTION**: Disable JWT verification for webhook endpoint in `supabase/config.toml`:

   ```toml
   [functions.dodo-webhook]
   verify_jwt = false
   ```

   **Deploy the configuration:**

   ```bash
   npx supabase functions deploy dodo-webhook
   ```

   This allows DODO's external webhooks to call the endpoint without JWT authentication while maintaining security through HMAC signature verification.

   **Signature Verification Details:**

   - **Library**: Uses `standardwebhooks` npm package (same as Express example)
   - **Format**: Standard Webhooks specification compliance
   - **Headers**: `webhook-id`, `webhook-signature`, `webhook-timestamp`
   - **Algorithm**: HMAC SHA256 (handled by library)
   - **Secret**: From `DODO_WEBHOOK_SECRET` environment variable
   - **Implementation**: Identical to Express.js pattern for consistency

3. **Product mapping errors**

   - Ensure product IDs match Dodo dashboard
   - Check product mapping in both files

4. **Customer creation fails**

   - Verify API key has customer creation permissions
   - Check email format is valid

5. **Cannot delete users from Supabase dashboard**
   - ✅ **Fixed**: Migration `20250702000000_fix_user_deletion_constraints.sql` resolves this
   - **Issue**: Mixed foreign key references prevented cascading deletion
   - **Solution**: All tables now properly reference `public.users` with CASCADE deletion
   - **Result**: Users can be deleted from Auth dashboard and all related data is cleaned up

### Logs

Check logs in:

- **Supabase Functions**: Dashboard → Functions → dodo-webhook
- **Browser Console**: For client-side errors
- **Dodo Dashboard**: Webhook delivery logs

## Security

- ✅ **API Keys**: Stored as environment variables
- ✅ **Webhook Signatures**: HMAC SHA256 verified using `webhook-id.webhook-timestamp.payload` format
- ✅ **User Data**: Minimal metadata sent to Dodo
- ✅ **Local Control**: Subscription logic remains in your database

## Support

For Dodo Payments specific issues:

- Documentation: [docs.dodopayments.com](https://docs.dodopayments.com)
- Support: support@dodopayments.com
- Discord: [Dodo Community](https://discord.gg/dodopayments)

For JDMatchr integration issues:

- Check this documentation
- Review webhook logs
- Test in development environment first
