import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { generateOrderId, getPlanAmount, getPakasirPaymentUrl, PAKASIR_SLUG } from '../lib/pakasir';

const plans = [
    {
        id: 'monthly',
        name: 'Bulanan',
        price: 'Rp 5.000',
        period: '/bulan',
        description: 'Untuk TPQ yang aktif dan berkembang',
        features: [
            'Santri tidak terbatas',
            'Pencatatan absensi lengkap',
            'Histori nilai & progres',
            'Kelompok belajar',
            'Laporan mingguan',
            'Dukungan prioritas',
        ],
        cta: 'Langganan Sekarang',
        popular: true,
    },
    {
        id: 'yearly',
        name: 'Tahunan',
        price: 'Rp 299.000',
        period: '/tahun',
        description: 'Hemat 32% — cocok untuk jangka panjang',
        features: [
            'Semua fitur Bulanan',
            'Diskon 32% dari harga bulanan',
            'Fitur ekspor data',
            'Analitik lanjutan',
            'Akses fitur baru lebih awal',
            'Dukungan premium 24/7',
        ],
        cta: 'Hemat Sekarang',
        popular: false,
    },
];

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-tpq-green shrink-0 mt-0.5">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const SubscriptionPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(null);
    const [error, setError] = useState('');

    const handleSelectPlan = async (planId) => {
        setLoading(planId);
        setError('');

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('Sesi tidak ditemukan. Silakan login kembali.');
            }

            if (!PAKASIR_SLUG) {
                throw new Error('Konfigurasi pembayaran belum lengkap. Hubungi admin.');
            }

            // Generate order ID unik dan hitung nominal
            const orderId = generateOrderId();
            const amount = getPlanAmount(planId);

            if (!amount) {
                throw new Error('Paket tidak valid.');
            }

            // Simpan record pembayaran di Supabase (status: pending)
            const { error: insertError } = await supabase
                .from('payments')
                .insert({
                    user_id: user.id,
                    order_id: orderId,
                    plan: planId,
                    amount: amount,
                    status: 'pending',
                });

            if (insertError) {
                throw new Error('Gagal membuat transaksi. Silakan coba lagi.');
            }

            // Generate URL pembayaran Pakasir & redirect
            const redirectUrl = `${window.location.origin}/payment/verify?order_id=${orderId}`;
            const paymentUrl = getPakasirPaymentUrl({
                slug: PAKASIR_SLUG,
                amount,
                orderId,
                redirectUrl,
            });

            window.location.href = paymentUrl;
        } catch (err) {
            setError(err.message || 'Gagal memilih paket. Silakan coba lagi.');
            setLoading(null);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/auth', { replace: true });
    };

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
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 transition-colors group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-0.5">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Keluar
                </button>
            </header>

            {/* Content */}
            <div className="relative z-10 max-w-5xl mx-auto px-6 pt-4 pb-16">
                {/* Heading */}
                <div className="text-center mb-10 md:mb-14">
                    <div className="inline-flex items-center gap-1.5 bg-tpq-green/10 text-tpq-green text-xs font-semibold px-3 py-1 rounded-full mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        Pilih Paket
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
                        Mulai Kelola TPQ Anda
                    </h1>
                    <p className="mt-3 text-gray-500 text-sm md:text-base max-w-md mx-auto">
                        Pilih paket yang sesuai untuk kebutuhan TPQ Anda. Upgrade kapan saja.
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="max-w-md mx-auto mb-6 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6 items-start max-w-3xl mx-auto">
                    {plans.map((plan) => {
                        const isPopular = plan.popular;
                        const isYearly = plan.id === 'yearly';

                        return (
                            <div
                                key={plan.id}
                                className={`relative rounded-2xl transition-all duration-300 hover:-translate-y-1 ${isPopular
                                    ? 'bg-tpq-green text-white shadow-2xl shadow-tpq-green/25 ring-1 ring-tpq-green md:-mt-4 md:mb-[-16px]'
                                    : 'bg-white shadow-lg shadow-gray-900/5 ring-1 ring-gray-200/80 hover:shadow-xl hover:ring-tpq-green/30'
                                    }`}
                            >
                                {/* Popular badge */}
                                {isPopular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                                        <span className="bg-tpq-yellow text-gray-900 text-xs font-bold px-4 py-1 rounded-full shadow-md whitespace-nowrap">
                                            ⭐ Paling Populer
                                        </span>
                                    </div>
                                )}

                                <div className="p-6 lg:p-8">
                                    {/* Plan header */}
                                    <div className="mb-5">
                                        <h3 className={`text-lg font-bold ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                                            {plan.name}
                                        </h3>
                                        <p className={`text-xs mt-0.5 ${isPopular ? 'text-white/60' : 'text-gray-400'}`}>
                                            {plan.description}
                                        </p>
                                    </div>

                                    {/* Price */}
                                    <div className="mb-6 pb-6 border-b" style={{ borderColor: isPopular ? 'rgba(255,255,255,0.15)' : '#e5e7eb' }}>
                                        <span className={`text-3xl font-extrabold tracking-tight ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                                            {plan.price}
                                        </span>
                                        <span className={`text-sm ml-1 ${isPopular ? 'text-white/50' : 'text-gray-400'}`}>
                                            {plan.period}
                                        </span>
                                    </div>

                                    {/* Features */}
                                    <ul className="space-y-3 mb-8">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-2.5">
                                                {isPopular ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-tpq-yellow shrink-0 mt-0.5">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                ) : (
                                                    <CheckIcon />
                                                )}
                                                <span className={`text-sm leading-snug ${isPopular ? 'text-white/80' : 'text-gray-600'}`}>
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA Button */}
                                    <button
                                        onClick={() => handleSelectPlan(plan.id)}
                                        disabled={loading !== null}
                                        className={`w-full rounded-xl font-semibold py-3 text-sm transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed ${isPopular
                                            ? 'bg-white text-tpq-green hover:bg-tpq-yellow hover:text-gray-900 shadow-lg'
                                            : isYearly
                                                ? 'bg-tpq-yellow text-gray-900 hover:bg-tpq-darkyellow shadow-md shadow-tpq-yellow/20'
                                                : 'bg-gray-100 text-gray-700 hover:bg-tpq-green hover:text-white'
                                            }`}
                                    >
                                        {loading === plan.id ? (
                                            <>
                                                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Memproses...
                                            </>
                                        ) : (
                                            <>
                                                {plan.cta}
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5">
                                                    <line x1="5" y1="12" x2="19" y2="12" />
                                                    <polyline points="12 5 19 12 12 19" />
                                                </svg>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-400 mt-10">
                    Semua paket dapat diubah atau dibatalkan kapan saja.
                </p>
            </div>
        </main>
    );
};

export default SubscriptionPage;
