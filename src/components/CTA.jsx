import { Link } from 'react-router-dom';

const CTA = () => {
    return (
        <section className="py-24 bg-gradient-to-br from-tpq-green to-[#0f2b18] text-white overflow-hidden relative">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-tpq-yellow/5 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3" />

            {/* Pattern */}
            <div className="absolute inset-0 opacity-[0.02]" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '32px 32px'
            }} />

            <div className="max-w-4xl mx-auto px-6 md:px-12 text-center relative z-10">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-semibold mb-8 border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-tpq-yellow animate-pulse" />
                    100% Gratis — Tidak Ada Biaya Tersembunyi
                </div>

                <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
                    Siap Mengelola TPQ <br className="hidden md:block" />
                    <span className="text-tpq-yellow">Secara Digital?</span>
                </h2>
                <p className="text-lg md:text-xl text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed">
                    Bergabung dengan ratusan ustadz lainnya yang sudah beralih ke TPQ Platform. Daftar sekarang dan rasakan kemudahannya.
                </p>

                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                    <Link
                        to="/auth"
                        className="bg-tpq-yellow hover:bg-tpq-darkyellow text-tpq-green font-bold px-10 py-4 rounded-2xl transition-all duration-300 hover:-translate-y-1 w-full sm:w-auto text-lg shadow-xl shadow-tpq-yellow/20 flex items-center justify-center gap-2"
                    >
                        Daftar Gratis Sekarang
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </Link>
                    <a
                        href="#fitur"
                        className="border-2 border-white/20 hover:border-white/40 hover:bg-white/5 text-white font-bold px-10 py-4 rounded-2xl transition-all duration-300 hover:-translate-y-1 w-full sm:w-auto text-lg backdrop-blur-sm text-center"
                    >
                        Pelajari Fitur
                    </a>
                </div>
            </div>
        </section>
    );
};

export default CTA;
