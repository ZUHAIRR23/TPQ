import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav className="flex justify-between items-center py-4 px-8 md:px-16 bg-tpq-green text-white">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-tpq-light rounded-full flex items-center justify-center font-bold text-xl">
                    T
                </div>
                <div>
                    <h1 className="font-bold text-lg leading-tight tracking-wide">TPQ Platform</h1>
                    <p className="text-[10px] text-gray-300 tracking-wider">Taman Pendidikan Al-Quran</p>
                </div>
            </div>
            <div className="hidden md:flex gap-8 text-sm font-medium">
                <a href="#beranda" className="hover:text-tpq-yellow transition">Beranda</a>
                <a href="#tentang" className="hover:text-tpq-yellow transition">Tentang</a>
                <a href="#program" className="hover:text-tpq-yellow transition">Program</a>
                <a href="#pengajar" className="hover:text-tpq-yellow transition">Pengajar</a>
                <a href="#galeri" className="hover:text-tpq-yellow transition">Galeri</a>
                <a href="#kontak" className="hover:text-tpq-yellow transition">Kontak</a>
            </div>
            <Link
                to="/auth"
                className="bg-tpq-light hover:bg-green-700 text-white px-6 py-2 rounded-full text-sm font-medium transition shadow-sm"
            >
                Login / Register
            </Link>
        </nav>
    );
};

export default Navbar;
