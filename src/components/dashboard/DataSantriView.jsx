import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

const formatDisplayDate = (value, options = {}) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', options);
};

const getSupabaseErrorMessage = (error, tableName = 'santri') => {
  if (!error) return 'Terjadi kesalahan yang tidak diketahui.';
  if (error.code === 'PGRST205') {
    return `Tabel ${tableName} belum ada di database. Jalankan SQL setup terlebih dahulu.`;
  }
  if (error.code === '42501') {
    return `Akses ke tabel ${tableName} ditolak. Pastikan RLS policy sudah benar.`;
  }
  return error.message || 'Terjadi kesalahan saat mengakses database.';
};

const getInitials = (name) => {
  if (!name) return '?';
  const names = name.trim().split(' ');
  if (names.length >= 2) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const DataSantriView = ({ user, onSantriStatusChanged, onKelompokAssigned, onOpenAddSantri }) => {
  const navigate = useNavigate();
  const [dataSantri, setDataSantri] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [kelompokList, setKelompokList] = useState([]);
  const [loadingKelompok, setLoadingKelompok] = useState(true);

  const [selectedSantri, setSelectedSantri] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState('');
  const [assigningKelompokId, setAssigningKelompokId] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchAllSantri = async () => {
      if (!user?.id) return;
      setLoading(true);
      setError('');

      try {
        const { data, error: err } = await supabase
          .from('santri')
          .select('*, kelompok:kelompok_id ( id, nama_kelompok )')
          .eq('created_by', user.id)
          .order('nama_lengkap', { ascending: true });

        if (err) throw err;
        if (isMounted) setDataSantri(data || []);
      } catch (err) {
        if (isMounted) setError(getSupabaseErrorMessage(err));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const fetchKelompok = async () => {
      if (!user?.id) {
        if (isMounted) {
          setKelompokList([]);
          setLoadingKelompok(false);
        }
        return;
      }

      setLoadingKelompok(true);

      try {
        const { data, error: err } = await supabase
          .from('kelompok')
          .select('id, nama_kelompok')
          .eq('created_by', user.id)
          .order('nama_kelompok', { ascending: true });

        if (err) throw err;
        if (isMounted) setKelompokList(data || []);
      } catch (err) {
        if (isMounted) setActionError(getSupabaseErrorMessage(err, 'kelompok'));
      } finally {
        if (isMounted) setLoadingKelompok(false);
      }
    };

    fetchAllSantri();
    fetchKelompok();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!actionSuccess) return undefined;
    const timer = setTimeout(() => setActionSuccess(''), 3500);
    return () => clearTimeout(timer);
  }, [actionSuccess]);

  const stats = useMemo(() => {
    return {
      total: dataSantri.length,
      aktif: dataSantri.filter((s) => s.status !== 'Nonaktif').length,
      tanpaKelompok: dataSantri.filter((s) => !s.kelompok_id && s.status !== 'Nonaktif').length,
    };
  }, [dataSantri]);

  const handleToggleStatus = async (santri) => {
    if (!santri?.id) return;
    if (!user?.id) {
      setActionError('Anda harus login untuk mengubah status santri.');
      return;
    }

    setUpdatingStatusId(santri.id);
    setActionError('');

    try {
      const nextStatus = santri.status === 'Nonaktif' ? 'Aktif' : 'Nonaktif';

      const { error: err } = await supabase
        .from('santri')
        .update({ status: nextStatus })
        .eq('id', santri.id)
        .eq('created_by', user.id);

      if (err) throw err;

      setDataSantri((prev) => prev.map((item) => (
        item.id === santri.id
          ? { ...item, status: nextStatus }
          : item
      )));
      if (selectedSantri?.id === santri.id) {
        setSelectedSantri((prev) => (prev ? { ...prev, status: nextStatus } : prev));
      }

      if (onSantriStatusChanged) {
        await onSantriStatusChanged({
          id: santri.id,
          nama_lengkap: santri.nama_lengkap,
          status: nextStatus,
        });
      }
    } catch (err) {
      setActionError(getSupabaseErrorMessage(err));
    } finally {
      setUpdatingStatusId('');
    }
  };

  const handleAssignKelompok = async (santri, kelompokId) => {
    if (!santri?.id || !user?.id) return;

    setAssigningKelompokId(santri.id);
    setActionError('');

    try {
      const nextKelompokId = kelompokId || null;
      const nextKelompok = kelompokList.find((item) => item.id === nextKelompokId) || null;

      const { error: err } = await supabase
        .from('santri')
        .update({ kelompok_id: nextKelompokId })
        .eq('id', santri.id)
        .eq('created_by', user.id);

      if (err) throw err;

      setDataSantri((prev) => prev.map((item) => (
        item.id === santri.id
          ? {
            ...item,
            kelompok_id: nextKelompokId,
            kelompok: nextKelompok
              ? { id: nextKelompok.id, nama_kelompok: nextKelompok.nama_kelompok }
              : null,
          }
          : item
      )));

      if (selectedSantri?.id === santri.id) {
        setSelectedSantri((prev) => (prev
          ? {
            ...prev,
            kelompok_id: nextKelompokId,
            kelompok: nextKelompok
              ? { id: nextKelompok.id, nama_kelompok: nextKelompok.nama_kelompok }
              : null,
          }
          : prev));
      }

      setActionSuccess(
        nextKelompok
          ? `${santri.nama_lengkap} pindah ke ${nextKelompok.nama_kelompok}.`
          : `Kelompok ${santri.nama_lengkap} dikosongkan.`,
      );

      if (onKelompokAssigned) {
        await onKelompokAssigned();
      }
    } catch (err) {
      setActionError(getSupabaseErrorMessage(err, 'santri'));
    } finally {
      setAssigningKelompokId('');
    }
  };

  const filteredSantri = dataSantri.filter((santri) =>
    (santri.nama_lengkap || '').toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getStatusBadge = (status) => (
    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${status === 'Nonaktif' ? 'bg-gray-100 text-gray-500' : 'bg-emerald-100 text-emerald-800'
      }`}>
      {status || 'Aktif'}
    </span>
  );

  const getGenderBadge = (jenisKelamin) => (
    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${jenisKelamin === 'Laki-laki'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-pink-100 text-pink-700'
      }`}>
      {jenisKelamin === 'Laki-laki' ? 'Laki-Laki' : 'Perempuan'}
    </span>
  );

  const openSantriNilaiPage = (santriId) => {
    if (!santriId) return;
    navigate(`/dashboard/santri/${santriId}/nilai`);
  };

  return (
    <>
      <div className="space-y-6 animate-modal-slide">

        {/* HEADER & SEARCH */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">Data Master Santri</h2>
            <p className="text-sm text-gray-500 mt-1">Kelola informasi, profil, dan penempatan halaqah santri Anda.</p>
          </div>

          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3 md:items-center">
            {onOpenAddSantri && (
              <button
                type="button"
                onClick={onOpenAddSantri}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-tpq-green text-white text-sm font-bold shadow-sm hover:bg-emerald-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Tambah Santri
              </button>
            )}
            <div className="relative max-w-sm w-full md:w-80 group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-tpq-green transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Cari nama santri..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-tpq-green/20 focus:border-tpq-green transition-all shadow-sm group-hover:shadow-md"
              />
            </div>
          </div>
        </div>

        {/* STATS ROW */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-tpq-green/30 transition-colors">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Santri</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Santri Aktif</p>
                <p className="text-2xl font-bold text-gray-900">{stats.aktif}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-amber-500/30 transition-colors">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-50 text-amber-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Belum Dapat Kelompok</p>
                <p className="text-2xl font-bold text-gray-900">{stats.tanpaKelompok}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}
        {actionError && (
          <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
            {actionError}
          </div>
        )}
        {actionSuccess && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium flex gap-2 items-center">
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {actionSuccess}
          </div>
        )}

        {/* MOBILE CARDS VIEW */}
        <div className="space-y-4 md:hidden">
          {loading && (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tpq-green"></div>
            </div>
          )}

          {!loading && filteredSantri.length === 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 px-6 py-12 text-center shadow-sm">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 text-gray-300 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <p className="text-gray-900 font-bold text-lg mb-1">Data Tidak Ditemukan</p>
              <p className="text-gray-500 text-sm">Coba gunakan kata kunci pencarian lain.</p>
            </div>
          )}

          {!loading && filteredSantri.map((santri) => (
            <article key={santri.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4 overflow-hidden relative group">
              <div className={`absolute top-0 left-0 w-1.5 h-full ${santri.status === 'Nonaktif' ? 'bg-gray-300' : 'bg-tpq-green'}`}></div>

              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-lg shadow-sm
                   ${santri.jenis_kelamin === 'Laki-laki' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}
                `}>
                  {getInitials(santri.nama_lengkap)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-gray-900 text-base truncate">{santri.nama_lengkap}</p>
                    {getStatusBadge(santri.status)}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium truncate">Wali: {santri.nama_wali || '-'} • {santri.no_hp || '-'}</p>
                </div>
              </div>

              <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Kelompok Halaqah</p>
                  <select
                    value={santri.kelompok_id || ''}
                    onChange={(event) => handleAssignKelompok(santri, event.target.value)}
                    disabled={loadingKelompok || assigningKelompokId === santri.id}
                    className="w-full min-w-[200px] px-2 py-1 bg-transparent border-0 border-b-2 border-tpq-green/20 focus:border-tpq-green focus:ring-0 text-sm font-semibold text-gray-800 p-0 disabled:opacity-60 transition-colors"
                  >
                    <option value="">-- Belum Ada --</option>
                    {kelompokList.map((kelompok) => (
                      <option key={kelompok.id} value={kelompok.id}>{kelompok.nama_kelompok}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSantri(santri)}
                  className="px-2 py-2 rounded-xl flex flex-col items-center justify-center gap-1 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors font-medium text-xs"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  Detail
                </button>
                <button
                  type="button"
                  onClick={() => openSantriNilaiPage(santri.id)}
                  className="px-2 py-2 rounded-xl flex flex-col items-center justify-center gap-1 bg-tpq-green/10 text-emerald-700 hover:bg-tpq-green/20 transition-colors font-medium text-xs"
                >
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  Riwayat Nilai
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActionError('');
                    handleToggleStatus(santri);
                  }}
                  disabled={updatingStatusId === santri.id}
                  className={`px-2 py-2 rounded-xl flex flex-col items-center justify-center gap-1 font-medium text-xs transition-colors disabled:opacity-60 ${santri.status === 'Nonaktif' ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                >
                  {santri.status === 'Nonaktif' ? (
                    <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Aktifkan</>
                  ) : (
                    <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>Nonaktifkan</>
                  )}
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* DESKTOP TABLE VIEW */}
        <div className="hidden md:block bg-white rounded-3xl border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#fcfdff] border-b border-gray-100">
                <tr>
                  <th className="px-6 py-5 font-bold text-gray-500 uppercase tracking-wider text-xs">Profil Santri</th>
                  <th className="px-6 py-5 font-bold text-gray-500 uppercase tracking-wider text-xs">Wali & Kontak</th>
                  <th className="px-6 py-5 font-bold text-gray-500 uppercase tracking-wider text-xs">Kelompok</th>
                  <th className="px-6 py-5 font-bold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                  <th className="px-6 py-5 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700 relative">
                {loading && (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-tpq-green mb-4"></div>
                        <span className="text-gray-400 font-medium">Memuat data santri...</span>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && filteredSantri.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-24 text-center">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-50 mb-4 shadow-inner">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                      </div>
                      <p className="text-gray-900 font-bold text-lg mb-1">Data tidak ditemukan</p>
                      <p className="text-gray-500">Coba ubah kata kunci pencarian Anda.</p>
                    </td>
                  </tr>
                )}

                {!loading && filteredSantri.map((santri) => (
                  <tr key={santri.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center font-bold shadow-sm border border-white ring-2 ring-transparent group-hover:ring-gray-100 transition-all
                           ${santri.jenis_kelamin === 'Laki-laki' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}
                        `}>
                          {getInitials(santri.nama_lengkap)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-base">{santri.nama_lengkap}</p>
                          <div className="flex items-center gap-2 mt-1 opacity-70">
                            {getGenderBadge(santri.jenis_kelamin)}
                            <span className="text-xs text-gray-400">
                              Lhr: {formatDisplayDate(santri.tanggal_lahir, { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800">{santri.nama_wali || 'Belum Ada'}</span>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          {santri.no_hp || '-'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={santri.kelompok_id || ''}
                        onChange={(event) => handleAssignKelompok(santri, event.target.value)}
                        disabled={loadingKelompok || assigningKelompokId === santri.id}
                        className="w-full min-w-[160px] px-3 py-2.5 rounded-xl bg-gray-50 border-0 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-tpq-green focus:bg-white disabled:opacity-60 transition-all cursor-pointer hover:bg-gray-100 text-gray-700"
                      >
                        <option value="">-- Belum Ada --</option>
                        {kelompokList.map((kelompok) => (
                          <option key={kelompok.id} value={kelompok.id}>{kelompok.nama_kelompok}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(santri.status)}
                    </td>
                    <td className="px-6 py-4 text-right overflow-visible">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedSantri(santri)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors tooltip-trigger relative"
                          title="Detail Santri"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => openSantriNilaiPage(santri.id)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
                          title="Input/Riwayat Nilai"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActionError('');
                            handleToggleStatus(santri);
                          }}
                          disabled={updatingStatusId === santri.id}
                          className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition disabled:opacity-60 ${santri.status === 'Nonaktif'
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                            }`}
                        >
                          {updatingStatusId === santri.id
                            ? '...'
                            : (santri.status === 'Nonaktif' ? 'Aktifkan' : 'Nonaktif')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL DETAIL SANTRI */}
      {selectedSantri && (
        <div className="fixed inset-0 z-[80] px-4 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-modal-slide">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col relative">

            {/* Floating Close Button (Pinned to Modal Window) */}
            <button
              type="button"
              onClick={() => setSelectedSantri(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-black/10 hover:bg-black/20 text-white hover:text-white rounded-full flex items-center justify-center transition backdrop-blur-md z-[60]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Scrollable Container for both header and body */}
            <div className="flex-1 overflow-y-auto">
              <div className="h-32 bg-gradient-to-r from-tpq-green to-emerald-400 relative overflow-hidden">
                <div className="absolute -right-4 -top-8 opacity-20">
                  <svg className="w-48 h-48 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              <div className="px-6 sm:px-8 pb-6 relative">
                <div className="flex flex-col sm:flex-row gap-6 items-start relative -mt-16">
                  <div className={`w-32 h-32 rounded-3xl bg-white p-2 shadow-lg flex-shrink-0 relative`}>
                    <div className={`w-full h-full rounded-2xl flex items-center justify-center text-4xl font-bold shadow-inner ${selectedSantri.jenis_kelamin === 'Laki-laki' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                      {getInitials(selectedSantri.nama_lengkap)}
                    </div>
                  </div>
                  <div className="pt-2 sm:pt-16 pb-2">
                    <h3 className="text-3xl font-bold text-gray-900 leading-tight">{selectedSantri.nama_lengkap}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {getStatusBadge(selectedSantri.status)}
                      {getGenderBadge(selectedSantri.jenis_kelamin)}
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-medium text-xs">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Bergabung: {formatDisplayDate(selectedSantri.created_at, { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid sm:grid-cols-2 gap-6">
                  {/* Detail Card 1 */}
                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      Identitas Santri
                    </h4>
                    <div>
                      <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-0.5">Tanggal Lahir</p>
                      <p className="font-semibold text-gray-800 text-sm">{formatDisplayDate(selectedSantri.tanggal_lahir, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-0.5">Kelompok Halaqah</p>
                      <p className="font-semibold text-gray-800 text-sm bg-white border border-gray-200 px-3 py-1.5 rounded-lg inline-block shadow-sm">
                        {selectedSantri.kelompok?.nama_kelompok || 'Belum Diatur'}
                      </p>
                    </div>
                  </div>

                  {/* Detail Card 2 */}
                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      Informasi Kontak
                    </h4>
                    <div>
                      <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-0.5">Nama Wali</p>
                      <p className="font-semibold text-gray-800 text-sm">{selectedSantri.nama_wali || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-0.5">No. Whatsapp / HP Wali</p>
                      <p className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                        {selectedSantri.no_hp || '-'}
                        {selectedSantri.no_hp && (
                          <a href={`https://wa.me/${selectedSantri.no_hp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-emerald-500 hover:text-emerald-600" title="Hubungi via WhatsApp">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 21c-1.636 0-3.22-.42-4.634-1.22l-5.116 1.34 1.36-4.99c-.87-1.444-1.33-3.1-1.33-4.8 0-5.12 4.17-9.29 9.29-9.29 5.122 0 9.29 4.17 9.29 9.29s-4.168 9.33-9.29 9.33h.03zm-4.66-3.8l.31.18c1.33.8 2.87 1.22 4.45 1.22 4.14 0 7.51-3.37 7.51-7.51 0-4.14-3.37-7.51-7.51-7.51-4.15 0-7.51 3.37-7.51 7.51 0 1.57.43 3.1 1.23 4.43l.2.33-.86 3.15 3.23-.84h-.05zm8.13-5.27c-.37-.19-2.18-1.08-2.52-1.2-.33-.12-.58-.19-.82.18-.25.37-.96 1.2-1.17 1.45-.22.25-.44.28-.81.09-.38-.19-1.56-.58-2.97-1.84-1.1-.98-1.84-2.18-2.06-2.56-.21-.38-.02-.58.17-.77.17-.18.38-.44.57-.66.18-.22.25-.37.36-.62.13-.25.07-.47-.03-.66-.09-.18-.82-1.98-1.12-2.71-.3-.72-.61-.62-.82-.63-.22-.01-.46-.01-.71-.01-.25 0-.66.09-1.01.47-.36.38-1.37 1.34-1.37 3.28 0 1.94 1.4 3.82 1.6 4.09.2.27 2.8 4.28 6.78 6 3.98 1.72 3.98 1.14 4.7 1.08.72-.06 2.18-.89 2.48-1.75.3-.86.3-1.6.21-1.75-.1-.16-.36-.25-.74-.44z" /></svg>
                          </a>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1 px-1">Alamat Domisili</p>
                    <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3.5 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {selectedSantri.alamat || 'Belum ada data alamat.'}
                    </div>
                  </div>
                  {selectedSantri.catatan && (
                    <div>
                      <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1 px-1">Catatan Tambahan</p>
                      <div className="rounded-2xl border border-amber-100 bg-amber-50/50 px-4 py-3.5 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {selectedSantri.catatan}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-5 border-t border-gray-100 bg-white flex flex-col-reverse sm:flex-row gap-3 sm:justify-between items-center z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
              <button
                type="button"
                onClick={() => {
                  setActionError('');
                  handleToggleStatus(selectedSantri);
                }}
                disabled={updatingStatusId === selectedSantri.id}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 transition-colors ${selectedSantri.status === 'Nonaktif'
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
              >
                {updatingStatusId === selectedSantri.id
                  ? 'Memproses...'
                  : (selectedSantri.status === 'Nonaktif' ? 'Pulihkan Akun Santri' : 'Nonaktifkan Santri')}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedSantri(null);
                  openSantriNilaiPage(selectedSantri.id);
                }}
                className="w-full sm:w-auto px-8 py-2.5 bg-tpq-green hover:bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                Nilai Ngaji
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DataSantriView;
