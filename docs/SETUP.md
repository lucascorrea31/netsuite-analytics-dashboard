# Setup Guide - NetSuite Analytics Dashboard

## Prerequisites

- Node.js 18+ installed
- pnpm package manager
- NetSuite Sandbox account with admin access
- Basic knowledge of NetSuite customization

## Step 1: Clone and Install Dependencies

```bash
# Already done! ✅
cd netsuite-analytics-dashboard
pnpm install
```

## Step 2: NetSuite Configuration

### 2.1 Enable Required Features

In your NetSuite Sandbox:

1. Go to **Setup → Company → Enable Features**
2. Navigate to **SuiteCloud** tab:
   - ✅ Enable **OAuth 2.0**
   - ✅ Enable **REST Web Services**
3. Navigate to **Analytics** tab:
   - ✅ Confirm **SuiteAnalytics** is enabled
4. Click **Save**

### 2.2 Create Custom Integration Role

1. Go to **Setup → Users/Roles → Manage Roles → New**
2. Fill in:
   - **Name**: `Analytics Integration`
   - **ID**: `analytics_integration`
3. In **Permissions** tab, add:
   - **SuiteAnalytics Connect**: Full
   - **REST Web Services**: Full
   - **Reports**: View (for transactions you need)
   - **Lists → Customers**: View
   - **Lists → Items**: View
   - **Transactions → Sales Order**: View
4. Click **Save**

### 2.3 Create Integration Record

1. Go to **Setup → Integration → Manage Integrations → New**
2. Fill in:
   - **Name**: `NextJS Analytics Dashboard`
   - **State**: Enabled
   - **Authentication**: Check **OAuth 2.0**
   - **OAuth 2.0 Grant Types**: Select **Client Credentials (M2M)**
   - **Scope**: Check **REST Web Services** and **SuiteAnalytics Connect**
3. Click **Save**
4. **IMPORTANT**: Copy the **Consumer Key** shown - you'll only see it once!

### 2.4 Create Integration User

1. Go to **Setup → Users/Roles → Manage Users → New**
2. Fill in:
   - **Name**: `Integration User`
   - **Email**: Use your email or dedicated integration email
   - **Role**: Select the `Analytics Integration` role created in step 2.2
   - **Access**: Give access
3. Click **Save**

### 2.5 Setup OAuth 2.0 M2M

1. Go to **Setup → Users/Roles → OAuth 2.0 M2M Setup → New**
2. Fill in:
   - **Integration**: Select `NextJS Analytics Dashboard`
   - **Entity**: Select your subsidiary
   - **Role**: Select `Analytics Integration`
   - **User**: Select `Integration User`
3. Click **Save** (don't upload certificate yet)

### 2.6 Generate RSA Certificate

On your local machine, run:

```bash
# Create a directory for certificates
mkdir -p ~/.netsuite/certs
cd ~/.netsuite/certs

# Generate private key (4096 bits)
openssl genrsa -out netsuite_private.pem 4096

# Generate public certificate (valid for 2 years)
openssl req -new -x509 -key netsuite_private.pem -out netsuite_public.pem -days 730

# During certificate generation, fill in:
# Country: BR
# State: Your state
# City: Your city
# Organization: Your name or company
# Common Name: Leave blank or use your domain
```

**SECURITY WARNING**: Never commit `netsuite_private.pem` to Git!

### 2.7 Upload Certificate to NetSuite

1. Go back to the OAuth 2.0 M2M Setup record created in step 2.5
2. Scroll to **Certificate** section
3. Click **Add**
4. Upload the `netsuite_public.pem` file
5. **IMPORTANT**: Copy the **Certificate ID** shown after upload
6. Click **Save**

## Step 3: Configure Environment Variables

1. Copy the example file:
```bash
cp .env.example .env.local
```

2. Edit `.env.local` with your values:
```bash
# From NetSuite integration record (step 2.3)
NETSUITE_ACCOUNT_ID=1234567_SB1  # Your account ID
NETSUITE_CONSUMER_KEY=abc123...   # From step 2.3

# From certificate upload (step 2.7)
NETSUITE_CERTIFICATE_ID=cert_xyz789

# Path to your private key
NETSUITE_PRIVATE_KEY_PATH=/Users/yourusername/.netsuite/certs/netsuite_private.pem

# Redis - we'll setup later
# UPSTASH_REDIS_URL=
# UPSTASH_REDIS_TOKEN=
```

## Step 4: Test NetSuite Connection

Create a test script:

```bash
# Create test file
cat > test-connection.mjs << 'EOF'
import { NetSuiteClient } from './packages/netsuite-sdk/src/client.ts';

const client = new NetSuiteClient({
  accountId: process.env.NETSUITE_ACCOUNT_ID,
  consumerKey: process.env.NETSUITE_CONSUMER_KEY,
  certificateId: process.env.NETSUITE_CERTIFICATE_ID,
  privateKeyPath: process.env.NETSUITE_PRIVATE_KEY_PATH,
});

try {
  console.log('Testing NetSuite connection...');
  const result = await client.executeSuiteQL('SELECT id, companyname FROM customer FETCH FIRST 5 ROWS ONLY');
  console.log('✅ Connection successful!');
  console.log('Sample data:', result.items);
} catch (error) {
  console.error('❌ Connection failed:', error.message);
}
EOF

# Run test
node --env-file=.env.local test-connection.mjs
```

If successful, you should see sample customer data!

## Step 5: Start Development Server

```bash
pnpm dev
```

Visit http://localhost:3000

## Common Issues

### "Invalid client credentials"
- Check that Consumer Key is correct
- Verify Certificate ID matches the uploaded certificate
- Ensure private key path is correct

### "Permission denied"
- Verify the integration role has required permissions
- Check that OAuth 2.0 M2M record uses correct role
- Ensure user has access to required records

### "Certificate expired"
- Generate new certificate pair
- Upload new public cert to NetSuite
- Update Certificate ID in .env.local

## Next Steps

1. ✅ Setup complete!
2. Configure Redis for caching (optional for now)
3. Start building dashboard components
4. Create API Routes in Next.js

## Resources

- [NetSuite OAuth 2.0 Docs](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_0907011905.html)
- [SuiteQL Reference](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_1540391670.html)
- [Next.js Documentation](https://nextjs.org/docs)
