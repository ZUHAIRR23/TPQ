import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

const INITIAL_KELOMPOK_FORM = {
  namaKelompok: '',
  deskripsi: '',
  selectedSantriIds: [],
};

const getSupabaseErrorMessage = (error, tableName = 'kelompok') => {
  if (!error) return 'Terjadi kesalahan yang tidak diketahui.';

  if (error.code === 'PGRST205') {
    return `Tabel ${tableName} belum ada di database. Jalankan SQL setup terlebih dahulu.`;
  }

  if (error.code === '42501') {
    return `Akses ke tabel ${tableName} ditolak. Pastikan RLS policy sudah benar.`;
  }

  if (error.code === '23505' && tableName === 'kelompok') {
    return 'Nama kelompok sudah digunakan. Gunakan nama lain.';
  }

  return error.message || 'Terjadi kesalahan saat mengakses database.';
};

const formatDisplayDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const KelompokView = ({ user, onDataChanged, onOpenNilaiKelompok }) => {
  const [kelompokList, setKelompokList] = useState([]);
  const [selectedKelompokId, setSelectedKelompokId] = useState('');

  const [loadingKelompok, setLoadingKelompok] = useState(true);
  const [savingKelompok, setSavingKelompok] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSantriDropdownOpen, setIsSantriDropdownOpen] = useState(false);
  const [santriTanpaKelompok, setSantriTanpaKelompok] = useState([]);

  const [kelompokError, setKelompokError] = useState('');
  const [kelompokSuccess, setKelompokSuccess] = useState('');

  const [formKelompok, setFormKelompok] = useState(INITIAL_KELOMPOK_FORM);
  const selectedKelompok = useMemo(
    () => kelompokList.find((item) => item.id === selectedKelompokId) || null,
    [kelompokList, selectedKelompokId],
  );

  const fetchKelompok = async (userId) => {
    if (!userId) {
      setKelompokList([]);
      setSelectedKelompokId('');
      setLoadingKelompok(false);
      setKelompokError('');
      return;
    }

    setLoadingKelompok(true);
    setKelompokError('');

    try {
      const { data, error } = await supabase
        .from('kelompok')
        .select('id, nama_kelompok, deskripsi, created_at')
        .eq('created_by', userId)
        .order('nama_kelompok', { ascending: true });

      if (error) throw error;

      const nextKelompok = data || [];
      setKelompokList(nextKelompok);
      setSelectedKelompokId((prev) => {
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

  useEffect(() => {
    fetchKelompok(user?.id || '');
  }, [user?.id]);

  useEffect(() => {
    const fetchSantri = async () => {
      if (!user?.id || !isFormVisible) return;
      try {
        const { data, error } = await supabase
          .from('santri')
          .select('id, nama_lengkap')
          .eq('created_by', user.id)
          .is('kelompok_id', null)
          .neq('status', 'Nonaktif')
          .order('nama_lengkap', { ascending: true });

        if (error) throw error;
        setSantriTanpaKelompok(data || []);
      } catch (error) {
        console.error('Error fetching santri:', error);
      }
    };
    fetchSantri();

    if (!isFormVisible) {
      setIsSantriDropdownOpen(false);
    }
  }, [user?.id, isFormVisible]);

  useEffect(() => {
    if (!kelompokSuccess) return undefined;
    const timer = setTimeout(() => setKelompokSuccess(''), 3500);
    return () => clearTimeout(timer);
  }, [kelompokSuccess]);

  const handleKelompokFormChange = (field, value) => {
    setFormKelompok((prev) => ({ ...prev, [field]: value }));
  };

  const handleTambahKelompok = async (event) => {
    event.preventDefault();

    if (!user?.id) {
      setKelompokError('Anda harus login untuk menambahkan kelompok.');
      return;
    }

    const namaKelompok = formKelompok.namaKelompok.trim();
    if (!namaKelompok) {
      setKelompokError('Nama kelompok wajib diisi.');
      return;
    }

    setSavingKelompok(true);
    setKelompokError('');
    setKelompokSuccess('');

    try {
      const { data: insertedData, error } = await supabase.from('kelompok').insert({
        created_by: user.id,
        nama_kelompok: namaKelompok,
        deskripsi: formKelompok.deskripsi.trim() || null,
      }).select();

      if (error) throw error;

      const newKelompok = insertedData?.[0];

      if (newKelompok && formKelompok.selectedSantriIds?.length > 0) {
        const { error: santriError } = await supabase
          .from('santri')
          .update({ kelompok_id: newKelompok.id })
          .in('id', formKelompok.selectedSantriIds)
          .eq('created_by', user.id);

        if (santriError) throw santriError;
      }

      setKelompokSuccess(`Kelompok ${namaKelompok} berhasil ditambahkan.`);
      setFormKelompok(INITIAL_KELOMPOK_FORM);
      setIsFormVisible(false);
      await fetchKelompok(user.id);

      if (onDataChanged) {
        await onDataChanged();
      }
    } catch (error) {
      setKelompokError(getSupabaseErrorMessage(error, 'kelompok'));
    } finally {
      setSavingKelompok(false);
    }
  };

  return (
    <div className="space-y-6 animate-modal-slide">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">Kelompok Halaqah</h2>
          <p className="text-sm text-gray-500 mt-1">Kelola kelompok santri untuk memudahkan input nilai.</p>
        </div>
        {!isFormVisible && (
          <button
            onClick={() => setIsFormVisible(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-tpq-green text-white text-sm font-semibold hover:bg-emerald-600 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Baru
          </button>
        )}
      </div>

      {isFormVisible && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/50 p-6 space-y-4 animate-modal-slide">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Form Tambah Kelompok</h3>
            <button
              onClick={() => setIsFormVisible(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleTambahKelompok} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Nama Kelompok</label>
                <input
                  type="text"
                  value={formKelompok.namaKelompok}
                  onChange={(event) => handleKelompokFormChange('namaKelompok', event.target.value)}
                  disabled={savingKelompok}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tpq-green/20 focus:border-tpq-green shadow-sm transition-all duration-200 hover:border-gray-300 disabled:opacity-60"
                  placeholder="Contoh: Jilid 2"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Deskripsi (Opsional)</label>
                <input
                  type="text"
                  value={formKelompok.deskripsi}
                  onChange={(event) => handleKelompokFormChange('deskripsi', event.target.value)}
                  disabled={savingKelompok}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tpq-green/20 focus:border-tpq-green shadow-sm transition-all duration-200 hover:border-gray-300 disabled:opacity-60"
                  placeholder="Penjelasan singkat kelompok ini"
                />
              </div>
            </div>

            <div className="space-y-1.5 relative">
              <label className="text-sm font-semibold text-gray-700">Pilih Santri</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSantriDropdownOpen(!isSantriDropdownOpen)}
                  disabled={savingKelompok}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-tpq-green/20 focus:border-tpq-green shadow-sm hover:border-gray-300 disabled:opacity-60"
                >
                  <span className={formKelompok.selectedSantriIds.length > 0 ? "text-gray-900" : "text-gray-400"}>
                    {formKelompok.selectedSantriIds.length > 0
                      ? `${formKelompok.selectedSantriIds.length} Santri dipilih`
                      : 'Pilih santri yang belum memiliki kelompok'}
                  </span>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${isSantriDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isSantriDropdownOpen && (
                  <div className="absolute z-10 top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                    <div className="p-2 space-y-1">
                      {santriTanpaKelompok.length === 0 ? (
                        <div className="px-3 py-4 text-center text-sm text-gray-500">
                          Tidak ada santri yang tersedia.
                        </div>
                      ) : (
                        santriTanpaKelompok.map((santri) => (
                          <label key={santri.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors group">
                            <input
                              type="checkbox"
                              checked={formKelompok.selectedSantriIds.includes(santri.id)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                handleKelompokFormChange(
                                  'selectedSantriIds',
                                  checked
                                    ? [...formKelompok.selectedSantriIds, santri.id]
                                    : formKelompok.selectedSantriIds.filter(id => id !== santri.id)
                                );
                              }}
                              className="w-4 h-4 rounded text-tpq-green border-gray-300 focus:ring-tpq-green cursor-pointer"
                            />
                            <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-900">{santri.nama_lengkap}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {kelompokError && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">{kelompokError}</div>
            )}
            {kelompokSuccess && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-medium">{kelompokSuccess}</div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsFormVisible(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-all font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingKelompok}
                className="px-6 py-2.5 rounded-xl bg-tpq-green text-white text-sm font-bold hover:bg-emerald-600 shadow-md hover:shadow-lg hover:shadow-tpq-green/20 disabled:opacity-60 transition-all duration-200"
              >
                {savingKelompok ? 'Menyimpan...' : 'Simpan Kelompok'}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <section className={`lg:col-span-7 xl:col-span-8 flex flex-col gap-4 ${isFormVisible ? 'opacity-50 pointer-events-none' : ''} transition-opacity duration-300`}>
          {loadingKelompok && (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tpq-green"></div>
            </div>
          )}

          {!loadingKelompok && kelompokList.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-gray-100 shadow-sm text-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Belum Ada Kelompok</h3>
              <p className="text-sm text-gray-500 mb-4 max-w-sm">Anda belum menambahkan kelompok. Silakan tambahkan kelompok pertama Anda untuk mulai mengelola.</p>
              <button
                onClick={() => setIsFormVisible(true)}
                className="px-5 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                Buat Kelompok Baru
              </button>
            </div>
          )}

          {!loadingKelompok && kelompokList.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              {kelompokList.map((kelompok) => (
                <button
                  key={kelompok.id}
                  type="button"
                  onClick={() => setSelectedKelompokId(kelompok.id)}
                  className={`text-left rounded-2xl border p-5 transition-all duration-300 relative overflow-hidden group
                    ${selectedKelompokId === kelompok.id
                      ? 'border-tpq-green bg-gradient-to-br from-emerald-50 to-white shadow-md shadow-tpq-green/10'
                      : 'border-gray-200 bg-white hover:border-tpq-green/40 hover:shadow-sm'
                    }`}
                >
                  {selectedKelompokId === kelompok.id && (
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-tpq-green rounded-l-2xl"></div>
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-bold ${selectedKelompokId === kelompok.id ? 'text-gray-900' : 'text-gray-800'}`}>
                      {kelompok.nama_kelompok}
                    </h3>
                    {selectedKelompokId === kelompok.id && (
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2">{kelompok.deskripsi || 'Tanpa deskripsi'}</p>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className={`lg:col-span-5 xl:col-span-4 sticky top-6 transition-opacity duration-300 ${isFormVisible ? 'opacity-50 pointer-events-none' : ''}`}>
          {!loadingKelompok && !selectedKelompok && kelompokList.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 border-dashed rounded-3xl p-8 flex flex-col items-center text-center">
              <div className="text-gray-300 mb-3">
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500">Pilih salah satu kelompok dari daftar di samping untuk melihat detailnya.</p>
            </div>
          )}

          {selectedKelompok && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/60 overflow-hidden group hover:border-tpq-green/30 transition-colors duration-300">
              <div className="h-24 bg-gradient-to-r from-tpq-green to-emerald-400 p-6 flex items-end relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-20">
                  <svg className="w-32 h-32 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                </div>
              </div>

              <div className="p-6 relative">
                <div className="absolute -top-10 left-6">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border-4 border-white flex items-center justify-center text-tpq-green font-bold text-xl overflow-hidden box-border">
                    {selectedKelompok.nama_kelompok.substring(0, 2).toUpperCase()}
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-tpq-green transition-colors">{selectedKelompok.nama_kelompok}</h3>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">{selectedKelompok.deskripsi || 'Tidak ada deskripsi tambahan.'}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 border border-gray-100">
                    <div className="bg-white p-2 rounded-lg text-gray-400 shadow-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Tanggal Dibuat</p>
                      <p className="text-sm font-semibold text-gray-700">{formatDisplayDate(selectedKelompok.created_at)}</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => onOpenNilaiKelompok?.(selectedKelompok.id)}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-all duration-300 shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <span>Input Nilai Halaqah Ini</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default KelompokView;
