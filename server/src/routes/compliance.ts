/**
 * compliance.ts — Viewing key verification and ZK-Tax-Receipt routes.
 * Also proxies the MagicBlock private-balance API to avoid CORS issues.
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { ViewingKeyService } from '../services/ViewingKeyService';

export const complianceRouter = Router();

// ── Schemas ───────────────────────────────────────────────────────────────────

const verifyKeySchema = z.object({
  viewingKey: z.string().min(3),
  taxYear:    z.number().int().min(2020).max(2050),
});

// ── GET /private-balance/:address ─────────────────────────────────────────────
// Proxies MagicBlock GET /v1/spl/private-balance to avoid browser CORS.

complianceRouter.get(
  '/private-balance/:address',
  async (req: Request, res: Response): Promise<void> => {
    const { address } = req.params;
    const cluster = (req.query.cluster as string) ?? 'devnet';
    const mint    = (req.query.mint as string) ??
      (cluster === 'mainnet'
        ? 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
        : '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

    try {
      const url = new URL('https://payments.magicblock.app/v1/spl/private-balance');
      url.searchParams.set('address', address);
      url.searchParams.set('cluster', cluster);
      url.searchParams.set('mint', mint);

      const upstream = await fetch(url.toString());
      if (!upstream.ok) {
        const text = await upstream.text();
        res.status(upstream.status).json({ error: text });
        return;
      }
      const data = await upstream.json();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);

// ── POST /:accountId/verify ───────────────────────────────────────────────────

complianceRouter.post(
  '/:accountId/verify',
  async (req: Request, res: Response): Promise<void> => {
    const parsed = verifyKeySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    try {
      const receipt = await ViewingKeyService.generateTaxReceipt(
        req.params.accountId,
        parsed.data.viewingKey,
        parsed.data.taxYear,
      );
      res.json(receipt);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes('not found') || msg.includes('Invalid viewing key')) {
        res.status(404).json({ error: msg });
      } else {
        res.status(500).json({ error: msg });
      }
    }
  },
);

// ── GET /:accountId/audit-log ─────────────────────────────────────────────────

complianceRouter.get(
  '/:accountId/audit-log',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const log = await ViewingKeyService.getAuditLog(req.params.accountId);
      res.json({ entries: log });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
);
