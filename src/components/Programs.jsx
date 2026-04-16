const Programs = () => {
    const programs = [
        {
            title: "Iqra & Tajwid",
            age: "Usia 5 - 7 Tahun",
            desc: "Pengenalan huruf hijaiyah, cara membaca, dan tajwid dasar untuk pemula.",
            icon: "📚"
        },
        {
            title: "Tilawah Quran",
            age: "Usia 8 - 11 Tahun",
            desc: "Membaca Al-Quran dengan tartil, tajwid lengkap, dan pemahaman makna ayat.",
            icon: "📖"
        },
        {
            title: "Tahfidz Quran",
            age: "Usia 12 - 15 Tahun",
            desc: "Hafalan juz 30 hingga seluruh Al-Quran dengan metode muraja'ah intensif.",
            icon: "⭐",
            popular: true
        },
        {
            title: "Kelas Dewasa",
            age: "Usia 16 Tahun+",
            desc: "Intensif untuk remaja dan dewasa yang ingin mulai mendalami Al-Quran.",
            icon: "🎓"
        }
    ];

    return (
        <section id="program" className="py-24 bg-tpq-green text-white">
            <div className="max-w-7xl mx-auto px-8">
                <div className="text-center mb-20">
                    <div className="flex items-center justify-center gap-2 text-tpq-yellow font-bold text-sm mb-4 uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-tpq-yellow"></span>
                        PROGRAM KAMI
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">Program Unggulan TPQ</h2>
                    <p className="text-gray-300 max-w-2xl mx-auto text-lg">
                        Dirancang bertahap untuk semua usia dengan pendekatan yang menyenangkan
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {programs.map((prog, i) => (
                        <div key={i} className={`bg-[#183d22] rounded-[32px] p-8 md:p-10 border-2 ${prog.popular ? 'border-tpq-yellow relative hover:-translate-y-2' : 'border-[#2e6b3c]/30 hover:-translate-y-2 hover:border-[#2e6b3c]'} transition-all duration-300 flex flex-col h-full shadow-xl`}>
                            {prog.popular && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-tpq-yellow text-tpq-green text-xs font-bold px-5 py-2 rounded-full shadow-lg whitespace-nowrap uppercase tracking-wider">
                                    ★ Paling Populer
                                </div>
                            )}
                            <div className="w-16 h-16 bg-[#2e6b3c]/50 rounded-2xl flex items-center justify-center text-3xl mb-8 border border-[#2e6b3c]">
                                {prog.icon}
                            </div>
                            <h3 className="text-2xl font-bold mb-4">{prog.title}</h3>
                            <div className="inline-block bg-tpq-yellow text-tpq-green text-xs font-bold px-3 py-1.5 rounded-md mb-6 self-start uppercase">
                                {prog.age}
                            </div>
                            <p className="text-base text-gray-300 mb-8 flex-grow leading-relaxed">
                                {prog.desc}
                            </p>
                            <a href="#daftar" className="text-tpq-yellow font-bold text-sm flex items-center gap-2 hover:gap-3 transition-all mt-auto group">
                                Lihat Detail <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Programs;
