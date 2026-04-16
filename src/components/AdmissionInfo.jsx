const AdmissionInfo = () => {
    return (
        <section id="info" className="py-24 bg-gray-50/50">
            <div className="max-w-7xl mx-auto px-8">
                <div className="text-center mb-20">
                    <div className="flex items-center justify-center gap-2 text-tpq-light font-bold text-sm mb-4 uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-tpq-light"></span>
                        INFO PENDAFTARAN
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-tpq-green mb-6">Informasi Pendaftaran</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
                        Daftarkan putra-putri Anda segera. Kuota terbatas untuk menjaga kualitas pembelajaran.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Jadwal Kegiatan */}
                    <div className="rounded-[40px] overflow-hidden border border-gray-100 shadow-xl hover:shadow-2xl transition-shadow bg-white flex flex-col">
                        <div className="bg-[#1a4325] text-white py-8 text-center font-bold text-2xl uppercase tracking-wider relative overflow-hidden">
                            <div className="absolute inset-0 bg-black/10"></div>
                            <span className="relative z-10">Jadwal Kegiatan</span>
                        </div>
                        <div className="p-10 space-y-8 flex-grow">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-gray-100 pb-6 group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-xl shadow-inner border border-green-100 text-tpq-green group-hover:scale-110 transition-transform">📅</div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-tpq-green transition-colors">Hari Aktif</h4>
                                        <p className="text-gray-500 text-base">Senin - Jumat (Libur Sabtu & Ahad)</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-gray-100 pb-6 group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-xl shadow-inner border border-green-100 text-tpq-green group-hover:scale-110 transition-transform">🌅</div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-tpq-green transition-colors">Sesi Pagi</h4>
                                        <p className="text-gray-500 text-base">07.30 - 09.30 WIB</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row md:justify-between md:items-center group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-xl shadow-inner border border-green-100 text-tpq-green group-hover:scale-110 transition-transform">🌇</div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-tpq-green transition-colors">Sesi Sore</h4>
                                        <p className="text-gray-500 text-base">15.30 - 17.30 WIB</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Biaya Pendidikan */}
                    <div className="rounded-[40px] overflow-hidden border border-gray-100 shadow-xl hover:shadow-2xl transition-shadow bg-white flex flex-col">
                        <div className="bg-[#2e6b3c] text-white py-8 text-center font-bold text-2xl uppercase tracking-wider relative overflow-hidden">
                            <div className="absolute inset-0 bg-black/10"></div>
                            <span className="relative z-10">Biaya Pendidikan</span>
                        </div>
                        <div className="p-10 space-y-8 flex-grow">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-gray-100 pb-6 group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-yellow-50 flex items-center justify-center text-xl shadow-inner border border-yellow-100 text-tpq-darkyellow group-hover:scale-110 transition-transform">📝</div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-tpq-green transition-colors">Biaya Pendaftaran</h4>
                                        <p className="text-gray-500 text-base">Rp 150.000 <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full ml-1">sekali bayar</span></p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-gray-100 pb-6 group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-yellow-50 flex items-center justify-center text-xl shadow-inner border border-yellow-100 text-tpq-darkyellow group-hover:scale-110 transition-transform">💰</div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-tpq-green transition-colors">SPP Bulanan</h4>
                                        <p className="text-gray-500 text-base">Rp 100.000 <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full ml-1">/ bln</span></p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row md:justify-between md:items-center group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-yellow-50 flex items-center justify-center text-xl shadow-inner border border-yellow-100 text-tpq-darkyellow group-hover:scale-110 transition-transform">💎</div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-tpq-green transition-colors">Kelas Tahfidz</h4>
                                        <p className="text-gray-500 text-base">Rp 150.000 <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full ml-1">/ bln</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AdmissionInfo;
