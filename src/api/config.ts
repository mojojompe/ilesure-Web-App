/// <reference types="vite/client" />
export const API_BASE_URL = 'https://api.ilesure.com/api/v1';
export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder';

export default API_BASE_URL;