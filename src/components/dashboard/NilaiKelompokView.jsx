import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

const getTodayDateInputValue = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const INITIAL_NILAI_FORM = {
  santriId: '',
  tanggal: getTodayDateInputValue(),
  penilaian: 'L',
  materi: '',
  catatan: '',
};

const getSupabaseErrorMessage = (error, tableName = 'nilai_ngaji') => {
  if (!error) return 'Terjadi kesalahan yang tidak diketahui.';

  if (error.code === 'PGRST205') {
    return `Tabel ${tableName} belum ada di database. Jalankan SQL setup terlebih dahulu.`;
  }

  if (error.code === '42501') {
    return `Akses ke tabel ${tableName} ditolak. Pastikan RLS policy sudah benar.`;
  }

  if (error.code === '23505' && tableName === 'nilai_ngaji') {
    return 'Nilai santri pada tanggal tersebut sudah tercatat.';
  }

  return error.message || 'Terjadi kesalahan saat mengakses database.';
};

const NilaiKelompokView = ({ user, onDataChanged, preselectedKelompokId = '' }) => {
  const [kelompokList, setKelompokList] = useState([]);
  const [selectedKelompokId, setSelectedKelompokId] = useState('');
  const [anggotaKelompok, setAnggotaKelompok] = useState([]);

  const [loadingKelompok, setLoadingKelompok] = useState(true);
  const [loadingAnggota, setLoadingAnggota] = useState(false);
  const [savingNilai, setSavingNilai] = useState(false);

  const [kelompokError, setKelompokError] = useState('');
  const [anggotaError, setAnggotaError] = useState('');
  const [nilaiError, setNilaiError] = useState('');
  const [nilaiSuccess, setNilaiSuccess] = useState('');

  const [formNilai, setFormNilai] = useState(INITIAL_NILAI_FORM);

  const selectedKelompok = useMemo(
    () => kelompokList.find((item) => item.id === selectedKelompokId) || null,
    [kelompokList, selectedKelompokId],
  );

  const fetchKelompok = async (userId) => {
    if (!userId) {
      setKelompokList([]);
      setSelectedKelompokId('');
      setKelompokError('');
      setLoadingKelompok(false);
      return;
    }

    setLoadingKelompok(true);
    setKelompokError('');

    try {
      const { data, error } = await supabase
        .from('kelompok')
        .select('id, nama_kelompok, deskripsi')
        .eq('created_by', userId)
        .order('nama_kelompok', { ascending: true });

      if (error) throw error;

      const nextKelompok = data || [];
      setKelompokList(nextKelompok);
      setSelectedKelompokId((prev) => {
        if (preselectedKelompokId && nextKelompok.some((item) => item.id === preselectedKelompokId)) {
          return preselectedKelompokId;
        }
        if (prev && nextKelompok.some((item) => item.id === prev)) {
          return prev;
        }
        return nextKelompok[0]?.id || '';
      });
    } catch (error) {
      setKelompokList([]);
      setSelectedKelompokId('');
      setKelompokError(getSupabaseErrorMessage(error, 'kelompok'));
    } finally {
      setLoadingKelompok(false);
    }
  };

  const fetchAnggotaKelompok = async (kelompokId) => {
    if (!user?.id || !kelompokId) {
      setAnggotaKelompok([]);
      setLoadingAnggota(false);
      setAnggotaError('');
      return;
    }

    setLoadingAnggota(true);
    setAnggotaError('');

    try {
      const { data, error } = await supabase
        .from('santri')
        .select('id, nama_lengkap, kelompok_id')
        .eq('created_by', user.id)
        .eq('status', 'Aktif')
        .eq('kelompok_id', kelompokId)
        .order('nama_lengkap', { ascending: true });

      if (error) throw error;
      setAnggotaKelompok(data || []);
    } catch (error) {
      setAnggotaKelompok([]);
      setAnggotaError(getSupabaseErrorMessage(error, 'santri'));
    } finally {
      setLoadingAnggota(false);
    }
  };

  useEffect(() => {
    fetchKelompok(user?.id || '');
  }, [user?.id, preselectedKelompokId]);

  useEffect(() => {
    if (!preselectedKelompokId) return;
    if (!kelompokList.some((item) => item.id === preselectedKelompokId)) return;
    setSelectedKelompokId(preselectedKelompokId);
  }, [kelompokList, preselectedKelompokId]);

  useEffect(() => {
    fetchAnggotaKelompok(selectedKelompokId);
  }, [selectedKelompokId, user?.id]);

  useEffect(() => {
    if (!nilaiSuccess) return undefined;
    const timer = setTimeout(() => setNilaiSuccess(''), 3500);
    return () => clearTimeout(timer);
  }, [nilaiSuccess]);

  // Disable auto-select of santri so user has to explicitly click a pill
  useEffect(() => {
    setFormNilai((prev) => {
      // If we change kelompok, the previously selected santri might not be there anymore
      // We explicitly clear the selection to force user to choose from step 2
      if (!prev.santriId || !anggotaKelompok.some((santri) => santri.id === prev.santriId)) {
        return { ...prev, santriId: '' };
      }
      return prev;
    });
  }, [anggotaKelompok]);

  const handleNilaiFormChange = (field, value) => {
    setFormNilai((prev) => ({ ...prev, [field]: value }));
  };

  const handleSimpanNilai = async (event) => {
    event.preventDefault();

    if (!user?.id) {
      setNilaiError('Anda harus login untuk menambahkan nilai.');
      return;
    }

    if (!selectedKelompokId) {
      setNilaiError('Pilih kelompok terlebih dahulu.');
      return;
    }

    const santriId = formNilai.santriId;
    const tanggal = formNilai.tanggal || getTodayDateInputValue();
    const penilaian = formNilai.penilaian;

    if (!santriId || !tanggal || !penilaian) {
      setNilaiError('Santri, tanggal, dan nilai wajib diisi.');
      return;
    }

    setSavingNilai(true);
    setNilaiError('');
    setNilaiSuccess('');

    try {
      const { data: anggotaSantri, error: cekError } = await supabase
        .from('santri')
        .select('id, nama_lengkap')
        .eq('id', santriId)
        .eq('created_by', user.id)
        .eq('status', 'Aktif')
        .eq('kelompok_id', selectedKelompokId)
        .maybeSingle();

      if (cekError) throw cekError;

      if (!anggotaSantri) {
        setNilaiError('Santri bukan anggota kelompok terpilih atau sudah berpindah kelompok.');
        return;
      }

      const payload = {
        created_by: user.id,
        santri_id: santriId,
        tanggal,
        penilaian,
        materi: formNilai.materi.trim() || null,
        catatan: formNilai.catatan.trim() || null,
      };

      const { error } = await supabase.from('nilai_ngaji').insert(payload);
      if (error) throw error;

      setNilaiSuccess(`Nilai ${anggotaSantri.nama_lengkap} berhasil disimpan.`);
      setFormNilai((prev) => ({
        ...INITIAL_NILAI_FORM,
        tanggal: getTodayDateInputValue(),
        santriId: '', // Reset santri selection back to choose next santri
      }));

      if (onDataChanged) {
        await onDataChanged();
      }
    } catch (error) {
      setNilaiError(getSupabaseErrorMessage(error, 'nilai_ngaji'));
    } finally {
      setSavingNilai(false);
    }
  };

  return (
    <div className="space-y-6 animate-modal-slide max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">Input Nilai Kelompok</h2>
        <p className="text-sm text-gray-500 mt-1">Lakukan evaluasi bacaan santri secara cepat, terstruktur, dan mudah.</p>
      </div>

      <div className="grid gap-6">
        {/* LANGKAH 1 */}
        <section className={`bg-white rounded-2xl border ${selectedKelompokId ? 'border-gray-200' : 'border-tpq-green shadow-md shadow-tpq-green/5 ring-1 ring-tpq-green/20'} overflow-hidden transition-all duration-300`}>
          <div className="bg-gray-50/50 px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-3">
              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${selectedKelompokId ? 'bg-gray-200 text-gray-600' : 'bg-tpq-green text-white'}`}>1</span>
              Pilih Kelompok Halaqah
            </h3>
            {selectedKelompokId && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Telah Dipilih
              </div>
            )}
          </div>
          <div className="p-5">
            {kelompokError && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium mb-3">{kelompokError}</div>
            )}
            <select
              value={selectedKelompokId}
              onChange={(event) => setSelectedKelompokId(event.target.value)}
              disabled={loadingKelompok || kelompokList.length === 0}
              className="w-full sm:w-2/3 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tpq-green/20 focus:border-tpq-green transition-all duration-200 hover:border-gray-300 disabled:opacity-60 bg-gray-50/30"
            >
              {kelompokList.length === 0 && <option value="">Belum ada kelompok tersimpan</option>}
              {kelompokList.length > 0 && (
                <>
                  <option value="" disabled>-- Klik untuk memilih kelompok --</option>
                  {kelompokList.map((kelompok) => (
                    <option key={kelompok.id} value={kelompok.id}>{kelompok.nama_kelompok} {kelompok.deskripsi ? `(${kelompok.deskripsi})` : ''}</option>
                  ))}
                </>
              )}
            </select>
          </div>
        </section>

        {/* LANGKAH 2 */}
        <div className={`transition-all duration-500 ease-in-out ${selectedKelompokId ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 pointer-events-none'}`}>
          <section className={`bg-white rounded-2xl border ${!formNilai.santriId && selectedKelompokId ? 'border-tpq-green shadow-md shadow-tpq-green/5 ring-1 ring-tpq-green/20' : 'border-gray-200'} overflow-hidden transition-all duration-300`}>
            <div className="bg-gray-50/50 px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-3">
                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${!formNilai.santriId && selectedKelompokId ? 'bg-tpq-green text-white' : 'bg-gray-200 text-gray-600'}`}>2</span>
                Pilih Santri yang Akan Dinilai
              </h3>
              {formNilai.santriId && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Telah Dipilih
                </div>
              )}
            </div>
            <div className="p-5">
              {anggotaError && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 mb-3">{anggotaError}</div>
              )}

              {loadingAnggota && (
                <div className="flex items-center gap-3 text-sm text-gray-500 py-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-tpq-green"></div>
                  Memuat anggota kelompok...
                </div>
              )}

              {!loadingAnggota && anggotaKelompok.length === 0 && selectedKelompokId && (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-center">
                  <p className="text-sm font-medium text-gray-600">Belum ada santri aktif di kelompok ini.</p>
                  <p className="text-xs text-gray-400 mt-1">Tambahkan santri ke kelompok melalui menu Data Santri.</p>
                </div>
              )}

              {!loadingAnggota && anggotaKelompok.length > 0 && (
                <div className="flex flex-wrap gap-2.5">
                  {anggotaKelompok.map((santri) => {
                    const isSelected = formNilai.santriId === santri.id;
                    return (
                      <button
                        key={santri.id}
                        type="button"
                        onClick={() => handleNilaiFormChange('santriId', santri.id)}
                        className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 flex items-center gap-2
                          ${isSelected
                            ? 'bg-tpq-green border-tpq-green text-white shadow-md shadow-tpq-green/20 scale-105'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-tpq-green hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                      >
                        {isSelected && (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {santri.nama_lengkap}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* LANGKAH 3 */}
        <div className={`transition-all duration-500 ease-in-out ${formNilai.santriId ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 pointer-events-none'}`}>
          <section className="bg-white rounded-2xl border-t-4 border-t-tpq-green border-x-gray-200 border-b-gray-200 shadow-lg shadow-tpq-green/5 overflow-hidden">
            <div className="bg-gray-50/50 px-5 py-3.5 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-tpq-green text-white text-xs font-bold">3</span>
                Masukkan Detail Penilaian
              </h3>
            </div>

            <form onSubmit={handleSimpanNilai} className="p-5 space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Tanggal Pertemuan</label>
                  <input
                    type="date"
                    value={formNilai.tanggal}
                    onChange={(event) => handleNilaiFormChange('tanggal', event.target.value)}
                    disabled={savingNilai}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tpq-green/20 focus:border-tpq-green bg-gray-50/30 transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Pilih Nilai Bacaan</label>
                  <div className="relative">
                    <select
                      value={formNilai.penilaian}
                      onChange={(event) => handleNilaiFormChange('penilaian', event.target.value)}
                      disabled={savingNilai}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-tpq-green/20 focus:border-tpq-green bg-gray-50/30 appearance-none transition-all"
                      required
                    >
                      <option value="L">🟢 L - Lancar (Lulus/Melanjutkan)</option>
                      <option value="KL">🟡 KL - Kurang Lancar (Perlu Banyak Latihan)</option>
                      <option value="TL">🔴 TL - Tidak Lancar (Wajib Mengulang)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Materi / Halaman yang Dibaca</label>
                <input
                  type="text"
                  value={formNilai.materi}
                  onChange={(event) => handleNilaiFormChange('materi', event.target.value)}
                  disabled={savingNilai}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tpq-green/20 focus:border-tpq-green bg-gray-50/30 transition-all"
                  placeholder="Contoh: Jilid 3 Hal. 12-14 atau Surah Al-Baqarah ayat 1-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Catatan Evaluasi (Ikhtisar)</label>
                <textarea
                  value={formNilai.catatan}
                  onChange={(event) => handleNilaiFormChange('catatan', event.target.value)}
                  disabled={savingNilai}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm min-h-[96px] resize-none focus:outline-none focus:ring-2 focus:ring-tpq-green/20 focus:border-tpq-green bg-gray-50/30 transition-all"
                  placeholder="Contoh: Panjang pendek (Mad) masih sering keliru, perbanyak latihan di rumah."
                />
              </div>

              {nilaiError && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {nilaiError}
                </div>
              )}
              {nilaiSuccess && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-medium flex items-start gap-2 animate-bounce-short">
                  <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {nilaiSuccess}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingNilai || anggotaKelompok.length === 0 || !selectedKelompokId || !formNilai.santriId}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-tpq-green text-white text-sm font-bold tracking-wide hover:bg-emerald-600 disabled:opacity-60 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex justify-center items-center gap-2"
                >
                  {savingNilai ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Menyimpan Data...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Simpan Nilai Santri
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default NilaiKelompokView;
