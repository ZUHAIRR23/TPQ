const Testimonials = () => {
    const reviews = [
        {
            text: "Alhamdulillah, anak saya sudah hafal Juz 30 dalam 8 bulan. Pengajarnya sangat sabar dan metodenya efektif. Sangat direkomendasikan untuk orang tua yang ingin anaknya hafal Al-Quran dengan baik.",
            name: "Bapak Rahmat",
            role: "Orang Tua Santri - Kelas Tahfidz",
            initial: "R"
        },
        {
            text: "TPQ Nurul Iman luar biasa! Dari tidak bisa sama sekali, kini anak saya sudah lancar membaca Al-Quran. Recommended! Lingkungannya juga sangat mendukung untuk anak-anak kita.",
            name: "Ibu Siti Aminah",
            role: "Orang Tua Santri - Kelas Iqra",
            initial: "S"
        },
        {
            text: "Fasilitas lengkap, pengajar profesional, lingkungan islami yang kondusif. Sangat cocok untuk anak-anak kita semua. Saya sangat puas dengan perkembangan anak saya di sini.",
            name: "Bapak Dodi K.",
            role: "Orang Tua Santri - Kelas Tilawah",
            initial: "D"
        }
    ];

    return (
        <section id="testimoni" className="py-24 bg-[#1a4325] text-white">
            <div className="max-w-7xl mx-auto px-8">
                <div className="text-center mb-20">
                    <div className="flex items-center justify-center gap-2 text-tpq-yellow font-bold text-sm mb-4 uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-tpq-yellow"></span>
                        TESTIMONI
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">Apa Kata Orang Tua Santri?</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {reviews.map((rev, i) => (
                        <div key={i} className="bg-[#183d22] rounded-[32px] p-8 md:p-10 border border-[#2e6b3c]/30 hover:-translate-y-2 hover:border-[#2e6b3c] hover:shadow-2xl transition-all duration-300 flex flex-col h-full relative">
                            <div className="text-tpq-yellow text-6xl font-serif absolute -top-2 left-6 leading-none">"</div>

                            <div className="flex gap-1 mb-6 mt-4">
                                {[...Array(5)].map((_, idx) => (
                                    <span key={idx} className="text-tpq-yellow text-xl">★</span>
                                ))}
                            </div>

                            <p className="text-gray-300 mb-10 flex-grow text-lg leading-relaxed italic z-10 relative">
                                "{rev.text}"
                            </p>

                            <div className="flex items-center gap-4 mt-auto border-t border-[#2e6b3c]/30 pt-6">
                                <div className="w-14 h-14 rounded-2xl bg-[#2e6b3c]/50 flex items-center justify-center font-bold text-2xl shrink-0 text-white shadow-inner uppercase border border-[#2e6b3c]">
                                    {rev.initial}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-lg">{rev.name}</h4>
                                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{rev.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
