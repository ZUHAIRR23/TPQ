const About = () => {
    return (
        <section id="tentang" className="py-20 md:py-32 bg-white">
            <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-2 gap-16 md:gap-24 items-center">
                {/* Left Side: Image / Illustration */}
                <div className="relative order-2 md:order-1 mt-12 md:mt-0">
                    <div className="bg-green-50 rounded-[40px] aspect-[4/3] flex items-center justify-center border-[12px] border-white shadow-sm overflow-hidden relative">
                        <div className="grid grid-cols-4 grid-rows-3 gap-3 opacity-20 w-3/5 h-3/5">
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className="bg-tpq-green rounded-lg"></div>
                            ))}
                        </div>
                        <p className="absolute text-tpq-green font-semibold opacity-70">Suasana Belajar Al-Quran</p>
                    </div>
                    <div className="absolute -bottom-8 -left-2 md:-left-8 bg-tpq-green text-white p-6 md:p-8 rounded-3xl shadow-2xl border-[6px] border-white">
                        <h4 className="text-3xl md:text-5xl text-tpq-yellow font-bold mb-1">500+</h4>
                        <p className="text-xs md:text-sm font-medium tracking-wide">Santri Telah Khatam</p>
                    </div>
                </div>

                {/* Right Side: Content */}
                <div className="order-1 md:order-2">
                    <div className="flex items-center gap-2 text-tpq-green font-bold text-sm mb-6 uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-tpq-green"></span>
                        TENTANG KAMI
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-tpq-green mb-8 leading-tight">
                        Membentuk Generasi <br className="hidden md:block" /> Qurani Berakhlak Mulia
                    </h2>
                    <p className="text-gray-600 mb-10 text-lg leading-relaxed">
                        TPQ Nurul Iman hadir sebagai lembaga pendidikan Al-Quran yang berkomitmen mencetak generasi hafidz dengan akhlak mulia dan metode pembelajaran modern yang menyenangkan.
                    </p>

                    <ul className="space-y-5 mb-10">
                        {[
                            "Kurikulum berbasis Kemenag RI",
                            "Pengajar bersertifikat tahfidz",
                            "Kelas kecil, maksimal 15 santri",
                            "Laporan perkembangan bulanan"
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-4 text-gray-700 font-medium text-lg">
                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-tpq-green shrink-0 shadow-sm">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                {item}
                            </li>
                        ))}
                    </ul>

                    <button className="bg-tpq-green hover:bg-[#13321b] text-white px-8 py-4 rounded-full font-bold transition shadow-lg flex items-center gap-3 hover:-translate-y-1">
                        Selengkapnya <span className="text-xl">→</span>
                    </button>
                </div>
            </div>
        </section>
    );
};

export default About;
