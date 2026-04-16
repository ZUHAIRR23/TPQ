const Testimonials = () => {
    const reviews = [
        {
            text: "Sejak pakai TPQ Platform, saya tidak perlu lagi mencatat absensi di buku. Semuanya rapi, tinggal klik. Sangat membantu apalagi saat harus laporan ke pimpinan TPQ.",
            name: "Ust. Ahmad Fauzi",
            role: "Pengajar TPQ Nurul Iman, Bandung",
            initial: "AF",
        },
        {
            text: "Dulu penilaian santri sering tercecer. Sekarang semua tercatat otomatis, dan saya bisa lihat progress tiap santri kapan saja dari HP. Alhamdulillah sangat terbantu.",
            name: "Ust. Sari Dewi",
            role: "Pengajar TPQ Ar-Rahman, Jakarta",
            initial: "SD",
        },
        {
            text: "Fitur kelompok halaqah-nya luar biasa. Saya bisa atur santri per level dan catat nilai per kelompok. Platform ini benar-benar paham kebutuhan ustadz.",
            name: "Ust. Haris Malik",
            role: "Koordinator TPQ Al-Ikhlas, Surabaya",
            initial: "HM",
        },
    ];

    return (
        <section id="testimoni" className="py-24 bg-tpq-green text-white">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                <div className="text-center mb-20">
                    <div className="inline-flex items-center gap-2 text-tpq-yellow font-bold text-sm mb-4 uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-tpq-yellow" />
                        TESTIMONI
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">Dipercaya Ustadz di Seluruh Indonesia</h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                        Dengarkan pengalaman langsung dari para ustadz yang sudah menggunakan TPQ Platform
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {reviews.map((rev, i) => (
                        <div
                            key={i}
                            className="bg-white/[0.06] backdrop-blur-sm rounded-[24px] p-8 border border-white/10 hover:-translate-y-2 hover:bg-white/[0.1] hover:shadow-2xl transition-all duration-300 flex flex-col h-full relative"
                        >
                            {/* Quote mark */}
                            <div className="text-tpq-yellow/30 text-7xl font-serif absolute -top-1 left-6 leading-none select-none">"</div>

                            {/* Stars */}
                            <div className="flex gap-1 mb-5 mt-4 relative z-10">
                                {[...Array(5)].map((_, idx) => (
                                    <svg key={idx} className="w-4 h-4 text-tpq-yellow" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>

                            <p className="text-white/70 mb-8 flex-grow leading-relaxed relative z-10">
                                "{rev.text}"
                            </p>

                            <div className="flex items-center gap-4 mt-auto border-t border-white/10 pt-6">
                                <div className="w-12 h-12 rounded-xl bg-tpq-yellow/15 flex items-center justify-center font-bold text-lg shrink-0 text-tpq-yellow border border-tpq-yellow/20">
                                    {rev.initial}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">{rev.name}</h4>
                                    <p className="text-xs text-white/40 mt-0.5">{rev.role}</p>
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
