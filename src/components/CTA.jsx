const CTA = () => {
    return (
        <section className="py-24 bg-gradient-to-br from-[#1a4325] to-[#2e6b3c] text-white overflow-hidden relative">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-tpq-yellow/10 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>

            <div className="max-w-4xl mx-auto px-8 text-center relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Siap Memulai Perjalanan Qurani?</h2>
                <p className="text-lg md:text-xl text-green-50 mb-12 max-w-2xl mx-auto leading-relaxed">
                    Daftarkan putra-putri Anda sekarang dan rasakan perbedaannya. Pendaftaran terbuka untuk tahun ajaran baru 2025/2026.
                </p>

                <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-6">
                    <button className="border-2 border-yellow-300/50 hover:bg-yellow-300 hover:border-yellow-300 text-white font-bold px-10 py-4 rounded-full transition-all duration-300 hover:-translate-y-1 w-full md:w-auto text-lg backdrop-blur-sm">
                        Daftar Sekarang
                    </button>
                    <button className="border-2 border-green-300/50 hover:bg-white/10 hover:border-green-300 text-white font-bold px-10 py-4 rounded-full transition-all duration-300 hover:-translate-y-1 w-full md:w-auto text-lg backdrop-blur-sm">
                        Hubungi Kami
                    </button>
                    <a href="tel:0211234567" className="flex items-center justify-center md:justify-start gap-3 text-green-100 hover:text-white font-bold text-lg px-6 py-4 transition-colors w-full md:w-auto group">
                        <span className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors border border-white/20">📞</span>
                        (021) 123-4567
                    </a>
                </div>
            </div>
        </section>
    );
};

export default CTA;
