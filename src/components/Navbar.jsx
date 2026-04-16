import { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
    const [mobileOpen, setMobileOpen] = useState(false);

    const navLinks = [
        { label: 'Fitur', href: '#fitur' },
        { label: 'Cara Kerja', href: '#cara-kerja' },
        { label: 'Testimoni', href: '#testimoni' },
    ];

    return (
        <nav className="sticky top-0 z-50 bg-tpq-green/95 backdrop-blur-md border-b border-white/5">
            <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6 md:px-12">
                {/* Brand */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-tpq-yellow rounded-xl flex items-center justify-center font-black text-tpq-green text-lg shadow-lg shadow-tpq-yellow/20">
                        T
                    </div>
                    <div>
                        <h1 className="font-bold text-lg text-white leading-tight tracking-wide">TPQ Platform</h1>
                        <p className="text-[10px] text-white/40 tracking-wider">Manajemen TPQ Digital</p>
                    </div>
                </div>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            className="text-sm font-medium text-white/60 hover:text-white transition-colors"
                        >
                            {link.label}
                        </a>
                    ))}
                    <Link
                        to="/auth"
                        className="bg-tpq-yellow hover:bg-tpq-darkyellow text-tpq-green font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-tpq-yellow/20 hover:-translate-y-0.5"
                    >
                        Masuk / Daftar
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="md:hidden text-white/70 hover:text-white transition p-2 -mr-2"
                    aria-label="Toggle menu"
                >
                    {mobileOpen ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Mobile Menu */}
            <div
                className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="px-6 pb-5 space-y-1 border-t border-white/5">
                    {navLinks.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className="block py-3 text-sm font-medium text-white/60 hover:text-white transition-colors"
                        >
                            {link.label}
                        </a>
                    ))}
                    <Link
                        to="/auth"
                        onClick={() => setMobileOpen(false)}
                        className="block text-center bg-tpq-yellow hover:bg-tpq-darkyellow text-tpq-green font-bold px-6 py-3 rounded-xl text-sm transition-all mt-2"
                    >
                        Masuk / Daftar
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
