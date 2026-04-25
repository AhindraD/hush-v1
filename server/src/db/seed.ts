import { db } from './client';
import {
  dafAccounts,
  deposits,
  grants,
  yieldPositions,
} from './schema';

/**
 * Seeds the database with demo data.
 * Only runs when tables are empty (detected by checking dafAccounts count).
 */
export async function seedDemoData(): Promise<void> {
  const existing = db.select().from(dafAccounts).all();
  if (existing.length > 0) {
    console.log('[seed] Database already seeded, skipping.');
    return;
  }

  console.log('[seed] Seeding demo data...');

  // -------------------------------------------------------------------------
  // Demo Accounts
  // -------------------------------------------------------------------------
  const [account1, account2] = db
    .insert(dafAccounts)
    .values([
      {
        ownerPubkey: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        stealthMetaAddress: 'hm1qzxkwse3hpresf8etf5eefq56zfhux9pgeafagn95',
        viewingKeyHash:
          '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        encryptedBalance: 'enc:U2FsdGVkX1+abc123encryptedbalance==',
        balanceUsdc: 125000.0,
        totalDeposited: 200000.0,
        totalGranted: 75000.0,
        totalYieldAccrued: 4250.5,
        status: 'active',
      },
      {
        ownerPubkey: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        stealthMetaAddress: 'hm1abc987zyx654wvu321stealth',
        viewingKeyHash:
          '7c4a8d09ca3762af61e59520943dc26494f8941b',
        encryptedBalance: 'enc:U2FsdGVkX1+xyz789encryptedbalance==',
        balanceUsdc: 48750.25,
        totalDeposited: 60000.0,
        totalGranted: 12500.0,
        totalYieldAccrued: 1250.75,
        status: 'active',
      },
    ])
    .returning()
    .all();

  // -------------------------------------------------------------------------
  // Deposits (4 total — 2 per account)
  // -------------------------------------------------------------------------
  db.insert(deposits)
    .values([
      {
        accountId: account1.id,
        amountUsdc: 100000.0,
        stealthPubkey: 'stealth1ABCdef123XYZ789whale',
        maskedWallet: '7xKX...AsU',
        txHash:
          '3xBcD1pQrStUvWxYz2aEfGhIjKlMnOpQrStUvWx3YzAbCdEfGhIjKl4MnOpQr',
        blockHeight: 295001234,
        status: 'confirmed',
        encryptedMemo: null,
      },
      {
        accountId: account1.id,
        amountUsdc: 100000.0,
        stealthPubkey: 'stealth2DEFghi456UVW012whale',
        maskedWallet: '7xKX...AsU',
        txHash:
          '9yZaB2cDefGhIjKlMnOpQrStUvWxYz3AbCdEfGh4IjKlMnOpQrStUvWxYz5Ab',
        blockHeight: 295100567,
        status: 'confirmed',
        encryptedMemo: null,
      },
      {
        accountId: account2.id,
        amountUsdc: 50000.0,
        stealthPubkey: 'stealth3GHIjkl789RST345philanthropist',
        maskedWallet: '9WzD...WWM',
        txHash:
          'AbCdEfGhIjKlMnOpQrStUvWxYz1AbCdEfGhIj2KlMnOpQrStUvWxYz3AbCdEf',
        blockHeight: 295200890,
        status: 'confirmed',
        encryptedMemo: null,
      },
      {
        accountId: account2.id,
        amountUsdc: 10000.0,
        stealthPubkey: 'stealth4JKLmno012OPQ678philanthropist',
        maskedWallet: '9WzD...WWM',
        txHash:
          'GhIjKlMnOpQrStUvWxYz4AbCdEfGhIj5KlMnOpQrStUvWxYz6AbCdEfGhIjKl',
        blockHeight: 295300123,
        status: 'confirmed',
        encryptedMemo: null,
      },
    ])
    .run();

  // -------------------------------------------------------------------------
  // Grants (4 total)
  // -------------------------------------------------------------------------
  db.insert(grants)
    .values([
      {
        accountId: account1.id,
        charityWallet: 'EFghIjKlMnOpQrStUvWxYzAbCdEfGh1IjKlMnOpQrSt',
        charityName: 'Water.org',
        amountUsdc: 50000.0,
        grantRequestPda: 'PDA1xKXtg2CW87d97TXJSDpbD5jBkhe',
        settlementTxHash:
          'MnOpQrStUvWxYz7AbCdEfGhIjKlMnOp8QrStUvWxYz9AbCdEfGhIjKlMnOpQr',
        status: 'settled',
        taxYear: 2024,
        settledAt: new Date('2024-11-15T00:00:00Z'),
      },
      {
        accountId: account1.id,
        charityWallet: 'UVWxYzAbCdEfGhIjKlMnOpQrStUvWx2YzAbCdEfGhIj',
        charityName: 'GiveDirectly',
        amountUsdc: 25000.0,
        grantRequestPda: 'PDA2xKXtg2CW87d97TXJSDpbD5jBkhe',
        settlementTxHash: null,
        status: 'pending',
        taxYear: 2024,
      },
      {
        accountId: account2.id,
        charityWallet: 'KlMnOpQrStUvWxYzAbCdEf3GhIjKlMn4OpQrStUvWx',
        charityName: 'Against Malaria Foundation',
        amountUsdc: 10000.0,
        grantRequestPda: 'PDA3WzDXwBbmkg8ZTbNMqUxvQRAyrZz',
        settlementTxHash:
          'StUvWxYzAbCdEfGhIj5KlMnOpQrSt6UvWxYzAbCdEfGhIjKlMnOpQrStUvWx7',
        status: 'settled',
        taxYear: 2024,
        settledAt: new Date('2024-12-01T00:00:00Z'),
      },
      {
        accountId: account2.id,
        charityWallet: 'YzAbCdEfGhIjKlMnOpQrSt8UvWxYz9AbCdEfGhIjKl',
        charityName: 'Doctors Without Borders',
        amountUsdc: 2500.0,
        grantRequestPda: 'PDA4WzDXwBbmkg8ZTbNMqUxvQRAyrZz',
        settlementTxHash: null,
        status: 'processing',
        taxYear: 2024,
      },
    ])
    .run();

  // -------------------------------------------------------------------------
  // Yield Positions (5 total — 3 for account1, 2 for account2)
  // -------------------------------------------------------------------------
  db.insert(yieldPositions)
    .values([
      {
        accountId: account1.id,
        protocol: 'kamino',
        allocatedUsdc: 50000.0,
        currentApy: 7.82,
        accruedYield: 1842.5,
        positionAddress: 'kamino1KXtg2CW87d97TXJSDpbD5jBkheDemo',
        isActive: true,
      },
      {
        accountId: account1.id,
        protocol: 'jito',
        allocatedUsdc: 40000.0,
        currentApy: 8.15,
        accruedYield: 1540.0,
        positionAddress: 'jito1KXtg2CW87d97TXJSDpbD5jBkheDemoPos',
        isActive: true,
      },
      {
        accountId: account1.id,
        protocol: 'marginfi',
        allocatedUsdc: 35000.0,
        currentApy: 6.95,
        accruedYield: 868.0,
        positionAddress: 'mfi1KXtg2CW87d97TXJSDpbD5jBkheDemoPos',
        isActive: true,
      },
      {
        accountId: account2.id,
        protocol: 'kamino',
        allocatedUsdc: 25000.0,
        currentApy: 7.75,
        accruedYield: 875.25,
        positionAddress: 'kamino2WzDXwBbmkg8ZTbNMqUxvQRAyDemo',
        isActive: true,
      },
      {
        accountId: account2.id,
        protocol: 'marginfi',
        allocatedUsdc: 20000.0,
        currentApy: 7.1,
        accruedYield: 375.5,
        positionAddress: 'mfi2WzDXwBbmkg8ZTbNMqUxvQRAyrZzDemo',
        isActive: true,
      },
    ])
    .run();

  console.log('[seed] Demo data seeded successfully.');
  console.log(`[seed] Created 2 accounts, 4 deposits, 4 grants, 5 yield positions.`);
}
