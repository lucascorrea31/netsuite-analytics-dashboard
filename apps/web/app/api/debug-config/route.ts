import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const requiredEnvVars = [
      'NETSUITE_ACCOUNT_ID',
      'NETSUITE_CONSUMER_KEY',
      'NETSUITE_CERTIFICATE_ID',
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing environment variables',
          missing: missingVars,
        },
        { status: 500 }
      );
    }

    // Create test payload
    const now = Math.floor(Date.now() / 1000);
    const accountIdForUrl = process.env.NETSUITE_ACCOUNT_ID!.replace('_', '-').toLowerCase();

    const payload = {
      iss: process.env.NETSUITE_CONSUMER_KEY!,
      scope: ['rest_webservices', 'suite_analytics'],
      aud: `https://${accountIdForUrl}.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token`,
      exp: now + 300,
      iat: now,
    };

    return NextResponse.json({
      success: true,
      message: '🔍 Configuration Debug Info',
      config: {
        accountId: process.env.NETSUITE_ACCOUNT_ID,
        accountIdForUrl: accountIdForUrl,
        consumerKeyPrefix: process.env.NETSUITE_CONSUMER_KEY!.substring(0, 15) + '...',
        consumerKeyLength: process.env.NETSUITE_CONSUMER_KEY!.length,
        certificateId: process.env.NETSUITE_CERTIFICATE_ID,
        certificateIdLength: process.env.NETSUITE_CERTIFICATE_ID!.length,
        tokenUrl: `https://${accountIdForUrl}.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token`,
      },
      jwtPayload: payload,
      instructions: [
        '✅ Step 1: Go to Setup → Integration → OAuth 2.0 M2M Setup',
        '✅ Step 2: Open your OAuth 2.0 M2M record',
        '✅ Step 3: In Certificate section, verify Certificate ID matches EXACTLY (case-sensitive)',
        '✅ Step 4: Go to Setup → Integration → Manage Integrations',  
        '✅ Step 5: Open "NextJS Analytics Dashboard"',
        '✅ Step 6: Verify Consumer Key matches EXACTLY',
        '✅ Step 7: Ensure OAuth 2.0 Grant Types has "Client Credentials" checked',
        '✅ Step 8: Ensure Scope has "REST Web Services" and "SuiteAnalytics Connect" checked',
      ],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
