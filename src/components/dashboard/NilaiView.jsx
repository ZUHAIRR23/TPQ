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

const getSupabaseErrorMessage = (error) => {
  if (!error) return 'Terjadi kesalahan yang tidak diketahui.';
  if (error.code === 'PGRST205') {
    return 'Tabel nilai_ngaji belum ada di database. Jalankan SQL setup terlebih dahulu.';
  }
  if (error.code === '42501') {
    return 'Akses ke tabel nilai_ngaji ditolak. Pastikan RLS policy sudah benar.';
  }
  return error.message || 'Terjadi kesalahan saat mengakses data nilai.';
};

const NILAI_META = {
  L: {
    label: 'Lancar',
    short: 'L',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-100',
    dotColor: 'bg-emerald-500',
    shadow: 'shadow-[0_2px_10px_-3px_rgba(16,185,129,0.15)]',
  },
  KL: {
    label: 'Kurang Lancar',
    short: 'KL',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-100',
    dotColor: 'bg-amber-500',
    shadow: 'shadow-[0_2px_10px_-3px_rgba(245,158,11,0.15)]',
  },
  TL: {
    label: 'Tidak Lancar',
    short: 'TL',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-100',
    dotColor: 'bg-rose-500',
    shadow: 'shadow-[0_2px_10px_-3px_rgba(244,63,94,0.15)]',
  },
};

const NilaiView = ({ user }) => {
  const [dataNilai, setDataNilai] = useState([]);
  const [kelompokOptions, setKelompokOptions] = useState([]);
  const [selectedKelompokId, setSelectedKelompokId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchAllNilai = async () => {
      if (!user?.id) {
        if (isMounted) {
          setDataNilai([]);
          setKelompokOptions([]);
          setSelectedKelompokId('');
          setLoading(false);
          setError('');
        }
        return;
      }

      setLoading(true);
      setError('');

      try {
        const { data, error: err } = await supabase
          .from('nilai_ngaji')
          .select(`
            *,
            santri (
              nama_lengkap,
              kelompok_id,
              jenis_kelamin,
              kelompok:kelompok_id ( nama_kelompok )
            )
          `)
          .eq('created_by', user.id)
          .order('tanggal', { ascending: false })
          .order('created_at', { ascending: false });

        if (err) throw err;

        const { data: kelompokData, error: kelompokError } = await supabase
          .from('kelompok')
          .select('id, nama_kelompok')
          .eq('created_by', user.id)
          .order('nama_kelompok', { ascending: true });

        if (kelompokError) throw kelompokError;

        if (isMounted) {
          setDataNilai(data || []);
          setKelompokOptions(kelompokData || []);
        }
      } catch (err) {
        if (isMounted) setError(getSupabaseErrorMessage(err));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllNilai();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const filteredNilai = useMemo(
    () => dataNilai.filter((nilai) => (
      (nilai.santri?.nama_lengkap || '').toLowerCase().includes(searchQuery.toLowerCase())
      && (!selectedKelompokId || nilai.santri?.kelompok_id === selectedKelompokId)
    )),
    [dataNilai, searchQuery, selectedKelompokId],
  );

  const summary = useMemo(() => filteredNilai.reduce((acc, item) => {
    if (item.penilaian === 'L') acc.L += 1;
    if (item.penilaian === 'KL') acc.KL += 1;
    if (item.penilaian === 'TL') acc.TL += 1;
    return acc;
  }, { L: 0, KL: 0, TL: 0 }), [filteredNilai]);

  const getNilaiBadge = (penilaian) => {
    const meta = NILAI_META[penilaian];
    if (!meta) {
      return (
        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
          {penilaian || '-'}
        </span>
      );
    }

    return (
      <span className={`inline-flex items-center justify-center min-w-[40px] px-3 py-1.5 rounded-lg text-xs font-bold ${meta.bgColor} ${meta.textColor} border ${meta.borderColor} ${meta.shadow}`}>
        {meta.short}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-modal-slide pb-10">
      {/* ── Header Dashboard ── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-6 rounded-3xl shadow-sm border border-gray-100/50">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Histori Nilai Ngaji</h2>
          <p className="text-sm text-gray-500 mt-1.5 max-w-md">Pantau perkembangan bacaan tajwid santri berdasarkan rekam nilai secara menyeluruh.</p>
        </div>

        <div className="w-full xl:w-auto flex flex-col sm:flex-row gap-3">
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-tpq-green/10 focus:border-tpq-green transition-all shadow-sm focus:bg-white"
            />
          </div>

          <div className="relative w-full sm:w-56">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </div>
            <select
              value={selectedKelompokId}
              onChange={(event) => setSelectedKelompokId(event.target.value)}
              className="appearance-none w-full pl-11 pr-10 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-tpq-green/10 focus:border-tpq-green transition-all shadow-sm focus:bg-white text-gray-700 font-medium"
            >
              <option value="">Semua Kelompok</option>
              {kelompokOptions.map((kelompok) => (
                <option key={kelompok.id} value={kelompok.id}>{kelompok.nama_kelompok}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ── Summary Stats Cards ── */}
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(NILAI_META).map(([key, meta]) => (
          <div key={key} className={`relative overflow-hidden ${meta.bgColor} border ${meta.borderColor} rounded-3xl p-5 sm:p-6 transition-transform hover:-translate-y-1 duration-300`}>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-20 bg-gradient-to-br from-white to-transparent" />
            <div className="relative z-10 flex flex-col justify-between h-full gap-2">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${meta.dotColor} shadow-sm`} />
                <p className={`text-xs font-bold uppercase tracking-wider ${meta.textColor} opacity-80`}>
                  {meta.label}
                </p>
              </div>
              <div className="flex items-end gap-3 mt-2">
                <h3 className={`text-4xl sm:text-5xl font-black ${meta.textColor} leading-none tracking-tight`}>
                  {summary[key]}
                </h3>
                <span className={`text-sm font-semibold pb-1 ${meta.textColor} opacity-70`}>santri</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 px-5 py-4 rounded-2xl text-sm shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="font-medium leading-relaxed">{error}</p>
        </div>
      )}

      {/* ── Mobile View ── */}
      <div className="space-y-4 md:hidden">
        {loading && (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-tpq-green rounded-full animate-spin" />
          </div>
        )}

        {!loading && filteredNilai.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 px-6 py-16 text-center shadow-sm flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">Data nilai tidak ditemukan.</p>
          </div>
        )}

        {!loading && filteredNilai.map((nilai) => {
          const isMale = nilai.santri?.jenis_kelamin === 'Laki-laki';
          const meta = NILAI_META[nilai.penilaian] || {};

          return (
            <article key={nilai.id} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0 ${isMale ? 'bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600' : 'bg-gradient-to-br from-pink-50 to-rose-50 text-pink-600'}`}>
                    {getInitials(nilai.santri?.nama_lengkap)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate text-[15px]">{nilai.santri?.nama_lengkap || '-'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDisplayDate(nilai.tanggal, { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-center gap-1">
                  {getNilaiBadge(nilai.penilaian)}
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 text-xs text-gray-600 space-y-2.5 border border-gray-100/60">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-medium">Kelompok</span>
                  <span className="font-bold bg-white px-2 py-0.5 rounded-md border border-gray-200">{nilai.santri?.kelompok?.nama_kelompok || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-medium">Materi</span>
                  <span className="font-semibold text-right max-w-[150px] truncate">{nilai.materi || '-'}</span>
                </div>
                {nilai.catatan && (
                  <div className="pt-2 border-t border-gray-200/60">
                    <span className="block text-gray-400 font-medium mb-1">Catatan Tutor</span>
                    <span className="block text-gray-700 bg-amber-50/50 p-2 rounded-lg border border-amber-100">{nilai.catatan}</span>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* ── Desktop View: Styled Table ── */}
      <div className="hidden md:block bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/80 text-gray-400 font-semibold border-b border-gray-100">
              <tr>
                <th className="px-8 py-5">Tanggal</th>
                <th className="px-8 py-5">Identitas Santri</th>
                <th className="px-8 py-5 flex items-center justify-center">Nilai</th>
                <th className="px-8 py-5">Halaqah</th>
                <th className="px-8 py-5">Materi</th>
                <th className="px-8 py-5 w-1/4">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {loading && (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <div className="w-8 h-8 border-4 border-gray-200 border-t-tpq-green rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              )}

              {!loading && filteredNilai.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-50 mb-4 shadow-inner">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium">Data nilai tidak ditemukan.</p>
                  </td>
                </tr>
              )}

              {!loading && filteredNilai.map((nilai) => {
                const isMale = nilai.santri?.jenis_kelamin === 'Laki-laki';
                return (
                  <tr key={nilai.id} className="hover:bg-gray-50/50 transition-colors duration-150 group/row">
                    <td className="px-8 py-5">
                      <span className="font-semibold text-gray-700 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg shadow-sm">
                        {formatDisplayDate(nilai.tanggal, { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 flex items-center justify-center rounded-2xl font-bold text-sm shadow-sm transition-transform group-hover/row:scale-110 ${isMale ? 'bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 border border-blue-100' : 'bg-gradient-to-br from-pink-50 to-rose-50 text-pink-600 border border-pink-100'}`}>
                          {getInitials(nilai.santri?.nama_lengkap)}
                        </div>
                        <div>
                          <p className="font-extrabold text-gray-900 group-hover/row:text-tpq-green transition-colors text-[15px] truncate max-w-[180px]">{nilai.santri?.nama_lengkap || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center">
                        {getNilaiBadge(nilai.penilaian)}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-gray-500 font-medium">{nilai.santri?.kelompok?.nama_kelompok || '-'}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-gray-700 font-semibold">{nilai.materi || '-'}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-gray-500 max-w-[280px] truncate" title={nilai.catatan}>
                        {nilai.catatan || <span className="italic text-gray-300">Tidak ada</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NilaiView;
