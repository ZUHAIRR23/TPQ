import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { PAKASIR_SLUG, PAKASIR_API_KEY } from '../lib/pakasir';

const PaymentVerifyPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const orderId = searchParams.get('order_id');

    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Fetch payment record dari Supabase
    const fetchPayment = useCallback(async () => {
        if (!orderId) {
            setError('Order ID tidak ditemukan.');
            setLoading(false);
            return;
        }

        const { data, error: fetchErr } = await supabase
            .from('payments')
            .select('*')
            .eq('order_id', orderId)
            .maybeSingle();

        if (fetchErr) {
            setError('Gagal mengambil data pembayaran.');
            setLoading(false);
            return;
        }

        if (!data) {
            setError('Transaksi tidak ditemukan.');
            setLoading(false);
            return;
        }

        setPayment(data);

        if (data.status === 'completed') {
            setSuccess(true);
        }

        setLoading(false);
    }, [orderId]);

    useEffect(() => {
        fetchPayment();
    }, [fetchPayment]);

    // Cek status pembayaran via Supabase RPC (server-side proxy ke Pakasir API)
    const handleCheckStatus = async () => {
        if (!payment) return;

        setChecking(true);
        setError('');

        try {
            // Panggil database function yang melakukan HTTP request ke Pakasir server-side
            const { data: result, error: rpcError } = await supabase.rpc('check_pakasir_payment', {
                p_project: PAKASIR_SLUG,
                p_amount: payment.amount,
                p_order_id: payment.order_id,
                p_api_key: PAKASIR_API_KEY,
            });

            if (rpcError) {
                throw new Error('Gagal mengecek status pembayaran. Pastikan fungsi database sudah di-setup.');
            }

            if (result?.error) {
                throw new Error(result.message || 'Gagal mengecek status pembayaran.');
            }

            if (result?.transaction?.status === 'completed') {
                // Update payment di Supabase
                const { error: updatePayErr } = await supabase
                    .from('payments')
                    .update({
                        status: 'completed',
                        payment_method: result.transaction.payment_method || null,
                        completed_at: result.transaction.completed_at || new Date().toISOString(),
                    })
                    .eq('order_id', payment.order_id);

                if (updatePayErr) {
                    throw new Error('Gagal memperbarui status pembayaran.');
                }

                // Aktifkan subscription
                const { data: { user } } = await supabase.auth.getUser();

                let expiresAt = new Date();
                if (payment.plan === 'monthly') {
                    expiresAt.setMonth(expiresAt.getMonth() + 1);
                } else if (payment.plan === 'yearly') {
                    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
                }

                const { error: subErr } = await supabase
                    .from('subscriptions')
                    .upsert(
                        {
                            user_id: user.id,
                            plan: payment.plan,
                            status: 'active',
                            expires_at: expiresAt.toISOString(),
                        },
                        { onConflict: 'user_id' }
                    );

                if (subErr) {
                    throw new Error('Gagal mengaktifkan langganan.');
                }

                setSuccess(true);
                setPayment((prev) => ({ ...prev, status: 'completed' }));
            } else {
                setError('Pembayaran belum diterima. Silakan coba lagi beberapa saat.');
            }
        } catch (err) {
            setError(err.message || 'Gagal mengecek status pembayaran.');
        } finally {
            setChecking(false);
        }
    };

    const formatRupiah = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
                <div className="flex items-center gap-3 text-gray-500">
                    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Memuat data pembayaran...
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 relative overflow-hidden">
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-tpq-green/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-tpq-yellow/8 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

            {/* Top Bar */}
            <header className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5 max-w-6xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-tpq-green flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <span className="text-base font-bold text-gray-900">Athir TPQ</span>
                </div>
                <Link
                    to="/subscribe"
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-tpq-green transition-colors group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-0.5">
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Kembali
                </Link>
            </header>

            {/* Content */}
            <div className="relative z-10 max-w-lg mx-auto px-6 pt-4 pb-16">
                {/* Success State */}
                {success ? (
                    <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-tpq-green/10 flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-tpq-green">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Berhasil! 🎉</h1>
                        <p className="text-gray-500 text-sm mb-8">
                            Langganan Anda telah aktif. Selamat menggunakan Athir TPQ!
                        </p>

                        {payment && (
                            <div className="bg-white rounded-2xl shadow-lg shadow-gray-900/5 ring-1 ring-gray-200/80 p-6 mb-8 text-left">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4">Detail Transaksi</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Order ID</span>
                                        <span className="font-mono text-gray-700">{payment.order_id}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Paket</span>
                                        <span className="text-gray-700 capitalize">{payment.plan === 'monthly' ? 'Bulanan' : 'Tahunan'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Nominal</span>
                                        <span className="font-semibold text-gray-900">{formatRupiah(payment.amount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Status</span>
                                        <span className="inline-flex items-center gap-1.5 text-tpq-green font-medium">
                                            <span className="w-1.5 h-1.5 bg-tpq-green rounded-full" />
                                            Lunas
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => window.location.href = '/dashboard'}
                            className="w-full bg-tpq-green text-white rounded-xl font-semibold py-3 text-sm hover:bg-tpq-darkgreen transition-colors flex items-center justify-center gap-2 group"
                        >
                            Masuk Dashboard
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </button>
                    </div>
                ) : (
                    /* Pending State */
                    <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-tpq-yellow/15 flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-tpq-yellow">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Menunggu Pembayaran</h1>
                        <p className="text-gray-500 text-sm mb-8">
                            Jika Anda sudah melakukan pembayaran, klik tombol di bawah untuk mengecek status.
                        </p>

                        {payment && (
                            <div className="bg-white rounded-2xl shadow-lg shadow-gray-900/5 ring-1 ring-gray-200/80 p-6 mb-6 text-left">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4">Detail Transaksi</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Order ID</span>
                                        <span className="font-mono text-gray-700">{payment.order_id}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Paket</span>
                                        <span className="text-gray-700 capitalize">{payment.plan === 'monthly' ? 'Bulanan' : 'Tahunan'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Nominal</span>
                                        <span className="font-semibold text-gray-900">{formatRupiah(payment.amount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Status</span>
                                        <span className="inline-flex items-center gap-1.5 text-amber-600 font-medium">
                                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                            Menunggu Pembayaran
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Dibuat</span>
                                        <span className="text-gray-700">{formatDate(payment.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error message */}
                        {error && (
                            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            onClick={handleCheckStatus}
                            disabled={checking}
                            className="w-full bg-tpq-green text-white rounded-xl font-semibold py-3 text-sm hover:bg-tpq-darkgreen transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {checking ? (
                                <>
                                    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Mengecek...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="23 4 23 10 17 10" />
                                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                                    </svg>
                                    Cek Status Pembayaran
                                </>
                            )}
                        </button>

                        <p className="text-xs text-gray-400 mt-4">
                            Klik tombol di atas setelah Anda menyelesaikan pembayaran.
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
};

export default PaymentVerifyPage;
