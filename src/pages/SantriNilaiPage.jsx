import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatDisplayDate = (value, options = {}) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', options);
};

const getSupabaseErrorMessage = (error, tableName = 'nilai_ngaji') => {
  if (!error) return 'Terjadi kesalahan yang tidak diketahui.';
  if (error.code === 'PGRST205') return `Tabel ${tableName} belum ada di database. Jalankan SQL setup terlebih dahulu.`;
  if (error.code === '42501') return `Akses ke tabel ${tableName} ditolak. Pastikan RLS policy sudah benar.`;
  return error.message || 'Terjadi kesalahan saat mengakses database.';
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ── Icons ────────────────────────────────────────────────────────────────────
const ArrowLeftIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const BookOpenIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
);

const NoteIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const CalendarIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

// ── Nilai Metadata ───────────────────────────────────────────────────────────
const NILAI_META = {
  L: {
    label: 'Lancar',
    short: 'L',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
    accentBorder: 'border-l-emerald-500',
    shadow: 'shadow-[0_2px_10px_-3px_rgba(16,185,129,0.15)]',
    ringColor: 'ring-emerald-500/20',
  },
  KL: {
    label: 'Kurang Lancar',
    short: 'KL',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    dotColor: 'bg-amber-500',
    accentBorder: 'border-l-amber-500',
    shadow: 'shadow-[0_2px_10px_-3px_rgba(245,158,11,0.15)]',
    ringColor: 'ring-amber-500/20',
  },
  TL: {
    label: 'Tidak Lancar',
    short: 'TL',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    dotColor: 'bg-rose-500',
    accentBorder: 'border-l-rose-500',
    shadow: 'shadow-[0_2px_10px_-3px_rgba(244,63,94,0.15)]',
    ringColor: 'ring-rose-500/20',
  },
};

const getNilaiBadge = (penilaian) => {
  const meta = NILAI_META[penilaian];
  if (!meta) {
    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
        {penilaian || '-'}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold ${meta.bgColor} ${meta.textColor} border ${meta.borderColor} ${meta.shadow}`}>
      <span className={`w-2 h-2 rounded-full ${meta.dotColor}`} />
      {meta.label}
    </span>
  );
};

// ── Skeleton Components ──────────────────────────────────────────────────────
const HeroSkeleton = () => (
  <div className="bg-gradient-to-br from-tpq-green to-tpq-light px-4 sm:px-6 lg:px-8 pt-5 pb-10">
    <div className="max-w-4xl mx-auto">
      <div className="h-10 w-10 bg-white/10 rounded-full animate-pulse mb-6" />
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 bg-white/10 rounded-2xl animate-pulse" />
        <div className="space-y-3 flex-1">
          <div className="h-6 bg-white/10 rounded-lg w-48 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-white/10 rounded-full animate-pulse" />
            <div className="h-5 w-20 bg-white/10 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const StatsSkeleton = () => (
  <div className="grid grid-cols-3 gap-3 sm:gap-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-12 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    ))}
  </div>
);

const TimelineSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-6 border-l-4 border-l-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
          <div className="h-7 w-24 bg-gray-200 rounded-xl animate-pulse" />
        </div>
        <div className="space-y-3">
          <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
          <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────
const SantriNilaiPage = () => {
  const navigate = useNavigate();
  const { santriId } = useParams();

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

    return () => { isMounted = false; };
  }, [santriId, navigate]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50/80 animate-modal-slide">
      {/* ═══════════════════════════════════════════════════════════════════════
          HERO HEADER — dark green gradient with integrated profile
          ═══════════════════════════════════════════════════════════════════════ */}
      {loading && !santri ? (
        <HeroSkeleton />
      ) : (
        <header className="relative bg-gradient-to-br from-tpq-green via-tpq-green to-tpq-light overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/[0.03] rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/[0.03] rounded-full translate-y-1/3 -translate-x-1/4" />
          <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-tpq-yellow/40 rounded-full" />
          <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-tpq-yellow/30 rounded-full" />

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-10">
            {/* Back button */}
            <button
              onClick={() => navigate('/dashboard')}
              className="group inline-flex items-center gap-2 mb-6 text-white/70 hover:text-white transition-colors duration-200"
              aria-label="Kembali ke Dashboard"
            >
              <div className="p-2 rounded-xl bg-white/10 group-hover:bg-white/20 backdrop-blur-sm transition-all duration-200">
                <ArrowLeftIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </div>
              <span className="text-sm font-medium hidden sm:inline">Kembali</span>
            </button>

            {/* Profile section */}
            {santri && (
              <div className="flex items-center gap-4 sm:gap-5">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                    <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {getInitials(santri.nama_lengkap)}
                    </span>
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-tpq-green ${santri.status === 'Nonaktif' ? 'bg-gray-400' : 'bg-emerald-400'}`} />
                </div>

                {/* Name & badges */}
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-white truncate tracking-tight leading-tight">
                    {santri.nama_lengkap}
                  </h1>
                  <p className="text-sm text-white/50 mt-0.5 mb-2">Catatan Ngaji Santri</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide ${santri.status === 'Nonaktif' ? 'bg-gray-500/30 text-gray-200' : 'bg-emerald-500/25 text-emerald-200'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${santri.status === 'Nonaktif' ? 'bg-gray-400' : 'bg-emerald-400'}`} />
                      {santri.status || 'Aktif'}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide ${santri.jenis_kelamin === 'Laki-laki' ? 'bg-blue-500/25 text-blue-200' : 'bg-pink-500/25 text-pink-200'}`}>
                      {santri.jenis_kelamin || '-'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN CONTENT
          ═══════════════════════════════════════════════════════════════════════ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-12 space-y-5 sm:space-y-6 relative z-10">
        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mt-0.5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="font-medium leading-relaxed">{error}</p>
          </div>
        )}

        {/* ── Loading Skeletons ────────────────────────────────────────────── */}
        {loading && (
          <div className="space-y-5 sm:space-y-6">
            <StatsSkeleton />
            <TimelineSkeleton />
          </div>
        )}

        {/* ── Stats & Progress ────────────────────────────────────────────── */}
        {!loading && !error && dataNilai.length > 0 && (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {Object.entries(NILAI_META).map(([key, meta]) => (
                <div
                  key={key}
                  className={`relative overflow-hidden ${meta.bgColor} border ${meta.borderColor} rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
                >
                  {/* Decorative circle */}
                  <div className="absolute -right-3 -bottom-3 w-20 h-20 rounded-full opacity-[0.08] bg-gradient-to-br from-current to-transparent" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${meta.dotColor} shadow-sm`} />
                      <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${meta.textColor} opacity-80`}>
                        {meta.label}
                      </p>
                    </div>
                    <div className="flex items-end gap-1.5">
                      <h3 className={`text-3xl sm:text-4xl font-black ${meta.textColor} leading-none tracking-tight`}>
                        {nilaiSummary[key]}
                      </h3>
                      <span className={`text-[10px] sm:text-xs font-semibold pb-0.5 ${meta.textColor} opacity-60`}>kali</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Progress Bar Section */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-tpq-green rounded-full" />
                  <h3 className="text-sm font-bold text-gray-900">Tingkat Kelancaran</h3>
                </div>
                <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                  {totalNilai} evaluasi
                </span>
              </div>

              {/* Stacked bar */}
              <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                {nilaiSummary.L > 0 && (
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700 ease-out first:rounded-l-full last:rounded-r-full"
                    style={{ width: `${(nilaiSummary.L / totalNilai) * 100}%` }}
                    title={`Lancar: ${nilaiSummary.L}`}
                  />
                )}
                {nilaiSummary.KL > 0 && (
                  <div
                    className="bg-gradient-to-r from-amber-300 to-amber-400 transition-all duration-700 ease-out first:rounded-l-full last:rounded-r-full"
                    style={{ width: `${(nilaiSummary.KL / totalNilai) * 100}%` }}
                    title={`Kurang Lancar: ${nilaiSummary.KL}`}
                  />
                )}
                {nilaiSummary.TL > 0 && (
                  <div
                    className="bg-gradient-to-r from-rose-400 to-rose-500 transition-all duration-700 ease-out first:rounded-l-full last:rounded-r-full"
                    style={{ width: `${(nilaiSummary.TL / totalNilai) * 100}%` }}
                    title={`Tidak Lancar: ${nilaiSummary.TL}`}
                  />
                )}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 sm:gap-6 mt-3.5 flex-wrap">
                {Object.entries(NILAI_META).map(([key, meta]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${meta.dotColor}`} />
                    <span className="text-xs text-gray-500 font-medium">{meta.label}</span>
                    <span className={`text-xs font-bold ${meta.textColor}`}>
                      {totalNilai > 0 ? Math.round((nilaiSummary[key] / totalNilai) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Empty State ─────────────────────────────────────────────────── */}
        {!loading && !error && dataNilai.length === 0 && (
          <div className="text-center bg-white rounded-2xl sm:rounded-3xl py-16 sm:py-20 px-6 shadow-sm border border-gray-100">
            <div className="relative inline-flex mb-5">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl flex items-center justify-center shadow-inner border border-gray-100">
                <BookOpenIcon className="w-12 h-12 text-gray-300" />
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 bg-tpq-yellow/20 rounded-xl flex items-center justify-center">
                <span className="text-sm">📝</span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Belum Ada Catatan</h3>
            <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
              Santri ini belum memiliki riwayat penilaian ngaji yang tercatat dalam sistem.
            </p>
          </div>
        )}

        {/* ── Timeline Cards ──────────────────────────────────────────────── */}
        {!loading && !error && dataNilai.length > 0 && (
          <section>
            {/* Section header */}
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 bg-tpq-green/10 rounded-xl">
                <CalendarIcon className="w-4.5 h-4.5 text-tpq-green" />
              </div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Riwayat Belajar</h2>
              <div className="flex-1 h-px bg-gray-100 ml-2" />
            </div>

            <div className="space-y-3 sm:space-y-4">
              {dataNilai.map((nilai) => {
                const meta = NILAI_META[nilai.penilaian] || {};
                const accentBorder = meta.accentBorder || 'border-l-gray-300';

                return (
                  <article
                    key={nilai.id}
                    className={`group bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border-l-4 ${accentBorder}`}
                  >
                    <div className="p-5 sm:p-6">
                      {/* Top row: date + badge */}
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2.5 text-gray-500">
                          <CalendarIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <time className="text-sm font-semibold text-gray-700 group-hover:text-tpq-green transition-colors">
                            {formatDisplayDate(nilai.tanggal, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          </time>
                        </div>
                        <div className="flex-shrink-0">
                          {getNilaiBadge(nilai.penilaian)}
                        </div>
                      </div>

                      {/* Materi */}
                      <div className="mb-1">
                        <h4 className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Materi</h4>
                        <p className="text-base sm:text-[17px] text-gray-800 leading-relaxed font-semibold">
                          {nilai.materi || <span className="text-gray-300 italic font-normal text-sm">Belum ada materi</span>}
                        </p>
                      </div>

                      {/* Catatan */}
                      {nilai.catatan && (
                        <div className="mt-4 bg-gradient-to-br from-blue-50 to-indigo-50/30 p-4 rounded-2xl border border-blue-100/60">
                          <h4 className="text-[10px] sm:text-[11px] font-bold text-blue-500/80 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <NoteIcon className="w-3.5 h-3.5" />
                            Catatan Ustadz/ah
                          </h4>
                          <p className="text-sm text-blue-900/80 leading-relaxed whitespace-pre-wrap">
                            {nilai.catatan}
                          </p>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default SantriNilaiPage;
