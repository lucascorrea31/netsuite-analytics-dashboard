import { NextResponse } from 'next/server';
import { NetSuiteClient } from '@repo/netsuite-sdk';

export async function GET() {
  try {
    // Verificar variáveis de ambiente
    const requiredEnvVars = [
      'NETSUITE_ACCOUNT_ID',
      'NETSUITE_CONSUMER_KEY',
      'NETSUITE_CERTIFICATE_ID',
      'NETSUITE_PRIVATE_KEY_PATH',
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

    // Criar cliente NetSuite
    const client = new NetSuiteClient({
      accountId: process.env.NETSUITE_ACCOUNT_ID!,
      consumerKey: process.env.NETSUITE_CONSUMER_KEY!,
      certificateId: process.env.NETSUITE_CERTIFICATE_ID!,
      privateKeyPath: process.env.NETSUITE_PRIVATE_KEY_PATH!,
    });

    console.log('🔍 Testing NetSuite connection...');
    console.log('Account ID:', process.env.NETSUITE_ACCOUNT_ID);

    // Executar query de teste
    const result = await client.executeSuiteQL(
      'SELECT id, companyname FROM customer FETCH FIRST 5 ROWS ONLY'
    );

    console.log('✅ Connection successful!');
    console.log(`📊 Found ${result.count} customers`);

    return NextResponse.json({
      success: true,
      message: '✅ NetSuite connection successful!',
      data: {
        accountId: process.env.NETSUITE_ACCOUNT_ID,
        customersFound: result.count,
        sampleData: result.items,
      },
    });
  } catch (error) {
    console.error('❌ NetSuite connection failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details:
          error instanceof Error
            ? {
                name: error.name,
                stack: error.stack?.split('\n').slice(0, 5),
              }
            : null,
      },
      { status: 500 }
    );
  }
}
