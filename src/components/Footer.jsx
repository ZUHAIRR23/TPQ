const Footer = () => {
    return (
        <footer className="bg-[#102a18] text-gray-300 pt-20 pb-10 border-t border-green-900/50">
            <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 mb-16">
                <div>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-[#2e6b3c] rounded-full flex items-center justify-center font-bold text-xl text-white shadow-sm ring-4 ring-[#1a4325]">
                            T
                        </div>
                        <div>
                            <h1 className="font-bold text-xl text-white tracking-wide">TPQ Nurul Iman</h1>
                            <p className="text-xs text-gray-400 tracking-wider">Taman Pendidikan Al-Quran</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed max-w-sm mb-6">
                        Membentuk generasi Qurani yang berakhlak mulia dan mencintai Al-Quran sejak tahun 2008.
                    </p>
                    <div className="flex gap-3">
                        <a href="#" className="w-10 h-10 rounded-full bg-[#1a4325] flex items-center justify-center hover:bg-tpq-yellow hover:text-tpq-green transition-all duration-300 border border-green-800/50 hover:-translate-y-1">in</a>
                        <a href="#" className="w-10 h-10 rounded-full bg-[#1a4325] flex items-center justify-center hover:bg-tpq-yellow hover:text-tpq-green transition-all duration-300 border border-green-800/50 hover:-translate-y-1">fb</a>
                        <a href="#" className="w-10 h-10 rounded-full bg-[#1a4325] flex items-center justify-center hover:bg-tpq-yellow hover:text-tpq-green transition-all duration-300 border border-green-800/50 hover:-translate-y-1">ig</a>
                    </div>
                </div>

                <div>
                    <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm flex items-center gap-2">
                        <span className="w-1 h-3 bg-tpq-yellow rounded-full"></span>
                        Navigasi
                    </h4>
                    <ul className="space-y-4 text-sm text-gray-400">
                        {["Beranda", "Tentang Kami", "Program", "Pengajar", "Syarat & Ketentuan"].map((link, i) => (
                            <li key={i}><a href="#" className="hover:text-tpq-yellow transition-colors flex items-center gap-2 group"><span className="opacity-0 group-hover:opacity-100 transition-all text-tpq-yellow transform -translate-x-2 group-hover:translate-x-0">▶</span> {link}</a></li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm flex items-center gap-2">
                        <span className="w-1 h-3 bg-tpq-yellow rounded-full"></span>
                        Program
                    </h4>
                    <ul className="space-y-4 text-sm text-gray-400">
                        {["Iqra & Tajwid", "Tilawah Al-Quran", "Tahfidz Al-Quran", "Kelas Dewasa"].map((link, i) => (
                            <li key={i}><a href="#" className="hover:text-tpq-yellow transition-colors flex items-center gap-2 group"><span className="opacity-0 group-hover:opacity-100 transition-all text-tpq-yellow transform -translate-x-2 group-hover:translate-x-0">▶</span> {link}</a></li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm flex items-center gap-2">
                        <span className="w-1 h-3 bg-tpq-yellow rounded-full"></span>
                        Kontak Kami
                    </h4>
                    <ul className="space-y-4 text-sm text-gray-400">
                        <li className="flex items-start gap-4 p-4 rounded-2xl bg-[#15341e]/50 hover:bg-[#15341e] border border-green-900/30 transition-colors group">
                            <span className="text-tpq-yellow text-xl group-hover:scale-110 transition-transform">📞</span>
                            <div>
                                <p className="text-xs text-green-500 mb-1 font-medium uppercase tracking-wider">Telepon</p>
                                <a href="#" className="hover:text-white transition-colors font-medium text-base">(021) 123-4567</a>
                            </div>
                        </li>
                        <li className="flex items-start gap-4 p-4 rounded-2xl bg-[#15341e]/50 hover:bg-[#15341e] border border-green-900/30 transition-colors group">
                            <span className="text-tpq-yellow text-xl group-hover:scale-110 transition-transform">📧</span>
                            <div>
                                <p className="text-xs text-green-500 mb-1 font-medium uppercase tracking-wider">Email</p>
                                <a href="#" className="hover:text-white transition-colors text-base break-all">info@tpqnuruliman.com</a>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-8 pt-8 border-t border-green-900/50 text-center text-sm text-gray-500">
                <p>&copy; 2026 TPQ Nurul Iman. Hak Cipta Dilindungi.</p>
            </div>
        </footer>
    );
};

export default Footer;
