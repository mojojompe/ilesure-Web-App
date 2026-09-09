/// <reference types="vite/client" />
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.ilesure.com/api/v1';
export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder';

/**
 * BUGFIX (flow audit): the Terms of Service and Privacy Policy links on the signup screen were
 * root-relative ("/terms-of-service", "/privacy-policy"). Those are routes on the MARKETING
 * site, not this portal — this app has no such routes, so both resolved against its own origin
 * and landed on its `path="*"` NotFound. A signup form that asks you to agree to terms it
 * cannot show you is not a small thing.
 *
 * Absolute, and configurable, so a staging portal can point at a staging marketing site rather
 * than sending testers to production.
 */
export const MARKETING_URL = import.meta.env.VITE_MARKETING_URL || 'https://ilesure.com';

export default API_BASE_URL;