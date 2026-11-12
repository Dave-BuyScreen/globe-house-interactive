import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, AlertCircle, CreditCard, Lock } from "lucide-react";

export default function StripeCheckoutForm({
  amount,
  currency,
  productName,
  productDescription,
  episodeId,
  triggerTimestamp,
  merchantId,
  creatorId,
  productId,
  onSuccess,
  onCancel
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create payment intent from backend
      const { base44 } = await import("@/api/base44Client");
      const response = await base44.functions.invoke('createStripePaymentIntent', {
        amount,
        currency,
        product_name: productName,
        product_description: productDescription,
        episode_id: episodeId,
        trigger_timestamp: triggerTimestamp,
        merchant_id: merchantId,
        creator_id: creatorId,
        product_id: productId,
        customer_email: email,
        customer_name: name
      });

      const { clientSecret } = response.data;

      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: name || undefined,
            email: email || undefined,
          },
        },
      });

      if (stripeError) {
        setError(stripeError.message);
        setIsProcessing(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Payment failed');
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#fff',
        backgroundColor: 'transparent',
        '::placeholder': {
          color: 'rgba(255, 255, 255, 0.3)',
        },
        iconColor: 'rgba(255, 255, 255, 0.5)',
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444',
      },
    },
    hidePostalCode: false,
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Payment Successful!</h3>
        <p className="text-white/60 text-sm mb-4">
          Thank you for your purchase of {productName}
        </p>
        <p className="text-white/40 text-xs">
          A confirmation email will be sent shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-white mb-1">Complete Your Purchase</h3>
        <p className="text-white/50 text-sm">{productName}</p>
        <p className="text-2xl font-bold text-white mt-3">
          {currency.toUpperCase()} ${amount.toFixed(2)}
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs text-white/60 mb-1.5">Full Name</Label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="h-10 bg-white/[0.08] border-white/[0.12] text-white placeholder:text-white/30"
            required
          />
        </div>

        <div>
          <Label className="text-xs text-white/60 mb-1.5">Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            className="h-10 bg-white/[0.08] border-white/[0.12] text-white placeholder:text-white/30"
            required
          />
        </div>

        <div>
          <Label className="text-xs text-white/60 mb-1.5 flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5" />
            Card Details
          </Label>
          <div className="p-3 bg-white/[0.08] border border-white/[0.12] rounded-lg">
            <CardElement options={cardElementOptions} />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 text-xs text-white/40 py-2">
        <Lock className="w-3 h-3" />
        <span>Secured by Stripe • Your payment info is encrypted</span>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="flex-1 h-11 border-white/[0.12] hover:bg-white/[0.04]"
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 h-11 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            `Pay ${currency.toUpperCase()} $${amount.toFixed(2)}`
          )}
        </Button>
      </div>

      <p className="text-xs text-white/30 text-center">
        By completing this purchase, you agree to our terms of service.
      </p>
    </form>
  );
}