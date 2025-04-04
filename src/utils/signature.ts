// src/utils/signature.ts
import * as crypto from 'crypto';

/**
 * Verifies a signature against a raw body and secret using HMAC-SHA256.
 *
 * @param rawBody The raw body of the message (string).
 * @param signature The signature to verify (string).
 * @param secret The secret used to generate the signature (string).
 * @returns True if the signatures match, false otherwise.
 */
export function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBody);
    const calculatedSignature = hmac.digest('hex');

    return calculatedSignature === signature;
  } catch (error) {
    // Handle potential errors (e.g., invalid secret, etc.).
    console.error('Error verifying signature:', error); // Log the error for debugging.
    return false; // Return false in case of an error.
  }
}