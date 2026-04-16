import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Helper date formatting
const formatDisplayDate = (value, options = {}) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', options);
};

const getSupabaseErrorMessage = (error, tableName = 'nilai_ngaji') => {
  if (!error) return 'Terjadi kesalahan yang tidak diketahui.';
  if (error.code === 'PGRST205') {
    return `Tabel ${tableName} belum ada di database. Jalankan SQL setup terlebih dahulu.`;
  }
  if (error.code === '42501') {
    return `Akses ke tabel ${tableName} ditolak. Pastikan RLS policy sudah benar.`;
  }
  return error.message || 'Terjadi kesalahan saat mengakses database.';
};

// Icons as SVG components
const CheckCircleIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ExclamationCircleIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ArrowLeftIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const UserIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const getNilaiMeta = (penilaian) => {
  const meta = {
    L: { label: 'Lancar', color: 'emerald', icon: <CheckCircleIcon className="w-5 h-5 text-emerald-600" /> },
    KL: { label: 'Kurang Lancar', color: 'amber', icon: <ExclamationCircleIcon className="w-5 h-5 text-amber-600" /> },
    TL: { label: 'Tidak Lancar', color: 'rose', icon: <XCircleIcon className="w-5 h-5 text-rose-600" /> },
  };
  return meta[penilaian] || { label: penilaian || '-', color: 'gray', icon: <div className="w-5 h-5 bg-gray-200 rounded-full" /> };
};

const getNilaiBadge = (penilaian) => {
  const meta = getNilaiMeta(penilaian);
  const colorClasses = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${colorClasses[meta.color]}`}>
      {meta.icon}
      {meta.label}
    </span>
  );
};

const SantriNilaiPage = () => {
  const navigate = useNavigate();
  const { santriId } = useParams();

  const [user, setUser] = useState(null);
  const [santri, setSantri] = useState(null);
  const [dataNilai, setDataNilai] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { nilaiSummary, totalNilai } = useMemo(() => {
    const summary = dataNilai.reduce((acc, item) => {
      if (item.penilaian === 'L') acc.L += 1;
      if (item.penilaian === 'KL') acc.KL += 1;
      if (item.penilaian === 'TL') acc.TL += 1;
      return acc;
    }, { L: 0, KL: 0, TL: 0 });
    return { nilaiSummary: summary, totalNilai: dataNilai.length };
  }, [dataNilai]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        const { data: authData } = await supabase.auth.getUser();
        const currentUser = authData.user ?? null;
        if (!currentUser) {
          navigate('/auth', { replace: true });
          return;
        }
        if (!isMounted) return;
        setUser(currentUser);

        const { data: santriData, error: santriError } = await supabase
          .from('santri')
          .select('id, nama_lengkap, status, jenis_kelamin')
          .eq('id', santriId)
          .eq('created_by', currentUser.id)
          .single();

        if (santriError) throw santriError;
        if (!isMounted) return;
        setSantri(santriData);

        const { data: nilaiData, error: nilaiError } = await supabase
          .from('nilai_ngaji')
          .select('id, tanggal, penilaian, materi, catatan, created_at')
          .eq('santri_id', santriId)
          .eq('created_by', currentUser.id)
          .order('tanggal', { ascending: false })
          .order('created_at', { ascending: false });

        if (nilaiError) throw nilaiError;
        if (!isMounted) return;
        setDataNilai(nilaiData || []);
      } catch (err) {
        if (!isMounted) return;
        setError(getSupabaseErrorMessage(err, err?.message?.includes('santri') ? 'santri' : 'nilai_ngaji'));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (santriId) {
      fetchData();
    } else {
      setError('ID santri tidak valid.');
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [santriId, navigate]);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center justify-center p-2 rounded-full text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
            aria-label="Kembali"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>

          <div className="flex-1 text-center truncate">
            <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">Catatan Ngaji Santri</h1>
          </div>

          {/* Placeholder to balance the centered title against the back button */}
          <div className="w-9" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 space-y-6 sm:space-y-8">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Card */}
        {santri && (
          <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100 flex items-center gap-4 sm:gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-full flex items-center justify-center shadow-inner border border-emerald-100">
                <UserIcon className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate tracking-tight">{santri.nama_lengkap}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${santri.status === 'Nonaktif' ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-800'}`}>
                  {santri.status || 'Aktif'}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${santri.jenis_kelamin === 'Laki-laki' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'}`}>
                  {santri.jenis_kelamin || '-'}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Loading State for Stats & Content */}
        {loading && (
          <div className="space-y-6">
            <div className="h-32 bg-gray-200 animate-pulse rounded-3xl"></div>
            <div className="h-64 bg-gray-200 animate-pulse rounded-3xl"></div>
          </div>
        )}

        {/* Stats & Overview (Only show if not loading and has data) */}
        {!loading && !error && dataNilai.length > 0 && (
          <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Ringkasan Nilai</h3>

            {/* Progress Bar Overview */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2 font-medium">
                <span>Total {totalNilai} Evaluasi</span>
                <span>Tingkat Kelancaran</span>
              </div>
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex">
                <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${(nilaiSummary.L / totalNilai) * 100}%` }} title={`Lancar: ${nilaiSummary.L}`} />
                <div className="bg-amber-400 transition-all duration-500" style={{ width: `${(nilaiSummary.KL / totalNilai) * 100}%` }} title={`Kurang Lancar: ${nilaiSummary.KL}`} />
                <div className="bg-rose-500 transition-all duration-500" style={{ width: `${(nilaiSummary.TL / totalNilai) * 100}%` }} title={`Tidak Lancar: ${nilaiSummary.TL}`} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-6">
              <div className="bg-emerald-50/50 rounded-2xl p-3 sm:p-4 border border-emerald-100 flex flex-col items-center justify-center text-center">
                <p className="text-xs font-semibold text-emerald-800 mb-1">Lancar</p>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-600">{nilaiSummary.L}</p>
              </div>
              <div className="bg-amber-50/50 rounded-2xl p-3 sm:p-4 border border-amber-100 flex flex-col items-center justify-center text-center">
                <p className="text-xs font-semibold text-amber-800 mb-1">Kurang</p>
                <p className="text-2xl sm:text-3xl font-bold text-amber-600">{nilaiSummary.KL}</p>
              </div>
              <div className="bg-rose-50/50 rounded-2xl p-3 sm:p-4 border border-rose-100 flex flex-col items-center justify-center text-center">
                <p className="text-xs font-semibold text-rose-800 mb-1">Tidak</p>
                <p className="text-2xl sm:text-3xl font-bold text-rose-600">{nilaiSummary.TL}</p>
              </div>
            </div>
          </section>
        )}

        {/* Empty State */}
        {!loading && !error && dataNilai.length === 0 && (
          <div className="text-center bg-white rounded-3xl py-12 sm:py-16 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
            <div className="inline-flex flex-col items-center justify-center mb-4">
              <svg className="w-16 h-16 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Belum Ada Catatan</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">Santri ini belum memiliki riwayat penilaian ngaji yang tercatat dalam sistem.</p>
          </div>
        )}

        {/* Nilai History Timeline/List */}
        {!loading && !error && dataNilai.length > 0 && (
          <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Riwayat Belajar</h3>
            </div>

            <div className="divide-y divide-gray-100">
              {dataNilai.map((nilai, index) => (
                <div key={nilai.id} className="p-5 sm:p-6 hover:bg-gray-50/50 transition-colors group">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                          {formatDisplayDate(nilai.tanggal, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      </div>

                      <div className="mt-3">
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Materi</h4>
                        <p className="text-base text-gray-800 leading-relaxed font-medium">
                          {nilai.materi || <span className="text-gray-400 italic font-normal">Belum ada materi</span>}
                        </p>
                      </div>

                      {(nilai.catatan) && (
                        <div className="mt-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 max-w-2xl">
                          <h4 className="text-[11px] font-bold text-blue-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            Catatan Ustadz/ah
                          </h4>
                          <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">
                            {nilai.catatan}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0 flex items-start sm:justify-end mt-2 sm:mt-0">
                      {getNilaiBadge(nilai.penilaian)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default SantriNilaiPage;
