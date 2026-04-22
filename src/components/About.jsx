const About = () => {
    const benefits = [
        {
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            title: 'Gratis Selamanya',
            desc: 'Tidak ada biaya tersembunyi. Semua fitur bisa diakses tanpa batas.',
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
            ),
            title: 'Akses Dari Mana Saja',
            desc: 'Buka dari HP, tablet, atau laptop. Selalu terkoneksi dengan data Anda.',
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
            ),
            title: 'Data Aman & Terenkripsi',
            desc: 'Data santri disimpan dengan standar keamanan tinggi di cloud.',
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
            ),
            title: 'Mudah Digunakan',
            desc: 'Interface dirancang simpel agar ustadz bisa langsung menggunakan tanpa pelatihan.',
        },
    ];

    return (
        <section id="tentang" className="py-24 md:py-32 bg-white">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                <div className="text-center mb-20">
                    <div className="inline-flex items-center gap-2 text-tpq-green font-bold text-sm mb-4 uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-tpq-green" />
                        KENAPA ATHIR TPQ?
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-tpq-green mb-6 leading-tight">
                        Dibuat Khusus untuk <br className="hidden md:block" /> Kebutuhan Ustadz
                    </h2>
                    <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed">
                        Kami memahami tantangan mengelola TPQ secara manual. Platform ini hadir untuk menyederhanakan pekerjaan Anda setiap hari.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {benefits.map((item, i) => (
                        <div
                            key={i}
                            className="group bg-gray-50/80 hover:bg-tpq-green rounded-[28px] p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border border-gray-100 hover:border-tpq-green"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-tpq-green/10 group-hover:bg-white/15 flex items-center justify-center text-tpq-green group-hover:text-white mb-6 transition-colors">
                                {item.icon}
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 group-hover:text-white mb-3 transition-colors">
                                {item.title}
                            </h3>
                            <p className="text-gray-500 group-hover:text-white/70 leading-relaxed transition-colors">
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default About;
