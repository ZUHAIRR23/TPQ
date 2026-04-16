const Teachers = () => {
    const teachers = [
        { name: "Ust. Ahmad Fauzi", role: "Kepala TPQ, Hafidz 30 Juz", exp: "15 Tahun Pengalaman", icon: "👨‍🏫" },
        { name: "Ust. Sari Dewi", role: "Pengajar Iqra & Tilawah, Spesialis Pemula", exp: "10 Tahun Pengalaman", icon: "👩‍🏫" },
        { name: "Ust. Haris Malik", role: "Pengajar Tahfidz Senior, Hafidz Bersanad", exp: "12 Tahun Pengalaman", icon: "👨‍🎓" },
        { name: "Ust. Nur Fitri", role: "Pengajar Kelas Dewasa, Metode Fun Learning", exp: "7 Tahun Pengalaman", icon: "👩‍🎓" },
    ];

    return (
        <section id="pengajar" className="py-24 bg-gray-50/50">
            <div className="max-w-7xl mx-auto px-8">
                <div className="text-center mb-20">
                    <div className="flex items-center justify-center gap-2 text-tpq-light font-bold text-sm mb-4 uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-tpq-light"></span>
                        PENGAJAR KAMI
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-tpq-green mb-6">Tim Pengajar Berpengalaman</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                        Semua bersertifikat tahfidz dengan pengalaman mengajar lebih dari 5 tahun
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {teachers.map((teacher, i) => (
                        <div key={i} className="bg-white rounded-[32px] p-8 md:p-10 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100 flex flex-col items-center text-center">
                            <div className="w-28 h-28 bg-green-50 rounded-full flex items-center justify-center text-5xl mb-8 shadow-inner ring-[6px] ring-white relative overflow-hidden">
                                <div className="absolute inset-0 bg-tpq-green opacity-5"></div>
                                {teacher.icon}
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">{teacher.name}</h3>
                            <p className="text-sm text-gray-500 mb-8 flex-grow">{teacher.role}</p>
                            <div className="bg-green-50 text-tpq-green text-xs font-bold px-4 py-2.5 rounded-full w-full mb-6 flex items-center justify-center gap-2 border border-green-100/50">
                                <span className="text-tpq-yellow text-base">🏆</span> {teacher.exp}
                            </div>
                            <a href="#profil" className="text-tpq-green font-bold text-sm flex items-center justify-center gap-2 hover:text-[#13321b] hover:gap-3 transition-all mt-auto group">
                                Lihat Profil <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Teachers;
