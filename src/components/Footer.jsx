const Footer = () => {
    return (
        <footer className="bg-[#0a1f10] text-gray-400 pt-20 pb-10 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-6 md:px-12 grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 mb-16">
                {/* Brand */}
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-11 h-11 bg-tpq-yellow rounded-xl flex items-center justify-center font-black text-tpq-green text-lg shadow-lg shadow-tpq-yellow/10">
                            T
                        </div>
                        <div>
                            <h1 className="font-bold text-lg text-white tracking-wide">Athir TPQ</h1>
                            <p className="text-xs text-gray-500 tracking-wider">Manajemen TPQ Digital</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed max-w-sm mb-6">
                        Platform manajemen TPQ terpadu untuk ustadz. Kelola data santri, absensi, nilai, dan kelompok halaqah dalam satu tempat.
                    </p>
                </div>

                {/* Navigasi */}
                <div>
                    <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm flex items-center gap-2">
                        <span className="w-1 h-3 bg-tpq-yellow rounded-full" />
                        Navigasi
                    </h4>
                    <ul className="space-y-3 text-sm">
                        {[
                            { label: 'Beranda', href: '#' },
                            { label: 'Fitur', href: '#fitur' },
                            { label: 'Cara Kerja', href: '#cara-kerja' },
                            { label: 'Testimoni', href: '#testimoni' },
                        ].map((link, i) => (
                            <li key={i}>
                                <a href={link.href} className="hover:text-tpq-yellow transition-colors text-gray-500 hover:translate-x-1 inline-block transform">
                                    {link.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Fitur */}
                <div>
                    <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm flex items-center gap-2">
                        <span className="w-1 h-3 bg-tpq-yellow rounded-full" />
                        Fitur
                    </h4>
                    <ul className="space-y-3 text-sm">
                        {['Data Santri', 'Absensi Harian', 'Penilaian Ngaji', 'Kelompok Halaqah', 'Laporan Santri'].map((link, i) => (
                            <li key={i}>
                                <a href="#fitur" className="hover:text-tpq-yellow transition-colors text-gray-500 hover:translate-x-1 inline-block transform">
                                    {link}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Kontak */}
                <div>
                    <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm flex items-center gap-2">
                        <span className="w-1 h-3 bg-tpq-yellow rounded-full" />
                        Kontak
                    </h4>
                    <ul className="space-y-4 text-sm">
                        <li className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 group hover:bg-white/[0.06] transition-colors">
                            <span className="text-tpq-yellow text-lg mt-0.5">📧</span>
                            <div>
                                <p className="text-[10px] text-gray-600 mb-1 font-medium uppercase tracking-wider">Email</p>
                                <a href="mailto:info@tpqplatform.id" className="hover:text-white transition-colors text-gray-400 text-sm">info@tpqplatform.id</a>
                            </div>
                        </li>
                        <li className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 group hover:bg-white/[0.06] transition-colors">
                            <span className="text-tpq-yellow text-lg mt-0.5">📞</span>
                            <div>
                                <p className="text-[10px] text-gray-600 mb-1 font-medium uppercase tracking-wider">WhatsApp</p>
                                <a href="#" className="hover:text-white transition-colors text-gray-400 text-sm">+62 812-3456-7890</a>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8 border-t border-white/5 text-center text-sm text-gray-600">
                <p>&copy; 2026 Athir TPQ. Hak Cipta Dilindungi.</p>
            </div>
        </footer>
    );
};

export default Footer;
