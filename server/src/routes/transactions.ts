import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AccountService } from '../services/AccountService';

const router: Router = Router();
const accountService = new AccountService();

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------
const DepositBodySchema = z.object({
  amountUsdc: z.number().positive('Amount must be a positive number'),
});

const GrantBodySchema = z.object({
  charityWallet: z.string().min(32, 'Invalid Solana wallet address'),
  charityName: z.string().min(1, 'Charity name is required'),
  amountUsdc: z.number().positive('Grant amount must be positive'),
  taxYear: z
    .number()
    .int()
    .min(2020)
    .max(new Date().getFullYear() + 1),
  encryptedMemo: z.string().optional(),
});

// ---------------------------------------------------------------------------
// POST /accounts/:id/deposit
// ---------------------------------------------------------------------------
router.post('/:id/deposit', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id ?? '', 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid account id' });
    return;
  }

  const parsed = DepositBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const result = await accountService.createDeposit(id, parsed.data.amountUsdc);
    res.status(201).json({
      message: 'Deposit recorded',
      deposit: result.deposit,
      stealthPubkey: result.stealthPubkey,
      txHash: result.txHash,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Deposit failed';
    const statusCode = message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// POST /accounts/:id/grant
// ---------------------------------------------------------------------------
router.post('/:id/grant', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id ?? '', 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid account id' });
    return;
  }

  const parsed = GrantBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const result = await accountService.createGrant(id, parsed.data);
    res.status(201).json({
      message: 'Grant advisory created. Settlement in progress.',
      grant: result.grant,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Grant creation failed';
    const statusCode =
      message.includes('not found') ? 404 :
      message.includes('Insufficient') ? 422 :
      400;
    res.status(statusCode).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// POST /accounts/:id/rebalance
// ---------------------------------------------------------------------------
router.post('/:id/rebalance', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id ?? '', 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid account id' });
    return;
  }

  try {
    const positions = await accountService.rebalanceYield(id);
    const totalAllocated = positions.reduce((s, p) => s + p.allocatedUsdc, 0);
    const totalAccrued = positions.reduce((s, p) => s + p.accruedYield, 0);
    const weightedApy =
      totalAllocated > 0
        ? positions.reduce(
            (s, p) => s + p.currentApy * (p.allocatedUsdc / totalAllocated),
            0
          )
        : 0;

    res.json({
      message: 'Yield positions rebalanced',
      positions,
      summary: {
        totalAllocated,
        totalAccruedYield: totalAccrued,
        weightedApy: parseFloat(weightedApy.toFixed(4)),
        rebalancedAt: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Rebalance failed';
    const statusCode = message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ error: message });
  }
});

export default router;
