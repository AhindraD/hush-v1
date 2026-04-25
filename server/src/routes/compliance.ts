import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AccountService } from '../services/AccountService';
import { ViewingKeyService } from '../services/ViewingKeyService';

const router = Router();
const accountService = new AccountService();
const viewingKeyService = new ViewingKeyService();

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------
const ViewingKeyBodySchema = z.object({
  viewingKey: z.string().min(8, 'Viewing key must be at least 8 characters'),
  taxYear: z
    .number()
    .int()
    .min(2020)
    .max(new Date().getFullYear() + 1),
  scope: z
    .enum(['deposits_only', 'grants_only', 'full'])
    .optional()
    .default('full'),
});

// ---------------------------------------------------------------------------
// POST /accounts/:id/viewing-key
// Verifies a viewing key, generates audit log, returns decrypted data.
// ---------------------------------------------------------------------------
router.post('/:id/viewing-key', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id ?? '', 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid account id' });
    return;
  }

  const parsed = ViewingKeyBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { viewingKey, taxYear } = parsed.data;

  // Step 1: Verify key validity
  const isValid = await viewingKeyService.verifyKey(id, viewingKey);
  if (!isValid) {
    // Return 401 with generic message — do not leak account existence
    res.status(401).json({
      error: 'Invalid viewing key. Access denied.',
    });
    return;
  }

  // Step 2: Generate full audit result and persist audit log
  const ipAddress =
    (req.headers['x-forwarded-for'] as string | undefined) ??
    req.socket.remoteAddress ??
    'unknown';

  try {
    const auditResult = await accountService.generateAuditLog(
      id,
      viewingKey,
      taxYear,
      'api_request',
      ipAddress
    );

    if (!auditResult) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    // Step 3: Also generate structured tax receipt
    const taxReceipt = await viewingKeyService.generateTaxReceipt(
      id,
      viewingKey,
      taxYear
    );

    res.json({
      message: 'Viewing key verified. Audit log generated.',
      taxYear,
      auditResult: {
        totalDeposited: auditResult.totalDeposited,
        totalGranted: auditResult.totalGranted,
        depositCount: auditResult.deposits.length,
        grantCount: auditResult.grants.length,
        zkReceiptHash: auditResult.zkReceiptHash,
        generatedAt: auditResult.generatedAt,
      },
      taxReceipt,
    });
  } catch (err: unknown) {
    console.error('[POST /viewing-key]', err);
    res.status(500).json({ error: 'Failed to generate audit log' });
  }
});

export default router;
