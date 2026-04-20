import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

const formatDisplayDate = (value, options = {}) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('id-ID', options);
};

const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const normalizeAbsensiStatus = (status) => (status === 'Hadir' ? 'Hadir' : 'Tidak Hadir');

const AbsensiView = ({
    user,
    onOpenAddAbsensi,
    canOpenAddAbsensi = true,
    addAbsensiHint = '',
}) => {
    const [dataAbsensi, setDataAbsensi] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchDate, setSearchDate] = useState('');

    useEffect(() => {
        let isMounted = true;

        const fetchAllAbsensi = async () => {
            if (!user?.id) return;
            setLoading(true);
            setError('');

            try {
                const { data, error: err } = await supabase
                    .from('absensi')
                    .select(`
            *,
            santri ( nama_lengkap, jenis_kelamin )
          `)
                    .eq('created_by', user.id)
                    .order('tanggal', { ascending: false })
                    .order('created_at', { ascending: false });

                if (err) throw err;
                if (isMounted) setDataAbsensi(data || []);
            } catch (err) {
                if (isMounted) setError(err.message || 'Gagal memuat histori absensi');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchAllAbsensi();

        return () => {
            isMounted = false;
        };
    }, [user?.id]);

    const getStatusBadge = (status) => {
        const normalizedStatus = normalizeAbsensiStatus(status);

        if (normalizedStatus === 'Hadir') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.15)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Hadir
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100 shadow-[0_2px_10px_-3px_rgba(244,63,94,0.15)]">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Tidak Hadir
            </span>
        );
    };

    const filteredAbsensi = dataAbsensi.filter((absensi) => {
        const matchName = (absensi.santri?.nama_lengkap || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchDate = !searchDate || absensi.tanggal === searchDate;
        return matchName && matchDate;
    });

    const groupedAbsensiByDate = useMemo(() => {
        const grouped = filteredAbsensi.reduce((acc, absensi) => {
            const key = absensi.tanggal || 'tanpa-tanggal';
            if (!acc[key]) acc[key] = [];
            acc[key].push(absensi);
            return acc;
        }, {});

        return Object.entries(grouped)
            .sort(([dateA], [dateB]) => {
                const timeA = dateA === 'tanpa-tanggal' ? 0 : new Date(dateA).getTime();
                const timeB = dateB === 'tanpa-tanggal' ? 0 : new Date(dateB).getTime();
                return timeB - timeA;
            })
            .map(([date, items]) => {
                const hadir = items.filter((item) => normalizeAbsensiStatus(item.status) === 'Hadir').length;
                const catatanList = [...new Set(
                    items
                        .map((item) => (item.catatan || '').trim())
                        .filter(Boolean)
                )];

                return {
                    date,
                    items,
                    hadir,
                    tidakHadir: items.length - hadir,
                    catatanHarian: catatanList[0] || '-',
                    catatanLainnya: Math.max(catatanList.length - 1, 0),
                };
            });
    }, [filteredAbsensi]);

    return (
        <div className="space-y-6 animate-modal-slide pb-10">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-6 rounded-3xl shadow-sm border border-gray-100/50">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Histori Absensi</h2>
                    <p className="text-sm text-gray-500 mt-1.5 max-w-md">Lacak catatan kehadiran seluruh santri dari waktu ke waktu secara komprehensif.</p>
                </div>

                <div className="w-full xl:w-auto flex flex-col sm:flex-row gap-3">
                    {onOpenAddAbsensi && (
                        <button
                            type="button"
                            onClick={onOpenAddAbsensi}
                            disabled={!canOpenAddAbsensi}
                            title={addAbsensiHint || 'Catat kehadiran santri'}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-tpq-green text-white text-sm font-bold shadow-sm hover:bg-emerald-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-tpq-green"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
                            </svg>
                            Catat Absensi
                        </button>
                    )}
                    <div className="relative w-full sm:w-80">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Cari nama santri..."
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-tpq-green/10 focus:border-tpq-green transition-all shadow-sm focus:bg-white"
                        />
                    </div>
                    <div className="relative w-full sm:w-56">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                        </div>
                        <input
                            type="date"
                            value={searchDate}
                            onChange={(event) => setSearchDate(event.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-tpq-green/10 focus:border-tpq-green transition-all shadow-sm focus:bg-white text-gray-600"
                        />
                    </div>
                </div>
            </div>

            {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 px-5 py-4 rounded-2xl text-sm shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="font-medium leading-relaxed">{error}</p>
                </div>
            )}

            {loading && (
                <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-tpq-green rounded-full animate-spin mb-4" />
                    <p className="font-semibold text-gray-500">Memuat riwayat kehadiran...</p>
                </div>
            )}

            {!loading && !error && groupedAbsensiByDate.length === 0 && (
                <div className="bg-white rounded-3xl border border-gray-100 px-6 py-20 text-center shadow-sm flex flex-col items-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Riwayat Kosong</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">Kami tidak dapat menemukan data absensi apa pun yang sesuai dengan kriteria Anda.</p>
                </div>
            )}

            {!loading && !error && groupedAbsensiByDate.map((group) => (
                <section key={group.date} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
                    {/* Header Area */}
                    <div className="relative overflow-hidden bg-gray-50/80 px-5 sm:px-8 py-6 border-b border-gray-100">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-tpq-green/[0.03] rounded-full blur-2xl transform translate-x-10 -translate-y-10" />

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-gray-100 flex flex-col items-center justify-center shrink-0">
                                    <span className="text-xs font-bold text-tpq-green uppercase leading-none">
                                        {group.date === 'tanpa-tanggal' ? '-' : formatDisplayDate(group.date, { month: 'short' })}
                                    </span>
                                    <span className="text-lg font-black text-gray-900 leading-tight mt-0.5">
                                        {group.date === 'tanpa-tanggal' ? '-' : formatDisplayDate(group.date, { day: '2-digit' })}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        {group.date === 'tanpa-tanggal'
                                            ? 'Tanggal Tidak Tersedia'
                                            : formatDisplayDate(group.date, { weekday: 'long', year: 'numeric' })}
                                    </h3>
                                    <p className="text-sm text-gray-500 font-medium mt-1">Total {group.items.length} santri tercatat</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="bg-white px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 border-r border-gray-200 pr-3">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className="text-sm font-bold text-gray-800">{group.hadir} <span className="font-normal text-gray-500">Hadir</span></span>
                                    </div>
                                    <div className="flex items-center gap-1.5 pl-1">
                                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                                        <span className="text-sm font-bold text-gray-800">{group.tidakHadir} <span className="font-normal text-gray-500">Absen</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Jurnal / Catatan Callout */}
                    {group.catatanHarian !== '-' && (
                        <div className="px-5 sm:px-8 py-3.5 bg-blue-50/50 border-b border-gray-100 flex items-start gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-sm text-blue-800 leading-relaxed font-medium">
                                <b>Jurnal Kegiatan:</b> {group.catatanHarian}
                                {group.catatanLainnya > 0 && (
                                    <span className="text-blue-500 font-bold ml-1 text-xs bg-blue-100 px-2 py-0.5 rounded-md">+{group.catatanLainnya} catatan lain</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Mobile View: Cards */}
                    <div className="md:hidden p-4 space-y-3 bg-gray-50/30">
                        {group.items.map((absensi) => {
                            const isMale = absensi.santri?.jenis_kelamin === 'Laki-laki';
                            return (
                                <article key={absensi.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isMale ? 'bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 border border-blue-100' : 'bg-gradient-to-br from-pink-50 to-rose-50 text-pink-600 border border-pink-100'}`}>
                                                {getInitials(absensi.santri?.nama_lengkap)}
                                            </div>
                                            <p className="font-bold text-gray-900 truncate text-[15px]">{absensi.santri?.nama_lengkap || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center border border-gray-100/50">
                                        <span className="text-xs font-semibold text-gray-500">Status Kehadiran</span>
                                        {getStatusBadge(absensi.status)}
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    {/* Desktop View: Styled Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-white text-gray-400 font-semibold border-b border-gray-100">
                                <tr>
                                    <th className="px-8 py-4 w-2/3">Identitas Santri</th>
                                    <th className="px-8 py-4">Status & Waktu</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 bg-white">
                                {group.items.map((absensi) => {
                                    const isMale = absensi.santri?.jenis_kelamin === 'Laki-laki';
                                    return (
                                        <tr key={absensi.id} className="hover:bg-gray-50/50 transition-colors duration-150 group/row">
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 flex items-center justify-center rounded-2xl font-bold text-sm shadow-sm transition-transform group-hover/row:scale-110 ${isMale ? 'bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 border border-blue-100' : 'bg-gradient-to-br from-pink-50 to-rose-50 text-pink-600 border border-pink-100'}`}>
                                                        {getInitials(absensi.santri?.nama_lengkap)}
                                                    </div>
                                                    <div>
                                                        <p className="font-extrabold text-gray-900 group-hover/row:text-tpq-green transition-colors text-[15px]">{absensi.santri?.nama_lengkap || '-'}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">{absensi.santri?.jenis_kelamin || 'Tidak diketahui'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <div className="flex flex-col items-start gap-1">
                                                    {getStatusBadge(absensi.status)}
                                                    <span className="text-[11px] font-medium text-gray-400 pl-1 mt-1 flex items-center gap-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        Diproses: {formatDisplayDate(absensi.created_at, { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            ))}
        </div>
    );
};

export default AbsensiView;
