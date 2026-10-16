import crypto from 'crypto';
import { env, errors } from '@strapi/utils';

/**
 * Machine authentication for the import API.
 *
 * Requires `Authorization: Bearer <IMPORT_API_TOKEN>`. The expected token
 * lives only in the server environment — it is never logged, returned,
 * or sent to any client. Fails closed when the variable is missing/empty.
 */
function sha256(value: string): Buffer {
  return crypto.createHash('sha256').update(value, 'utf8').digest();
}

export default async (policyContext: any) => {
  const expected = env('IMPORT_API_TOKEN');

  if (!expected) {
    throw new errors.UnauthorizedError('Import API is not configured');
  }

  const header = policyContext.request?.headers?.authorization;
  let provided: string | undefined;
  if (typeof header === 'string') {
    const [scheme, ...rest] = header.split(' ');
    if (scheme.toLowerCase() === 'bearer') {
      provided = rest.join(' ').trim() || undefined;
    }
  }

  // Compare fixed-length digests so tokens of different lengths are safe.
  const ok =
    typeof provided === 'string' &&
    provided.length > 0 &&
    crypto.timingSafeEqual(sha256(provided), sha256(expected));

  if (!ok) {
    throw new errors.UnauthorizedError('Invalid import API token');
  }

  return true;
};
