import crypto from 'crypto';

export function generateOrderId() {
  return 'EBC-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}
