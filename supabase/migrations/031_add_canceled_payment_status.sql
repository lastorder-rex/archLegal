-- Migration: Add 'canceled' status for payment stages
-- Description: Adds support for 'canceled' status to prevent re-payment after admin cancellation
-- -----------------------------------------------------------------------------

-- Add comment to document the 'canceled' status
COMMENT ON COLUMN public.user_payment_stages.status IS
'Payment stage status:
- locked: Stage not yet activated by admin
- requested: Payment requested by admin, awaiting user action
- awaiting: Payment activation confirmed, user can proceed
- paid: Payment successfully completed
- canceled: Payment was canceled (admin cancellation via Toss admin), cannot be re-paid';

-- Note: No schema change needed as status column is already text type without constraints
-- The 'canceled' status will be set by webhook when payment is canceled via Toss admin page
