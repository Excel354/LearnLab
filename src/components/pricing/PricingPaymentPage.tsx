import React, { useState, useEffect } from 'react';
import {
  Check,
  Sparkles,
  Zap,
  ShieldCheck,
  CreditCard,
  Lock,
  Crown,
  ArrowRight,
  Receipt,
  HelpCircle,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  GraduationCap,
  Building2,
  Calendar,
} from 'lucide-react';
import { BillingCycle, PaymentPlan, PaymentTransaction, StudentProfile } from '../../types';
import { PAYMENT_PLANS } from '../../data/paymentPlans';
import {
  getPaystackConfig,
  initializePaystackPayment,
  verifyPaystackPayment,
  PaystackConfig,
} from '../../utils/paystackClient';

interface PricingPaymentPageProps {
  profile: StudentProfile;
  transactions: PaymentTransaction[];
  onUpgradeSuccess: (updatedProfile: StudentProfile, tx: PaymentTransaction) => void;
  onNavigateToDashboard: () => void;
  onNavigateToStudy: () => void;
}

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: {
        key: string;
        email: string;
        amount: number;
        ref?: string;
        currency?: string;
        metadata?: any;
        onClose: () => void;
        callback: (response: { reference: string; status: string; trans: string }) => void;
      }) => {
        openIframe: () => void;
      };
    };
  }
}

export const PricingPaymentPage: React.FC<PricingPaymentPageProps> = ({
  profile,
  transactions,
  onUpgradeSuccess,
  onNavigateToDashboard,
  onNavigateToStudy,
}) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null);
  const [paystackConfig, setPaystackConfig] = useState<PaystackConfig>({
    configured: false,
    publicKey: '',
    currency: 'NGN',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSuccessTx, setLastSuccessTx] = useState<PaymentTransaction | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Load Paystack backend config
  useEffect(() => {
    let isMounted = true;
    getPaystackConfig().then((cfg) => {
      if (isMounted) setPaystackConfig(cfg);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSelectPlan = (plan: PaymentPlan) => {
    if (plan.id === 'free') {
      return;
    }
    setSelectedPlan(plan);
    setErrorMessage(null);
    setStatusMessage(null);
  };

  const handleInitiatePayment = async () => {
    if (!selectedPlan) return;

    const amount = selectedPlan.prices[billingCycle];
    if (!amount || amount <= 0) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setStatusMessage('Connecting securely to Paystack payment gateway...');

    try {
      // 1. Initialize with server
      const initResult = await initializePaystackPayment({
        email: profile.email || 'student@learnlab.ng',
        amount,
        plan: selectedPlan,
        billingCycle,
        userId: profile.id,
        studentName: profile.name || 'Student',
      });

      // 2. If running with real Paystack keys and Inline JS is loaded
      if (initResult.isLive && paystackConfig.publicKey && window.PaystackPop) {
        setStatusMessage('Opening Paystack checkout modal...');
        const handler = window.PaystackPop.setup({
          key: paystackConfig.publicKey,
          email: profile.email || 'student@learnlab.ng',
          amount: Math.round(amount * 100),
          ref: initResult.reference,
          currency: 'NGN',
          metadata: {
            userId: profile.id,
            planId: selectedPlan.id,
            planName: selectedPlan.name,
            billingCycle,
          },
          onClose: () => {
            setIsProcessing(false);
            setStatusMessage(null);
          },
          callback: async (response) => {
            await handleVerifyAndComplete(response.reference, selectedPlan, amount);
          },
        });
        handler.openIframe();
        return;
      }

      // If an authorization URL was returned (direct Paystack redirect)
      if (initResult.authorizationUrl) {
        setStatusMessage('Redirecting to Paystack secure checkout...');
        window.location.href = initResult.authorizationUrl;
        return;
      }

      // 3. Fallback / Test Sandbox Mode simulation
      // This allows immediate testing and demonstration before/after keys are provisioned
      setStatusMessage('Simulating test payment confirmation...');
      await new Promise((resolve) => setTimeout(resolve, 1400));
      await handleVerifyAndComplete(initResult.reference, selectedPlan, amount);
    } catch (err: any) {
      console.error('Payment Error:', err);
      setErrorMessage(err.message || 'Payment initialization failed. Please try again.');
      setIsProcessing(false);
      setStatusMessage(null);
    }
  };

  const handleVerifyAndComplete = async (
    reference: string,
    plan: PaymentPlan,
    amount: number
  ) => {
    setStatusMessage('Verifying payment receipt with Paystack...');
    try {
      const verifyResult = await verifyPaystackPayment({
        reference,
        planId: plan.id,
        planName: plan.name,
        billingCycle,
        amount,
        email: profile.email || 'student@learnlab.ng',
      });

      const newTx: PaymentTransaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: profile.id,
        reference: verifyResult.reference,
        amount: verifyResult.amount,
        planId: verifyResult.planId,
        planName: verifyResult.planName,
        billingCycle: verifyResult.billingCycle,
        status: 'success',
        currency: 'NGN',
        paidAt: verifyResult.paidAt || new Date().toISOString(),
        customerEmail: verifyResult.customerEmail || profile.email,
        channel: verifyResult.channel || 'Card/Paystack',
      };

      const updatedProfile: StudentProfile = {
        ...profile,
        isPremium: true,
      };

      onUpgradeSuccess(updatedProfile, newTx);
      setLastSuccessTx(newTx);
      setSelectedPlan(null);
      setIsProcessing(false);
      setStatusMessage(null);
    } catch (err: any) {
      console.error('Verification Error:', err);
      setErrorMessage(err.message || 'Payment verification failed. Please contact support.');
      setIsProcessing(false);
      setStatusMessage(null);
    }
  };

  const faqs = [
    {
      q: 'Which payment methods does Paystack support?',
      a: 'Paystack supports all Nigerian bank debit cards (Mastercard, Visa, and Verve), direct Bank Transfers, USSD bank codes (*737#, *894#, etc.), and supported mobile wallets.',
    },
    {
      q: 'What happens immediately after I pay?',
      a: 'Your LearnLab account is upgraded instantly! All daily limits on StudyBuddy AI tutor are lifted immediately, and you unlock full exam simulators, past question answers, and document processing.',
    },
    {
      q: 'Can I cancel or change my plan anytime?',
      a: 'Yes, absolutely. LearnLab has zero lock-ins or cancellation penalties. Your access remains active until the end of your billing cycle.',
    },
    {
      q: 'Is my payment information safe?',
      a: '100% safe. All transactions are securely processed through Paystack, a certified PCI-DSS Level 1 payment processor compliant with CBN and international banking standards. LearnLab never stores your card credentials.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header section */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Official Paystack Integration</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Transparent, Student-Friendly Pricing
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Boost your study routine with unlimited AI tutoring, past question breakdowns, and tailored exam preparation for Primary, Secondary, and University levels.
          </p>

          {/* Current Tier Status Banner */}
          <div className="pt-2 flex items-center justify-center gap-3">
            <div
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold border ${
                profile.isPremium
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {profile.isPremium ? (
                <>
                  <Crown className="w-4 h-4 text-emerald-600" />
                  <span>Your Current Plan: LearnLab Pro Active (Unlimited Access)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Your Current Plan: Free Starter Tier (4 StudyBuddy replies/day)</span>
                </>
              )}
            </div>

            {transactions.length > 0 && (
              <button
                id="view-receipts-btn"
                onClick={() => setShowHistoryModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <Receipt className="w-3.5 h-3.5 text-slate-500" />
                <span>Payment History ({transactions.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center">
          <div className="inline-flex p-1 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <button
              id="billing-monthly-btn"
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              id="billing-termly-btn"
              onClick={() => setBillingCycle('termly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === 'termly'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Termly (3 Mo)</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  billingCycle === 'termly'
                    ? 'bg-indigo-700 text-white'
                    : 'bg-emerald-100 text-emerald-700 font-bold'
                }`}
              >
                Save 20%
              </span>
            </button>
            <button
              id="billing-annual-btn"
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Annual</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  billingCycle === 'annual'
                    ? 'bg-indigo-700 text-white'
                    : 'bg-amber-100 text-amber-800 font-bold'
                }`}
              >
                Save 35%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {PAYMENT_PLANS.map((plan) => {
            const price = plan.prices[billingCycle];
            const isCurrentTier =
              (plan.id === 'free' && !profile.isPremium) ||
              (plan.id !== 'free' && profile.isPremium);

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-3xl bg-white transition-all duration-200 ${
                  plan.popular
                    ? 'border-2 border-indigo-600 shadow-xl shadow-indigo-600/10 ring-4 ring-indigo-50'
                    : 'border border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Popular Badge */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm">
                      <Sparkles className="w-3 h-3" />
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="p-6 sm:p-7 flex-1 flex flex-col">
                  {/* Card Header */}
                  <div className="space-y-2 border-b border-slate-100 pb-5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-extrabold text-slate-900">{plan.name}</h2>
                      {plan.id === 'free' ? (
                        <GraduationCap className="w-5 h-5 text-slate-400" />
                      ) : plan.id === 'pro' ? (
                        <Crown className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <Building2 className="w-5 h-5 text-violet-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 min-h-[32px]">{plan.tagline}</p>

                    {/* Price Display */}
                    <div className="pt-3">
                      {price === 0 ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">₦0</span>
                          <span className="text-xs font-semibold text-slate-400">/ forever free</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                              {formatNaira(price)}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                              / {billingCycle === 'monthly' ? 'month' : billingCycle === 'termly' ? 'term' : 'year'}
                            </span>
                          </div>
                          {billingCycle !== 'monthly' && (
                            <p className="text-[11px] font-semibold text-emerald-600">
                              Billed {billingCycle === 'termly' ? 'every 3 months' : 'annually'}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Best for */}
                  <div className="py-3 text-[11px] text-slate-600 font-medium">
                    <span className="text-slate-400 font-normal">Best for: </span>
                    {plan.recommendedFor}
                  </div>

                  {/* Feature list */}
                  <div className="flex-1 pt-3 pb-6">
                    <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                      Included Capabilities:
                    </p>
                    <ul className="space-y-2.5">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                          <div className="mt-0.5 rounded-full p-0.5 bg-emerald-50 text-emerald-600 shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                          <span className="leading-snug">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Action */}
                  <div className="pt-4 mt-auto">
                    {plan.id === 'free' ? (
                      <button
                        disabled
                        className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 cursor-not-allowed text-center"
                      >
                        {isCurrentTier ? 'Your Active Plan' : 'Free Starter Tier'}
                      </button>
                    ) : (
                      <button
                        id={`select-plan-${plan.id}`}
                        onClick={() => handleSelectPlan(plan)}
                        className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 group ${
                          plan.popular
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/25 active:scale-[0.98]'
                            : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm active:scale-[0.98]'
                        }`}
                      >
                        <Crown className="w-3.5 h-3.5 text-amber-300" />
                        <span>{isCurrentTier ? 'Renew / Extend Subscription' : `Upgrade to ${plan.name}`}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security & Paystack Trust Banner */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center md:text-left">
            <div className="flex items-center md:items-start gap-3 flex-col md:flex-row text-center md:text-left">
              <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">256-Bit Bank Encryption</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Secure SSL transmission compliant with global PCI standards.</p>
              </div>
            </div>

            <div className="flex items-center md:items-start gap-3 flex-col md:flex-row text-center md:text-left">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Paystack Verified</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Licensed by CBN and backed by Stripe security infrastructure.</p>
              </div>
            </div>

            <div className="flex items-center md:items-start gap-3 flex-col md:flex-row text-center md:text-left">
              <div className="p-3 rounded-2xl bg-violet-50 text-violet-600 shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Nigerian & Global Cards</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Verve, Mastercard, Visa, Direct Bank Transfers, and USSD.</p>
              </div>
            </div>

            <div className="flex items-center md:items-start gap-3 flex-col md:flex-row text-center md:text-left">
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Instant Activation</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Zero delays. StudyBuddy and exam tools unlock immediately.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Frequently Asked Questions */}
        <div className="max-w-3xl mx-auto space-y-6 pt-4">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-slate-900">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-500">Everything you need to know about payments on LearnLab</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>{faq.q}</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed pl-5.5">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Paystack Checkout Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-6 relative">
            {/* Close Button */}
            <button
              onClick={() => {
                if (!isProcessing) {
                  setSelectedPlan(null);
                  setErrorMessage(null);
                  setStatusMessage(null);
                }
              }}
              disabled={isProcessing}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold">
                <Crown className="w-3 h-3" />
                <span>Complete Upgrade</span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Pay with Paystack</h3>
              <p className="text-xs text-slate-500">Review your subscription order details below</p>
            </div>

            {/* Order Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Plan:</span>
                <span className="font-bold text-slate-900">{selectedPlan.name}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Billing Cycle:</span>
                <span className="font-semibold text-slate-700 capitalize">{billingCycle}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Student Account:</span>
                <span className="font-medium text-slate-700 truncate max-w-[200px]">
                  {profile.email || 'student@learnlab.ng'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 text-sm font-extrabold text-slate-900">
                <span>Total Amount:</span>
                <span className="text-indigo-600 text-base">
                  {formatNaira(selectedPlan.prices[billingCycle])}
                </span>
              </div>
            </div>

            {/* Paystack Channel Info */}
            <div className="rounded-xl p-3 bg-emerald-50/70 border border-emerald-200/60 text-[11px] text-emerald-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Paystack Supported Payment Channels</span>
              </div>
              <p className="text-emerald-700 leading-relaxed">
                Nigerian Debit Cards (Mastercard, Visa, Verve), Direct Bank Transfer, USSD (*Bank Codes*), and Mobile Money.
              </p>
            </div>

            {/* Error Display */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Progress Status Message */}
            {statusMessage && (
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs flex items-center gap-2 animate-pulse">
                <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                id="paystack-pay-now-btn"
                onClick={handleInitiatePayment}
                disabled={isProcessing}
                className="w-full py-3.5 px-4 rounded-xl text-xs font-extrabold bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Pay {formatNaira(selectedPlan.prices[billingCycle])} with Paystack</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setSelectedPlan(null)}
                disabled={isProcessing}
                className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Cancel and return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Success Celebration Modal */}
      {lastSuccessTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in zoom-in-95 duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-200">
                Payment Successful
              </span>
              <h3 className="text-2xl font-black text-slate-900">Welcome to LearnLab Pro!</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your payment of {formatNaira(lastSuccessTx.amount)} via Paystack has been confirmed. All Pro study capabilities and unlimited StudyBuddy AI tutoring are now fully active.
              </p>
            </div>

            {/* Receipt Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction Ref:</span>
                <span className="font-mono font-bold text-slate-800">{lastSuccessTx.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Plan:</span>
                <span className="font-semibold text-slate-800">{lastSuccessTx.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Channel:</span>
                <span className="font-medium text-slate-800">{lastSuccessTx.channel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-medium text-slate-800">
                  {new Date(lastSuccessTx.paidAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <button
                id="success-start-study-btn"
                onClick={() => {
                  setLastSuccessTx(null);
                  onNavigateToStudy();
                }}
                className="w-full py-3.5 px-4 rounded-xl text-xs font-extrabold bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start Unlimited Study Session</span>
              </button>
              <button
                id="success-return-dash-btn"
                onClick={() => {
                  setLastSuccessTx(null);
                  onNavigateToDashboard();
                }}
                className="w-full py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">Your Paystack Receipts</h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
              {transactions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No payment transactions logged yet.
                </div>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-slate-900">{tx.planName}</div>
                      <div className="font-mono text-[10px] text-slate-400">Ref: {tx.reference}</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(tx.paidAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-extrabold text-slate-900">{formatNaira(tx.amount)}</div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <Check className="w-3 h-3" />
                        <span>Paid</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowHistoryModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
