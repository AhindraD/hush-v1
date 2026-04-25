import { Router, Request, Response } from 'express';
import { AccountService } from '../services/AccountService';

const router = Router();
const accountService = new AccountService();

// GET /accounts — list all accounts
router.get('/', (_req: Request, res: Response) => {
  try {
    const accounts = accountService.getAllAccounts();
    res.json({ accounts });
  } catch (err) {
    console.error('[GET /accounts]', err);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// GET /accounts/:id — get single account
router.get('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id ?? '', 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid account id' });
    return;
  }
  const account = accountService.getAccount(id);
  if (!account) {
    res.status(404).json({ error: `Account ${id} not found` });
    return;
  }
  res.json({ account });
});

// GET /accounts/:id/deposits
router.get('/:id/deposits', (req: Request, res: Response) => {
  const id = parseInt(req.params.id ?? '', 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid account id' });
    return;
  }
  if (!accountService.getAccount(id)) {
    res.status(404).json({ error: `Account ${id} not found` });
    return;
  }
  const result = accountService.getDeposits(id);
  res.json({ deposits: result, count: result.length });
});

// GET /accounts/:id/grants
router.get('/:id/grants', (req: Request, res: Response) => {
  const id = parseInt(req.params.id ?? '', 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid account id' });
    return;
  }
  if (!accountService.getAccount(id)) {
    res.status(404).json({ error: `Account ${id} not found` });
    return;
  }
  const result = accountService.getGrants(id);
  res.json({ grants: result, count: result.length });
});

// GET /accounts/:id/yield
router.get('/:id/yield', (req: Request, res: Response) => {
  const id = parseInt(req.params.id ?? '', 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid account id' });
    return;
  }
  if (!accountService.getAccount(id)) {
    res.status(404).json({ error: `Account ${id} not found` });
    return;
  }
  const positions = accountService.getYieldPositions(id);
  const totalAllocated = positions.reduce((s, p) => s + p.allocatedUsdc, 0);
  const totalAccrued = positions.reduce((s, p) => s + p.accruedYield, 0);
  const weightedApy =
    totalAllocated > 0
      ? positions.reduce((s, p) => s + p.currentApy * (p.allocatedUsdc / totalAllocated), 0)
      : 0;
  res.json({
    positions,
    summary: {
      totalAllocated,
      totalAccruedYield: totalAccrued,
      weightedApy: parseFloat(weightedApy.toFixed(4)),
      positionCount: positions.length,
    },
  });
});

// GET /accounts/:id/audit-logs
router.get('/:id/audit-logs', (req: Request, res: Response) => {
  const id = parseInt(req.params.id ?? '', 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid account id' });
    return;
  }
  if (!accountService.getAccount(id)) {
    res.status(404).json({ error: `Account ${id} not found` });
    return;
  }
  const logs = accountService.getAuditLogs(id);
  res.json({ auditLogs: logs, count: logs.length });
});

export default router;
