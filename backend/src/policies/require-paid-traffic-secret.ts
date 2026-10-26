import crypto from 'crypto';
import { env, errors } from '@strapi/utils';

/**
 * Server-to-server protection for the paid-traffic lookup endpoint.
 *
 * The endpoint returns a brand's affiliate tracking URL template, so it is
 * restricted to callers that know the shared secret (the Next.js server).
 * The secret lives only in the server environment and is never logged,
 * returned or exposed to the browser. Fails closed when it is missing.
 */
function sha256(value: string): Buffer {
  return crypto.createHash('sha256').update(value, 'utf8').digest();
}

export default async (policyContext: any) => {
  const expected = env('PAID_TRAFFIC_LOOKUP_SECRET');

  if (!expected) {
    throw new errors.UnauthorizedError('Paid traffic lookup is not configured');
  }

  const header = policyContext.request?.headers?.['x-paid-traffic-secret'];
  const provided = Array.isArray(header) ? header[0] : header;

  // Compare fixed-length digests so secrets of different lengths are safe.
  const ok =
    typeof provided === 'string' &&
    provided.length > 0 &&
    crypto.timingSafeEqual(sha256(provided), sha256(expected));

  if (!ok) {
    throw new errors.UnauthorizedError('Invalid paid traffic lookup secret');
  }

  return true;
};
