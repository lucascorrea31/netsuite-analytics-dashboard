import { NetSuiteClient } from './packages/netsuite-sdk/src/client.js';

const client = new NetSuiteClient({
  accountId: process.env.NETSUITE_ACCOUNT_ID!,
  consumerKey: process.env.NETSUITE_CONSUMER_KEY!,
  certificateId: process.env.NETSUITE_CERTIFICATE_ID!,
  privateKeyPath: process.env.NETSUITE_PRIVATE_KEY_PATH!,
});

try {
  console.log('🔍 Testing NetSuite connection...');
  console.log('Account ID:', process.env.NETSUITE_ACCOUNT_ID);
  console.log('');
  
  const result = await client.executeSuiteQL(
    'SELECT id, companyname FROM customer FETCH FIRST 5 ROWS ONLY'
  );
  
  console.log('✅ Connection successful!');
  console.log(`📊 Found ${result.count} customers`);
  console.log('');
  console.log('Sample data:');
  console.log(JSON.stringify(result.items, null, 2));
} catch (error) {
  console.error('❌ Connection failed:');
  console.error(error.message);
  console.error('');
  console.error('Full error:', error);
}
