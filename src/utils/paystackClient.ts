import { BillingCycle, PaymentPlan } from '../types';

export interface PaystackConfig {
  configured: boolean;
  publicKey: string;
  currency: string;
}

export interface InitializePaystackParams {
  email: string;
  amount: number;
  plan: PaymentPlan;
  billingCycle: BillingCycle;
  userId: string;
  studentName: string;
}

export interface PaystackInitResponse {
  success: boolean;
  authorizationUrl?: string | null;
  accessCode?: string | null;
  reference: string;
  publicKey?: string;
  isLive?: boolean;
  isTestMode?: boolean;
  message?: string;
  error?: string;
}

export interface PaystackVerifyResponse {
  success: boolean;
  verified: boolean;
  isTestMode?: boolean;
  reference: string;
  amount: number;
  planId: string;
  planName: string;
  billingCycle: BillingCycle;
  channel?: string;
  paidAt: string;
  customerEmail: string;
  message?: string;
}

/**
 * Fetch Paystack public configuration status from backend
 */
export async function getPaystackConfig(): Promise<PaystackConfig> {
  try {
    const res = await fetch('/api/paystack/config');
    if (!res.ok) throw new Error('Failed to load Paystack configuration');
    return await res.json();
  } catch (e) {
    console.warn('Could not fetch paystack config:', e);
    return { configured: false, publicKey: '', currency: 'NGN' };
  }
}

/**
 * Initialize a Paystack transaction via server API
 */
export async function initializePaystackPayment(
  params: InitializePaystackParams
): Promise<PaystackInitResponse> {
  const res = await fetch('/api/paystack/initialize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: params.email,
      amount: params.amount,
      planId: params.plan.id,
      planName: params.plan.name,
      billingCycle: params.billingCycle,
      userId: params.userId,
      studentName: params.studentName,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to initialize Paystack payment.');
  }
  return data;
}

/**
 * Verify transaction reference via server API
 */
export async function verifyPaystackPayment(payload: {
  reference: string;
  planId: string;
  planName: string;
  billingCycle: BillingCycle;
  amount: number;
  email: string;
}): Promise<PaystackVerifyResponse> {
  const res = await fetch('/api/paystack/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || !data.success || !data.verified) {
    throw new Error(data.message || 'Payment verification failed.');
  }
  return data;
}
