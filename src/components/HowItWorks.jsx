import { Link } from 'react-router-dom';

const HowItWorks = () => {
    const steps = [
        {
            number: '01',
            title: 'Daftar Akun',
            desc: 'Buat akun gratis dengan email Anda. Proses pendaftaran hanya 30 detik.',
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
            ),
        },
        {
            number: '02',
            title: 'Tambah Data Santri',
            desc: 'Masukkan data santri, buat kelompok halaqah, dan atur sesuai kebutuhan TPQ Anda.',
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
            ),
        },
        {
            number: '03',
            title: 'Mulai Kelola!',
            desc: 'Catat absensi, input nilai ngaji, dan pantau perkembangan santri setiap hari dari dashboard.',
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
            ),
        },
    ];

    return (
        <section id="cara-kerja" className="py-24 md:py-32 bg-gray-50/80">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                <div className="text-center mb-20">
                    <div className="inline-flex items-center gap-2 text-tpq-green font-bold text-sm mb-4 uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-tpq-green" />
                        CARA KERJA
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-tpq-green mb-6 leading-tight">
                        Mulai dalam 3 Langkah
                    </h2>
                    <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed">
                        Tidak perlu keahlian teknis. Cukup daftar, tambah data, dan langsung gunakan.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
                    {/* Connection line */}
                    <div className="hidden md:block absolute top-24 left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-tpq-green/20 via-tpq-green/40 to-tpq-green/20" />

                    {steps.map((step, i) => (
                        <div key={i} className="relative text-center group">
                            {/* Circle with icon */}
                            <div className="relative mx-auto mb-8">
                                <div className="w-20 h-20 rounded-[20px] bg-tpq-green mx-auto flex items-center justify-center text-white shadow-xl shadow-tpq-green/20 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-tpq-green/30 transition-all duration-300">
                                    {step.icon}
                                </div>
                                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-lg bg-tpq-yellow text-tpq-green text-xs font-black flex items-center justify-center shadow-lg">
                                    {step.number}
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold text-gray-800 mb-4">{step.title}</h3>
                            <p className="text-gray-500 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-16">
                    <Link
                        to="/auth"
                        className="inline-flex items-center gap-2 bg-tpq-green hover:bg-[#13321b] text-white font-bold px-10 py-4 rounded-2xl transition-all shadow-lg hover:-translate-y-1 text-lg"
                    >
                        Daftar Sekarang
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
