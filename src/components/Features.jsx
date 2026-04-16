const Features = () => {
    const features = [
        {
            icon: (
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
            ),
            title: 'Data Santri',
            desc: 'Kelola data lengkap santri: nama, wali, kontak, alamat, dan status. Tambah, edit, dan cari dengan mudah.',
            color: 'from-blue-500/20 to-blue-600/5',
            iconBg: 'bg-blue-500/15 text-blue-400',
            border: 'border-blue-500/20',
        },
        {
            icon: (
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 019 9v.375M10.125 2.25A3.375 3.375 0 0113.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 013.375 3.375M9 15l2.25 2.25L15 12" />
                </svg>
            ),
            title: 'Absensi Harian',
            desc: 'Catat kehadiran santri secara cepat per kelompok. Status hadir/alpa otomatis terekam setiap hari.',
            color: 'from-emerald-500/20 to-emerald-600/5',
            iconBg: 'bg-emerald-500/15 text-emerald-400',
            border: 'border-emerald-500/20',
        },
        {
            icon: (
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.164.484l1.241 5.385c.11.484-.42.871-.853.645L12 17.514a.563.563 0 00-.51 0l-4.836 2.988c-.433.226-.963-.16-.853-.645l1.24-5.385a.562.562 0 00-.164-.484L2.673 10.386c-.38-.325-.178-.948.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
            ),
            title: 'Penilaian Ngaji',
            desc: 'Input dan lacak nilai ngaji santri. Penilaian Lancar, Kurang Lancar, atau Tidak Lancar beserta catatan materi.',
            color: 'from-amber-500/20 to-amber-600/5',
            iconBg: 'bg-amber-500/15 text-amber-400',
            border: 'border-amber-500/20',
        },
        {
            icon: (
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
            ),
            title: 'Kelompok / Halaqah',
            desc: 'Buat dan atur kelompok belajar. Pindahkan santri antar kelompok dengan drag-and-drop.',
            color: 'from-violet-500/20 to-violet-600/5',
            iconBg: 'bg-violet-500/15 text-violet-400',
            border: 'border-violet-500/20',
        },
        {
            icon: (
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
            ),
            title: 'Nilai Per Kelompok',
            desc: 'Lihat ringkasan penilaian berdasarkan kelompok. Pantau perkembangan setiap halaqah secara terstruktur.',
            color: 'from-rose-500/20 to-rose-600/5',
            iconBg: 'bg-rose-500/15 text-rose-400',
            border: 'border-rose-500/20',
        },
        {
            icon: (
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
            ),
            title: 'Laporan & Detail Santri',
            desc: 'Lihat riwayat lengkap per santri: semua penilaian, kehadiran, dan catatan dalam satu halaman.',
            color: 'from-teal-500/20 to-teal-600/5',
            iconBg: 'bg-teal-500/15 text-teal-400',
            border: 'border-teal-500/20',
        },
    ];

    return (
        <section id="fitur" className="py-24 bg-[#0f2b18] text-white">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                <div className="text-center mb-20">
                    <div className="inline-flex items-center gap-2 text-tpq-yellow font-bold text-sm mb-4 uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-tpq-yellow" />
                        FITUR PLATFORM
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">Semua yang Anda Butuhkan</h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
                        Enam fitur utama yang dirancang untuk mempermudah tugas harian ustadz dalam mengelola TPQ
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feat, i) => (
                        <div
                            key={i}
                            className={`group relative bg-gradient-to-br ${feat.color} rounded-[24px] p-8 border ${feat.border} hover:-translate-y-2 hover:shadow-2xl transition-all duration-300`}
                        >
                            <div className={`w-14 h-14 rounded-2xl ${feat.iconBg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                {feat.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
                            <p className="text-gray-400 leading-relaxed text-[15px]">{feat.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
