/**
 * Pakasir.com Payment Integration Utility
 *
 * Konfigurasi:
 * - Set VITE_PAKASIR_SLUG di file .env dengan slug proyek Anda dari pakasir.com
 * - Set VITE_PAKASIR_API_KEY di file .env dengan API key proyek Anda
 */

const PAKASIR_BASE_URL = 'https://app.pakasir.com';

export const PAKASIR_SLUG = import.meta.env.VITE_PAKASIR_SLUG || '';
export const PAKASIR_API_KEY = import.meta.env.VITE_PAKASIR_API_KEY || '';

/**
 * Mapping plan ID ke harga (dalam rupiah, tanpa titik).
 */
const PLAN_PRICES = {
    monthly: 5000,
    yearly: 299000,
};

/**
 * Mendapatkan nominal pembayaran berdasarkan plan ID.
 * @param {'monthly' | 'yearly'} planId
 * @returns {number}
 */
export function getPlanAmount(planId) {
    return PLAN_PRICES[planId] || 0;
}

/**
 * Generate order ID unik.
 * Format: TPQ-{YYYYMMDD}-{random6char}
 * @returns {string}
 */
export function generateOrderId() {
    const now = new Date();
    const date = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
    ].join('');
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TPQ-${date}-${rand}`;
}

/**
 * Generate URL pembayaran Pakasir (Integrasi Via URL).
 *
 * @param {Object} options
 * @param {string} options.slug - Slug proyek di Pakasir
 * @param {number} options.amount - Nominal pembayaran
 * @param {string} options.orderId - Order ID unik
 * @param {string} [options.redirectUrl] - URL redirect setelah bayar
 * @param {boolean} [options.qrisOnly] - Tampilkan hanya QRIS
 * @returns {string} URL pembayaran lengkap
 */
export function getPakasirPaymentUrl({ slug, amount, orderId, redirectUrl, qrisOnly = false }) {
    const url = new URL(`${PAKASIR_BASE_URL}/pay/${slug}/${amount}`);
    url.searchParams.set('order_id', orderId);

    if (redirectUrl) {
        url.searchParams.set('redirect', redirectUrl);
    }

    if (qrisOnly) {
        url.searchParams.set('qris_only', '1');
    }

    return url.toString();
}

/**
 * Cek status transaksi via Transaction Detail API.
 *
 * @param {Object} options
 * @param {string} options.slug - Slug proyek
 * @param {number} options.amount - Nominal
 * @param {string} options.orderId - Order ID
 * @param {string} options.apiKey - API key proyek
 * @returns {Promise<Object>} Detail transaksi
 */
export async function checkTransactionStatus({ slug, amount, orderId, apiKey }) {
    const url = new URL(`${PAKASIR_BASE_URL}/api/transactiondetail`);
    url.searchParams.set('project', slug);
    url.searchParams.set('amount', String(amount));
    url.searchParams.set('order_id', orderId);
    url.searchParams.set('api_key', apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
        throw new Error('Gagal mengecek status pembayaran');
    }

    return response.json();
}
