import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@17.5.0';

const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

const stripe = new Stripe(stripeKey, {
  apiVersion: '2024-12-18.acacia',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const transactionId = body.data?.id || body.transaction_id || body.event?.entity_id;

    if (!transactionId) {
      return Response.json({ error: 'Missing transaction_id' }, { status: 400 });
    }

    // Fetch the transaction record
    const transactions = await base44.asServiceRole.entities.Transaction.filter({ id: transactionId });
    const tx = transactions[0];

    if (!tx) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (tx.status !== 'succeeded') {
      return Response.json({ skipped: true, reason: `Status is ${tx.status}, expected succeeded` });
    }

    if (tx.platform_fee != null && tx.merchant_payout != null && tx.stripe_transfer_id) {
      return Response.json({ skipped: true, reason: 'Already distributed' });
    }

    const grossAmount = tx.gross_amount;

    // --- Determine platform fee rate ---
    let platformFeeRate = tx.platform_fee_rate;
    if (!platformFeeRate && tx.merchant_id) {
      const merchants = await base44.asServiceRole.entities.Merchant.filter({ id: tx.merchant_id });
      const merchant = merchants[0];
      if (merchant?.platform_fee_override != null) {
        platformFeeRate = merchant.platform_fee_override / 100;
      }
    }
    if (!platformFeeRate) {
      const settings = await base44.asServiceRole.entities.PlatformSettings.list();
      platformFeeRate = settings[0]?.platform_fee_rate ?? 0.05;
    }

    // --- Determine creator commission rate ---
    let creatorCommissionRate = tx.creator_commission_rate;
    let creatorCommissionAmount = 0;

    if (!creatorCommissionRate && tx.creator_id) {
      const creators = await base44.asServiceRole.entities.Creator.filter({ id: tx.creator_id });
      const creator = creators[0];
      if (creator) {
        if (creator.commission_model === 'flat_fee' && creator.flat_fee_amount) {
          creatorCommissionAmount = creator.flat_fee_amount;
          creatorCommissionRate = creatorCommissionAmount / grossAmount;
        } else {
          creatorCommissionRate = creator.default_commission_rate ?? 0.1;
        }
      }
    }

    // Calculate amounts
    const platformFee = Math.round(grossAmount * platformFeeRate);
    if (creatorCommissionAmount === 0) {
      creatorCommissionAmount = Math.round(grossAmount * (creatorCommissionRate ?? 0));
    }
    const merchantPayout = grossAmount - platformFee - creatorCommissionAmount;

    // Extract transfer group from metadata
    let transferGroup = '';
    try {
      const md = tx.metadata ? JSON.parse(tx.metadata) : {};
      transferGroup = md.transfer_group || '';
    } catch (_) { /* ignore */ }

    // --- Create Stripe Connect transfers ---
    let stripeTransferId = '';
    if (transferGroup) {
      try {
        // Transfer merchant payout to merchant's connected account
        if (tx.merchant_id) {
          const merchants = await base44.asServiceRole.entities.Merchant.filter({ id: tx.merchant_id });
          const merchant = merchants[0];
          if (merchant?.stripe_account_id) {
            const merchantTransfer = await stripe.transfers.create({
              amount: merchantPayout,
              currency: tx.currency || 'usd',
              transfer_group: transferGroup,
              destination: merchant.stripe_account_id,
              metadata: {
                transaction_id: tx.id,
                merchant_id: tx.merchant_id,
                type: 'merchant_payout',
              },
            });
            stripeTransferId = merchantTransfer.id;
            console.log(`Merchant transfer created: ${merchantTransfer.id} → ${merchant.stripe_account_id}`);
          }
        }

        // Transfer creator commission to creator's connected account
        if (tx.creator_id && creatorCommissionAmount > 0) {
          const creators = await base44.asServiceRole.entities.Creator.filter({ id: tx.creator_id });
          const creator = creators[0];
          if (creator?.stripe_account_id) {
            const creatorTransfer = await stripe.transfers.create({
              amount: creatorCommissionAmount,
              currency: tx.currency || 'usd',
              transfer_group: transferGroup,
              destination: creator.stripe_account_id,
              metadata: {
                transaction_id: tx.id,
                creator_id: tx.creator_id,
                type: 'creator_commission',
              },
            });
            console.log(`Creator transfer created: ${creatorTransfer.id} → ${creator.stripe_account_id}`);
          }
        }
      } catch (transferErr) {
        console.error('Stripe transfer error:', transferErr.message);
      }
    }

    // Update the transaction with calculated fees + transfer ID
    await base44.asServiceRole.entities.Transaction.update(tx.id, {
      platform_fee: platformFee,
      platform_fee_rate: platformFeeRate,
      creator_commission: creatorCommissionAmount,
      creator_commission_rate: creatorCommissionRate ?? 0,
      merchant_payout: merchantPayout,
      stripe_transfer_id: stripeTransferId || tx.stripe_transfer_id,
    });

    // Update creator's total earnings
    if (tx.creator_id && creatorCommissionAmount > 0) {
      const creators = await base44.asServiceRole.entities.Creator.filter({ id: tx.creator_id });
      const creator = creators[0];
      if (creator) {
        await base44.asServiceRole.entities.Creator.update(tx.creator_id, {
          total_earnings: (creator.total_earnings ?? 0) + creatorCommissionAmount,
        });
      }
    }

    // Update product revenue/sales stats
    if (tx.product_id) {
      const products = await base44.asServiceRole.entities.ProductRegistry.filter({ id: tx.product_id });
      const product = products[0];
      if (product) {
        await base44.asServiceRole.entities.ProductRegistry.update(tx.product_id, {
          total_revenue: (product.total_revenue ?? 0) + grossAmount,
          total_sales: (product.total_sales ?? 0) + 1,
        });
      }
    }

    return Response.json({
      success: true,
      transaction_id: tx.id,
      gross_amount: grossAmount,
      platform_fee: platformFee,
      platform_fee_rate: platformFeeRate,
      creator_commission: creatorCommissionAmount,
      creator_commission_rate: creatorCommissionRate ?? 0,
      merchant_payout: merchantPayout,
      stripe_transfer_id: stripeTransferId,
    });

  } catch (error) {
    console.error('Distribute transaction fees error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});