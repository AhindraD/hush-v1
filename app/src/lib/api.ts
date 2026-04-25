/**
 * HUSH Server API client.
 * All methods return typed responses and throw on non-2xx status.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ─────────────────────────────────────────────────────────
// Core fetch wrappers
// ─────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorBody: { code?: string; message?: string } = {};
    try {
      errorBody = await res.json();
    } catch {
      // ignore parse errors
    }
    throw new ApiError(
      res.status,
      errorBody.code ?? 'UNKNOWN',
      errorBody.message ?? `HTTP ${res.status} ${res.statusText}`,
    );
  }
  return res.json() as Promise<T>;
}

export async function apiGet<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method:  'GET',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  return handleResponse<T>(res);
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    body:    JSON.stringify(body),
    ...init,
  });
  return handleResponse<T>(res);
}

export async function apiPatch<T>(
  path: string,
  body: unknown,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    body:    JSON.stringify(body),
    ...init,
  });
  return handleResponse<T>(res);
}

export async function apiDelete<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method:  'DELETE',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  return handleResponse<T>(res);
}

// ─────────────────────────────────────────────────────────
// Typed API endpoints
// TODO: Replace inline types with imports from @hush/types once package is installed
// ─────────────────────────────────────────────────────────

export interface HushAccount {
  id:             string;
  ownerPubkey:    string;
  shieldedBalance: number;       // in USDC lamports (6 decimals)
  yieldEarned:    number;
  createdAt:      number;        // unix ms
  updatedAt:      number;
}

export interface Deposit {
  id:             string;
  accountId:      string;
  amount:         number;
  stealthPubkey:  string;
  txHash:         string;
  status:         'pending' | 'confirmed' | 'failed' | 'shielded';
  createdAt:      number;
}

export interface YieldPosition {
  id:             string;
  accountId:      string;
  protocol:       string;
  apy:            number;        // decimal, e.g. 0.0842
  allocated:      number;        // USDC lamports
  accrued:        number;        // USDC lamports
  updatedAt:      number;
}

export interface Grant {
  id:             string;
  accountId:      string;
  charityName:    string;
  charityAddress: string;
  amount:         number;
  memo:           string;
  txHash:         string;
  status:         'pending' | 'processing' | 'settled' | 'failed';
  createdAt:      number;
}

export interface TaxReceipt {
  receiptId:       string;
  zkProofCid:      string;
  taxYear:         number;
  totalDeposits:   number;
  totalGrants:     number;
  yieldEarned:     number;
  deposits:        Deposit[];
  grants:          Grant[];
  generatedAt:     number;
}

export interface AccountData {
  account:        HushAccount;
  deposits:       Deposit[];
  yieldPositions: YieldPosition[];
  grants:         Grant[];
}

// ─────────────────────────────────────────────────────────
// Account endpoints
// ─────────────────────────────────────────────────────────

export const getAccount = (accountId: string) =>
  apiGet<AccountData>(`/api/accounts/${accountId}`);

export const shieldDeposit = (
  accountId: string,
  payload: { amount: number; stealthPubkey: string; txHash: string },
) => apiPost<Deposit>(`/api/accounts/${accountId}/deposit`, payload);

export const adviseGrant = (
  accountId: string,
  payload: {
    charityName:    string;
    charityAddress: string;
    amount:         number;
    memo:           string;
  },
) => apiPost<Grant>(`/api/accounts/${accountId}/grant`, payload);

export const generateTaxReceipt = (
  accountId: string,
  payload: { viewingKey: string; taxYear: number },
) => apiPost<TaxReceipt>(`/api/accounts/${accountId}/tax-receipt`, payload);

export const rebalanceYield = (accountId: string) =>
  apiPost<{ success: boolean }>(`/api/accounts/${accountId}/rebalance`, {});
