const Hero = () => {
    return (
        <section className="bg-tpq-green text-white px-8 md:px-16 py-16 md:py-24 relative overflow-hidden">
            {/* Decorative large circle in background */}
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/4 w-[500px] h-[500px] md:w-[800px] md:h-[800px] bg-[#1e4e2a] rounded-full opacity-60 z-0"></div>

            <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
                <div>
                    <div className="inline-flex items-center gap-2 bg-tpq-light px-4 py-1.5 rounded-full text-xs font-medium mb-6 animate-fade-in">
                        <span className="w-2 h-2 rounded-full bg-tpq-yellow animate-pulse"></span>
                        Penerimaan Santri Baru 2025
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
                        Belajar Al-Quran <br />
                        <span className="text-green-300">dengan Hati & Ilmu</span>
                    </h1>

                    <div className="mb-6">
                        <p className="text-2xl text-tpq-yellow mb-1 font-serif" dir="rtl">اقْرَأْ بِاسْمِ رَبِّكَ</p>
                        <p className="text-sm italic text-gray-300">"Bacalah dengan (menyebut) nama Tuhanmu" — Q.S. Al-'Alaq: 1</p>
                    </div>

                    <p className="text-gray-200 mb-8 max-w-md text-sm md:text-base leading-relaxed">
                        Program pembelajaran Al-Quran terpadu untuk anak usia 5-15 tahun dengan metode modern dan pengajar berpengalaman bersertifikat.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <button className="bg-tpq-yellow hover:bg-tpq-darkyellow text-tpq-green font-bold px-8 py-3 rounded-full transition shadow-lg hover:-translate-y-1">
                            Daftar Sekarang
                        </button>
                        <button className="border border-white hover:bg-white hover:text-tpq-green font-bold px-8 py-3 rounded-full transition shadow-lg hover:-translate-y-1">
                            Pelajari Lebih
                        </button>
                    </div>
                </div>

                <div className="flex justify-center items-center relative">
                    <div className="w-72 h-72 md:w-96 md:h-96 relative z-10 flex items-center justify-center">
                        <div className="text-9xl filter drop-shadow-2xl">🕌</div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
