import { Link } from 'react-router-dom';

const Hero = () => {
    return (
        <section className="relative bg-tpq-green text-white overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-tpq-light/30 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-tpq-yellow/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '40px 40px'
            }} />

            <div className="max-w-7xl mx-auto px-6 md:px-12 py-20 md:py-32 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left: Copy */}
                    <div>
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-semibold mb-8 border border-white/10">
                            <span className="w-2 h-2 rounded-full bg-tpq-yellow animate-pulse" />
                            Platform Manajemen TPQ #1 di Indonesia
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6 tracking-tight">
                            Kelola TPQ Anda
                            <br />
                            <span className="text-tpq-yellow">dengan Mudah</span>
                            <br />
                            & Modern
                        </h1>

                        <div className="mb-6">
                            <p className="text-xl text-tpq-yellow/90 font-serif" dir="rtl">اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ</p>
                            <p className="text-sm italic text-white/40 mt-1">"Bacalah dengan (menyebut) nama Tuhanmu" — Q.S. Al-'Alaq: 1</p>
                        </div>

                        <p className="text-white/60 text-base md:text-lg mb-10 max-w-lg leading-relaxed">
                            Data santri, absensi harian, penilaian ngaji, dan kelompok halaqah — semua dalam satu platform yang dirancang khusus untuk ustadz.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <Link
                                to="/auth"
                                className="bg-tpq-yellow hover:bg-tpq-darkyellow text-tpq-green font-bold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-tpq-yellow/20 hover:-translate-y-1 text-base flex items-center gap-2"
                            >
                                Mulai Sekarang — Gratis
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </Link>
                            <a
                                href="#fitur"
                                className="border-2 border-white/20 hover:border-white/40 hover:bg-white/5 text-white font-bold px-8 py-4 rounded-2xl transition-all hover:-translate-y-1 text-base backdrop-blur-sm"
                            >
                                Lihat Fitur
                            </a>
                        </div>
                    </div>

                    {/* Right: Dashboard Preview Mockup */}
                    <div className="hidden lg:block">
                        <div className="relative">
                            {/* Glow behind */}
                            <div className="absolute -inset-4 bg-tpq-yellow/10 rounded-[32px] blur-2xl" />

                            {/* Main card */}
                            <div className="relative bg-white/[0.07] backdrop-blur-xl rounded-[24px] border border-white/10 p-6 shadow-2xl">
                                {/* Fake top bar */}
                                <div className="flex items-center gap-2 mb-5">
                                    <div className="w-3 h-3 rounded-full bg-red-400/60" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                                    <div className="w-3 h-3 rounded-full bg-green-400/60" />
                                    <div className="ml-4 h-5 w-40 bg-white/10 rounded-md" />
                                </div>

                                {/* Stat cards row */}
                                <div className="grid grid-cols-3 gap-3 mb-5">
                                    {[
                                        { label: 'Total Santri', value: '48', color: 'bg-blue-400/20 text-blue-300' },
                                        { label: 'Hadir Hari Ini', value: '42', color: 'bg-emerald-400/20 text-emerald-300' },
                                        { label: 'Nilai Hari Ini', value: '15', color: 'bg-amber-400/20 text-amber-300' },
                                    ].map((stat) => (
                                        <div key={stat.label} className={`${stat.color} rounded-xl p-3 text-center`}>
                                            <p className="text-2xl font-bold">{stat.value}</p>
                                            <p className="text-[10px] opacity-70 mt-0.5">{stat.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Fake table */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2.5">
                                        <div className="w-7 h-7 rounded-full bg-tpq-yellow/20 flex items-center justify-center text-tpq-yellow text-xs font-bold">A</div>
                                        <div className="flex-1">
                                            <div className="h-3 w-28 bg-white/20 rounded" />
                                            <div className="h-2 w-16 bg-white/10 rounded mt-1.5" />
                                        </div>
                                        <div className="px-2 py-1 bg-emerald-400/20 text-emerald-300 rounded text-[10px] font-medium">Hadir</div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2.5">
                                        <div className="w-7 h-7 rounded-full bg-tpq-yellow/20 flex items-center justify-center text-tpq-yellow text-xs font-bold">F</div>
                                        <div className="flex-1">
                                            <div className="h-3 w-32 bg-white/20 rounded" />
                                            <div className="h-2 w-20 bg-white/10 rounded mt-1.5" />
                                        </div>
                                        <div className="px-2 py-1 bg-emerald-400/20 text-emerald-300 rounded text-[10px] font-medium">Hadir</div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2.5">
                                        <div className="w-7 h-7 rounded-full bg-tpq-yellow/20 flex items-center justify-center text-tpq-yellow text-xs font-bold">Z</div>
                                        <div className="flex-1">
                                            <div className="h-3 w-24 bg-white/20 rounded" />
                                            <div className="h-2 w-14 bg-white/10 rounded mt-1.5" />
                                        </div>
                                        <div className="px-2 py-1 bg-amber-400/20 text-amber-300 rounded text-[10px] font-medium">Lancar</div>
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

export default Hero;
