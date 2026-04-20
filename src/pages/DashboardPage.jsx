import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import DataSantriView from '../components/dashboard/DataSantriView';
import AbsensiView from '../components/dashboard/AbsensiView';
import NilaiView from '../components/dashboard/NilaiView';
import KelompokView from '../components/dashboard/KelompokView';
import NilaiKelompokView from '../components/dashboard/NilaiKelompokView';

const INITIAL_SANTRI_FORM = {
  namaLengkap: '',
  jenisKelamin: '',
  tanggalLahir: '',
  namaWali: '',
  noHp: '',
  alamat: '',
  catatan: '',
};

const INITIAL_ABSENSI_FORM = {
  tanggal: '',
  catatan: '',
};

const INITIAL_NILAI_FORM = {
  santriId: '',
  tanggal: '',
  penilaian: 'L',
  materi: '',
  catatan: '',
};

const getSupabaseErrorMessage = (error, tableName = 'santri') => {
  if (!error) return 'Terjadi kesalahan yang tidak diketahui.';
  if (error.code === 'PGRST205') {
    return `Tabel ${tableName} belum ada di database. Jalankan SQL setup terlebih dahulu.`;
  }
  if (error.code === '42501') {
    return `Akses ke tabel ${tableName} ditolak. Pastikan RLS policy sudah benar.`;
  }
  if (error.code === '23505' && tableName === 'absensi') {
    return 'Absensi untuk santri ini pada tanggal tersebut sudah tercatat.';
  }
  if (error.code === '23505' && tableName === 'nilai_ngaji') {
    return 'Nilai ngaji untuk santri ini pada tanggal tersebut sudah tercatat.';
  }
  return error.message || 'Terjadi kesalahan saat mengakses database.';
};

const formatDisplayDate = (value, options = {}) => {
  if (!value) return '-';
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', options);
};

const getTodayDateInputValue = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const buildAbsensiChecklistState = (santriList, existingAbsensi = []) => {
  const existingBySantriId = existingAbsensi.reduce((acc, item) => {
    acc[item.santri_id] = item.status;
    return acc;
  }, {});

  return santriList.reduce((acc, santri) => {
    const existingStatus = existingBySantriId[santri.id];
    if (existingStatus === 'Hadir') {
      acc[santri.id] = 'Hadir';
    } else if (existingStatus) {
      acc[santri.id] = 'Tidak Hadir';
    } else {
      acc[santri.id] = '';
    }
    return acc;
  }, {});
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [signingOut, setSigningOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [selectedKelompokIdForNilai, setSelectedKelompokIdForNilai] = useState('');

  const [totalSantri, setTotalSantri] = useState(0);
  const [latestSantri, setLatestSantri] = useState([]);
  const [loadingSantri, setLoadingSantri] = useState(true);
  const [santriError, setSantriError] = useState('');
  const [kehadiranHariIni, setKehadiranHariIni] = useState(0);
  const [loadingKehadiran, setLoadingKehadiran] = useState(true);
  const [absensiError, setAbsensiError] = useState('');
  const [nilaiHariIni, setNilaiHariIni] = useState(0);
  const [loadingNilaiHariIni, setLoadingNilaiHariIni] = useState(true);
  const [nilaiError, setNilaiError] = useState('');

  const [showAddSantriModal, setShowAddSantriModal] = useState(false);
  const [savingSantri, setSavingSantri] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [formSantri, setFormSantri] = useState(INITIAL_SANTRI_FORM);
  const [showAddAbsensiModal, setShowAddAbsensiModal] = useState(false);
  const [savingAbsensi, setSavingAbsensi] = useState(false);
  const [saveAbsensiError, setSaveAbsensiError] = useState('');
  const [saveAbsensiSuccess, setSaveAbsensiSuccess] = useState('');
  const [formAbsensi, setFormAbsensi] = useState({
    ...INITIAL_ABSENSI_FORM,
    tanggal: getTodayDateInputValue(),
  });
  const [absensiChecklist, setAbsensiChecklist] = useState({});
  const [absensiSearchQuery, setAbsensiSearchQuery] = useState('');
  const [selectedAbsensiKelompokId, setSelectedAbsensiKelompokId] = useState('');
  const [showAddNilaiModal, setShowAddNilaiModal] = useState(false);
  const [savingNilai, setSavingNilai] = useState(false);
  const [saveNilaiError, setSaveNilaiError] = useState('');
  const [saveNilaiSuccess, setSaveNilaiSuccess] = useState('');
  const [formNilai, setFormNilai] = useState({
    ...INITIAL_NILAI_FORM,
    tanggal: getTodayDateInputValue(),
  });
  const [santriOptions, setSantriOptions] = useState([]);
  const [loadingSantriOptions, setLoadingSantriOptions] = useState(false);

  const [pageNotice, setPageNotice] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!pageNotice) return undefined;

    const timer = setTimeout(() => {
      setPageNotice('');
    }, 4000);

    return () => clearTimeout(timer);
  }, [pageNotice]);

  const fetchSantri = async (userId) => {
    if (!userId) {
      setTotalSantri(0);
      setLatestSantri([]);
      setLoadingSantri(false);
      setSantriError('');
      return;
    }

    setLoadingSantri(true);
    setSantriError('');

    try {
      const latestQuery = supabase
        .from('santri')
        .select('id, nama_lengkap, jenis_kelamin, nama_wali, created_at')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      const totalQuery = supabase
        .from('santri')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', userId);

      const [
        { data: latestData, error: latestError },
        { count, error: totalError },
      ] = await Promise.all([latestQuery, totalQuery]);

      if (latestError) {
        throw latestError;
      }

      if (totalError) {
        throw totalError;
      }

      setLatestSantri(latestData || []);
      setTotalSantri(count || 0);
    } catch (error) {
      setLatestSantri([]);
      setTotalSantri(0);
      setSantriError(getSupabaseErrorMessage(error));
    } finally {
      setLoadingSantri(false);
    }
  };

  const fetchKehadiranHariIni = async (userId) => {
    if (!userId) {
      setKehadiranHariIni(0);
      setLoadingKehadiran(false);
      setAbsensiError('');
      return;
    }

    setLoadingKehadiran(true);
    setAbsensiError('');

    try {
      const { count, error } = await supabase
        .from('absensi')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', userId)
        .eq('tanggal', getTodayDateInputValue())
        .eq('status', 'Hadir');

      if (error) throw error;
      setKehadiranHariIni(count || 0);
    } catch (error) {
      setKehadiranHariIni(0);
      setAbsensiError(getSupabaseErrorMessage(error, 'absensi'));
    } finally {
      setLoadingKehadiran(false);
    }
  };

  const fetchNilaiHariIni = async (userId) => {
    if (!userId) {
      setNilaiHariIni(0);
      setLoadingNilaiHariIni(false);
      setNilaiError('');
      return;
    }

    setLoadingNilaiHariIni(true);
    setNilaiError('');

    try {
      const { count, error } = await supabase
        .from('nilai_ngaji')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', userId)
        .eq('tanggal', getTodayDateInputValue());

      if (error) throw error;
      setNilaiHariIni(count || 0);
    } catch (error) {
      setNilaiHariIni(0);
      setNilaiError(getSupabaseErrorMessage(error, 'nilai_ngaji'));
    } finally {
      setLoadingNilaiHariIni(false);
    }
  };

  const fetchSantriOptions = async (userId, onError) => {
    if (!userId) {
      setSantriOptions([]);
      return [];
    }

    setLoadingSantriOptions(true);

    try {
      const { data, error } = await supabase
        .from('santri')
        .select('id, nama_lengkap, kelompok_id, kelompok:kelompok_id ( id, nama_kelompok )')
        .eq('created_by', userId)
        .eq('status', 'Aktif')
        .order('nama_lengkap', { ascending: true });

      if (error) throw error;

      const options = data || [];
      setSantriOptions(options);
      return options;
    } catch (error) {
      const message = getSupabaseErrorMessage(error, 'santri');
      setSantriOptions([]);
      if (onError) {
        onError(message);
      } else {
        setSaveAbsensiError(message);
      }
      return [];
    } finally {
      setLoadingSantriOptions(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchSantri(user.id);
      fetchKehadiranHariIni(user.id);
      fetchNilaiHariIni(user.id);
    } else {
      setLoadingSantri(false);
      setLoadingKehadiran(false);
      setLoadingNilaiHariIni(false);
      setKehadiranHariIni(0);
      setNilaiHariIni(0);
      setAbsensiError('');
      setNilaiError('');
      setSantriOptions([]);
    }
  }, [user?.id]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    navigate('/auth', { replace: true });
  };

  const openAddSantriModal = () => {
    setShowAddSantriModal(true);
    setSaveError('');
    setSaveSuccess('');
  };

  const closeAddSantriModal = () => {
    if (savingSantri) return;

    setShowAddSantriModal(false);
    setSaveError('');
    setSaveSuccess('');
    setFormSantri(INITIAL_SANTRI_FORM);
  };

  const handleFormChange = (field, value) => {
    setFormSantri((prev) => ({ ...prev, [field]: value }));
  };

  const openAddAbsensiModal = async () => {
    if (!user?.id) {
      setPageNotice('Anda harus login untuk mencatat absensi.');
      return;
    }

    setShowAddAbsensiModal(true);
    setSaveAbsensiError('');
    setSaveAbsensiSuccess('');
    setAbsensiSearchQuery('');
    setSelectedAbsensiKelompokId('');

    const options = await fetchSantriOptions(user.id, setSaveAbsensiError);
    const tanggal = getTodayDateInputValue();

    let existingAbsensi = [];
    if (options.length > 0) {
      const { data, error } = await supabase
        .from('absensi')
        .select('santri_id, status')
        .eq('created_by', user.id)
        .eq('tanggal', tanggal)
        .in('santri_id', options.map((item) => item.id));

      if (error) {
        setSaveAbsensiError(getSupabaseErrorMessage(error, 'absensi'));
      } else {
        existingAbsensi = data || [];
      }
    }

    setFormAbsensi({
      ...INITIAL_ABSENSI_FORM,
      tanggal,
    });
    setAbsensiChecklist(buildAbsensiChecklistState(options, existingAbsensi));
  };

  const closeAddAbsensiModal = () => {
    if (savingAbsensi) return;

    setShowAddAbsensiModal(false);
    setSaveAbsensiError('');
    setSaveAbsensiSuccess('');
    setAbsensiSearchQuery('');
    setSelectedAbsensiKelompokId('');
    setFormAbsensi({
      ...INITIAL_ABSENSI_FORM,
      tanggal: getTodayDateInputValue(),
    });
    setAbsensiChecklist({});
  };

  const handleAbsensiFormChange = (field, value) => {
    setFormAbsensi((prev) => ({ ...prev, [field]: value }));
  };

  const handleAbsensiDateChange = async (value) => {
    const tanggal = value || getTodayDateInputValue();
    setFormAbsensi((prev) => ({ ...prev, tanggal }));
    setSaveAbsensiError('');

    if (!user?.id || santriOptions.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('absensi')
        .select('santri_id, status')
        .eq('created_by', user.id)
        .eq('tanggal', tanggal)
        .in('santri_id', santriOptions.map((item) => item.id));

      if (error) throw error;
      setAbsensiChecklist(buildAbsensiChecklistState(santriOptions, data || []));
    } catch (error) {
      setSaveAbsensiError(getSupabaseErrorMessage(error, 'absensi'));
      setAbsensiChecklist(buildAbsensiChecklistState(santriOptions, []));
    }
  };

  const handleAbsensiChecklistChange = (santriId, status) => {
    setAbsensiChecklist((prev) => ({
      ...prev,
      [santriId]: prev[santriId] === status ? '' : status,
    }));
  };

  const getTargetAbsensiSantri = () => (
    selectedAbsensiKelompokId
      ? santriOptions.filter((santri) => santri.kelompok_id === selectedAbsensiKelompokId)
      : santriOptions
  );

  const setAllAbsensiChecklist = (status) => {
    const targetSantri = getTargetAbsensiSantri();
    setAbsensiChecklist((prev) => {
      const nextState = { ...prev };
      targetSantri.forEach((santri) => {
        nextState[santri.id] = status;
      });
      return nextState;
    });
  };

  const openAddNilaiModal = async () => {
    if (!user?.id) {
      setPageNotice('Anda harus login untuk menginput nilai.');
      return;
    }

    setShowAddNilaiModal(true);
    setSaveNilaiError('');
    setSaveNilaiSuccess('');

    const options = await fetchSantriOptions(user.id, setSaveNilaiError);
    setFormNilai((prev) => ({
      ...prev,
      tanggal: getTodayDateInputValue(),
      santriId: prev.santriId && options.some((item) => item.id === prev.santriId)
        ? prev.santriId
        : (options[0]?.id || ''),
    }));
  };

  const closeAddNilaiModal = () => {
    if (savingNilai) return;

    setShowAddNilaiModal(false);
    setSaveNilaiError('');
    setSaveNilaiSuccess('');
    setFormNilai({
      ...INITIAL_NILAI_FORM,
      tanggal: getTodayDateInputValue(),
      santriId: santriOptions[0]?.id || '',
    });
  };

  const handleNilaiFormChange = (field, value) => {
    setFormNilai((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddSantri = async (event) => {
    event.preventDefault();

    if (!user?.id) {
      setSaveError('Anda harus login untuk menambahkan data santri.');
      return;
    }

    const namaLengkap = formSantri.namaLengkap.trim();
    const jenisKelamin = formSantri.jenisKelamin.trim();

    if (!namaLengkap || !jenisKelamin) {
      setSaveError('Nama lengkap dan jenis kelamin wajib diisi.');
      return;
    }

    setSavingSantri(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const payload = {
        created_by: user.id,
        nama_lengkap: namaLengkap,
        jenis_kelamin: jenisKelamin,
        tanggal_lahir: formSantri.tanggalLahir || null,
        nama_wali: formSantri.namaWali.trim() || null,
        no_hp: formSantri.noHp.trim() || null,
        alamat: formSantri.alamat.trim() || null,
        catatan: formSantri.catatan.trim() || null,
      };

      const { error } = await supabase.from('santri').insert(payload);
      if (error) throw error;

      setSaveSuccess('Santri berhasil ditambahkan.');
      setPageNotice(`Data ${namaLengkap} berhasil ditambahkan.`);
      await fetchSantri(user.id);

      setFormSantri(INITIAL_SANTRI_FORM);
      setShowAddSantriModal(false);
    } catch (error) {
      setSaveError(getSupabaseErrorMessage(error));
    } finally {
      setSavingSantri(false);
    }
  };

  const handleAddAbsensi = async (event) => {
    event.preventDefault();

    if (!user?.id) {
      setSaveAbsensiError('Anda harus login untuk menambahkan absensi.');
      return;
    }

    const tanggal = formAbsensi.tanggal || getTodayDateInputValue();
    const targetSantri = getTargetAbsensiSantri();
    const incompleteCount = targetSantri.filter((santri) => !absensiChecklist[santri.id]).length;

    if (!tanggal) {
      setSaveAbsensiError('Tanggal wajib diisi.');
      return;
    }

    if (targetSantri.length === 0) {
      setSaveAbsensiError(
        selectedAbsensiKelompokId
          ? 'Belum ada santri aktif pada kelompok yang dipilih.'
          : 'Belum ada santri aktif untuk dicatat absensinya.',
      );
      return;
    }

    if (incompleteCount > 0) {
      setSaveAbsensiError(`Masih ada ${incompleteCount} santri yang belum dipilih Hadir/Tidak Hadir.`);
      return;
    }

    setSavingAbsensi(true);
    setSaveAbsensiError('');
    setSaveAbsensiSuccess('');

    try {
      const payload = targetSantri.map((santri) => ({
        created_by: user.id,
        santri_id: santri.id,
        tanggal,
        status: absensiChecklist[santri.id] === 'Hadir' ? 'Hadir' : 'Alpa',
        catatan: formAbsensi.catatan.trim() || null,
      }));

      const { error } = await supabase
        .from('absensi')
        .upsert(payload, { onConflict: 'santri_id,tanggal' });
      if (error) throw error;

      const hadirCount = payload.filter((item) => item.status === 'Hadir').length;
      setSaveAbsensiSuccess('Absensi berhasil ditambahkan.');
      setPageNotice(`Absensi berhasil dicatat untuk ${payload.length} santri (${hadirCount} hadir).`);
      await fetchKehadiranHariIni(user.id);

      setFormAbsensi({
        ...INITIAL_ABSENSI_FORM,
        tanggal: getTodayDateInputValue(),
      });
      setShowAddAbsensiModal(false);
      setAbsensiChecklist({});
      setAbsensiSearchQuery('');
    } catch (error) {
      setSaveAbsensiError(getSupabaseErrorMessage(error, 'absensi'));
    } finally {
      setSavingAbsensi(false);
    }
  };

  const handleAddNilai = async (event) => {
    event.preventDefault();

    if (!user?.id) {
      setSaveNilaiError('Anda harus login untuk menambahkan nilai.');
      return;
    }

    const santriId = formNilai.santriId;
    const penilaian = formNilai.penilaian.trim();
    const tanggal = formNilai.tanggal || getTodayDateInputValue();

    if (!santriId || !penilaian || !tanggal) {
      setSaveNilaiError('Santri, tanggal, dan penilaian wajib diisi.');
      return;
    }

    setSavingNilai(true);
    setSaveNilaiError('');
    setSaveNilaiSuccess('');

    try {
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

      const namaSantri = santriOptions.find((item) => item.id === santriId)?.nama_lengkap || 'santri';
      setSaveNilaiSuccess('Nilai ngaji berhasil ditambahkan.');
      setPageNotice(`Nilai ngaji ${namaSantri} berhasil dicatat.`);

      await fetchNilaiHariIni(user.id);

      setFormNilai({
        ...INITIAL_NILAI_FORM,
        tanggal: getTodayDateInputValue(),
        santriId,
      });
      setShowAddNilaiModal(false);
    } catch (error) {
      setSaveNilaiError(getSupabaseErrorMessage(error, 'nilai_ngaji'));
    } finally {
      setSavingNilai(false);
    }
  };

  const handleSantriStatusChanged = async (updatedSantri) => {
    if (updatedSantri?.nama_lengkap && updatedSantri?.status) {
      setPageNotice(`Status ${updatedSantri.nama_lengkap} sekarang ${updatedSantri.status}.`);
    }

    if (!user?.id) return;

    await Promise.all([
      fetchSantri(user.id),
      fetchSantriOptions(user.id),
      fetchKehadiranHariIni(user.id),
    ]);
  };

  const handleKelompokDataChanged = async () => {
    if (!user?.id) return;

    await Promise.all([
      fetchSantri(user.id),
      fetchSantriOptions(user.id),
      fetchNilaiHariIni(user.id),
    ]);
  };

  const userName = user?.user_metadata?.full_name || 'Pengguna';
  const userEmail = user?.email || '-';
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const greeting = (() => {
    const h = currentTime.getHours();
    if (h < 11) return 'Assalamualaikum, Selamat Pagi';
    if (h < 15) return 'Assalamualaikum, Selamat Siang';
    if (h < 18) return 'Assalamualaikum, Selamat Sore';
    return 'Assalamualaikum, Selamat Malam';
  })();

  const formattedDate = currentTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const navItems = [
    {
      id: 'Dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
      label: 'Dashboard',
    },
    {
      id: 'Data Santri',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      label: 'Data Santri',
    },
    {
      id: 'Absensi',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 019 9v.375M10.125 2.25A3.375 3.375 0 0113.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 013.375 3.375M9 15l2.25 2.25L15 12" />
        </svg>
      ),
      label: 'Absensi',
    },
    {
      id: 'Nilai',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-1.64.484l1.241 5.385c.11.484-.42.871-.853.645L12 17.514a.563.563 0 00-.51 0l-4.836 2.988c-.433.226-.963-.16-.853-.645l1.24-5.385a.562.562 0 00-.164-.484L2.673 10.386c-.38-.325-.178-.948.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ),
      label: 'Nilai',
    },
    {
      id: 'Kelompok',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
      label: 'Kelompok',
    },
    {
      id: 'Nilai Kelompok',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
      label: 'Nilai Kelompok',
    },
  ].map((item) => ({ ...item, active: item.id === activeTab }));

  const stats = [
    {
      label: 'Total Santri',
      value: loadingSantri ? '...' : totalSantri,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      color: 'bg-blue-50 text-blue-600',
      border: 'border-blue-100',
    },
    {
      label: 'Kehadiran Hari Ini',
      value: loadingKehadiran ? '...' : kehadiranHariIni,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-emerald-50 text-emerald-600',
      border: 'border-emerald-100',
    },
    {
      label: 'Nilai Hari Ini',
      value: loadingNilaiHariIni ? '...' : nilaiHariIni,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      color: 'bg-amber-50 text-amber-600',
      border: 'border-amber-100',
    },
    {
      label: 'Status Akun',
      value: 'Aktif',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
      color: 'bg-tpq-green/5 text-tpq-green',
      border: 'border-tpq-green/10',
    },
  ];

  const canOpenAbsensiModal = !loadingSantri && totalSantri > 0 && !absensiError;
  const canOpenNilaiModal = !loadingSantri && totalSantri > 0 && !nilaiError;
  const absensiQuickActionDesc = absensiError
    ? 'Setup tabel absensi dulu'
    : (canOpenAbsensiModal ? 'Catat kehadiran santri' : (loadingSantri ? 'Memuat data santri...' : 'Tambah santri dulu'));
  const absensiKelompokOptions = useMemo(() => {
    const kelompokMap = new Map();
    santriOptions.forEach((santri) => {
      if (!santri.kelompok_id) return;
      if (kelompokMap.has(santri.kelompok_id)) return;
      kelompokMap.set(santri.kelompok_id, {
        id: santri.kelompok_id,
        nama_kelompok: santri.kelompok?.nama_kelompok || 'Kelompok tanpa nama',
      });
    });
    return Array.from(kelompokMap.values()).sort((a, b) => (
      a.nama_kelompok.localeCompare(b.nama_kelompok, 'id-ID')
    ));
  }, [santriOptions]);

  const targetAbsensiSantri = getTargetAbsensiSantri();
  const filteredSantriChecklist = targetAbsensiSantri.filter((santri) => (
    santri.nama_lengkap.toLowerCase().includes(absensiSearchQuery.toLowerCase())
  ));
  const totalChecklistHadir = targetAbsensiSantri.filter((santri) => absensiChecklist[santri.id] === 'Hadir').length;
  const totalChecklistTidakHadir = targetAbsensiSantri.filter((santri) => absensiChecklist[santri.id] === 'Tidak Hadir').length;
  const totalChecklistBelumDipilih = targetAbsensiSantri.length - totalChecklistHadir - totalChecklistTidakHadir;

  const quickActions = [
    {
      key: 'add-santri',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
        </svg>
      ),
      label: 'Tambah Santri',
      desc: 'Daftarkan santri baru',
      onClick: openAddSantriModal,
    },
    {
      key: 'add-absensi',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
        </svg>
      ),
      label: 'Catat Absensi',
      desc: absensiQuickActionDesc,
      onClick: openAddAbsensiModal,
      disabled: !canOpenAbsensiModal,
    },
    {
      key: 'halaqah',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
      label: 'Halaqah',
      desc: 'Buat halaqah baru dan lihat detail halaqah yang sudah ada',
      onClick: () => setActiveTab('Kelompok'),
      disabled: !user?.id,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/80 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-screen w-[260px] bg-tpq-green flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="px-6 pt-7 pb-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🕌</span>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">TPQ</h2>
              <p className="text-white/40 text-xs">Taman Pendidikan Al-Quran</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${item.active
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-4 pb-6 space-y-3">
          <div className="bg-white/10 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-tpq-yellow text-tpq-green flex items-center justify-center text-xs font-bold shrink-0">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-semibold truncate">{userName}</p>
              <p className="text-white/40 text-xs truncate">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-50 transition text-sm font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            {signingOut ? 'Keluar...' : 'Logout'}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/60">
          <div className="flex items-center justify-between px-5 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
                <p className="text-xs text-gray-400 hidden sm:block">{formattedDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-tpq-green hover:bg-tpq-green/5 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                Beranda
              </Link>
              <div className="w-9 h-9 rounded-full bg-tpq-green text-white flex items-center justify-center text-xs font-bold">
                {userInitials}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-5 lg:px-8 py-6 lg:py-8 space-y-6">
          {pageNotice && (
            <section className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-700">
              {pageNotice}
            </section>
          )}
          {absensiError && (
            <section className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700">
              {absensiError}
            </section>
          )}
          {nilaiError && (
            <section className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700">
              {nilaiError}
            </section>
          )}

          {activeTab === 'Data Santri' && (
            <DataSantriView
              user={user}
              onSantriStatusChanged={handleSantriStatusChanged}
              onKelompokAssigned={handleKelompokDataChanged}
              onOpenAddSantri={openAddSantriModal}
            />
          )}
          {activeTab === 'Absensi' && (
            <AbsensiView
              user={user}
              onOpenAddAbsensi={openAddAbsensiModal}
              canOpenAddAbsensi={canOpenAbsensiModal}
              addAbsensiHint={absensiQuickActionDesc}
            />
          )}
          {activeTab === 'Nilai' && <NilaiView user={user} />}
          {activeTab === 'Kelompok' && (
            <KelompokView
              user={user}
              onDataChanged={handleKelompokDataChanged}
              onOpenNilaiKelompok={(kelompokId) => {
                setSelectedKelompokIdForNilai(kelompokId || '');
                setActiveTab('Nilai Kelompok');
              }}
            />
          )}
          {activeTab === 'Nilai Kelompok' && (
            <NilaiKelompokView
              user={user}
              onDataChanged={handleKelompokDataChanged}
              preselectedKelompokId={selectedKelompokIdForNilai}
            />
          )}

          {activeTab === 'Dashboard' && (
            <>
              <section className="relative bg-gradient-to-br from-tpq-green via-tpq-green to-tpq-light rounded-2xl p-6 md:p-8 text-white overflow-hidden">
                <div className="absolute top-[-40px] right-[-40px] w-48 h-48 bg-white/5 rounded-full" />
                <div className="absolute bottom-[-30px] right-[60px] w-32 h-32 bg-white/5 rounded-full" />
                <div className="absolute top-[50%] right-[20%] w-20 h-20 bg-tpq-yellow/10 rounded-full blur-xl" />

                <div className="relative z-10">
                  <p className="text-tpq-yellow text-sm font-semibold mb-1">
                    {greeting} 👋
                  </p>
                  <h2 className="text-2xl md:text-3xl font-bold">{userName}</h2>
                  <p className="mt-2 text-white/60 text-sm max-w-lg">
                    Pantau perkembangan santri, kelola absensi, dan nilai hasil ngaji melalui dashboard ini.
                  </p>
                </div>
              </section>

              <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className={`bg-white rounded-2xl border ${stat.border} p-5 hover:shadow-md transition-shadow duration-300 group`}
                  >
                    <div className={`w-11 h-11 rounded-xl ${stat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                      {stat.icon}
                    </div>
                    <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                ))}
              </section>

              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Aksi Cepat
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      onClick={action.onClick}
                      disabled={action.disabled}
                      className={`relative overflow-hidden bg-white rounded-2xl border p-5 text-left transition-all duration-300 group flex flex-col ${action.disabled
                        ? 'border-gray-100/80 bg-gray-50/50 opacity-70 cursor-not-allowed'
                        : 'border-gray-100 hover:border-tpq-green/40 hover:shadow-xl hover:shadow-tpq-green/10 hover:-translate-y-1'
                        }`}
                    >
                      {!action.disabled && (
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-tpq-green/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 ease-out z-0 pointer-events-none" />
                      )}

                      <div className="relative z-10 flex flex-col h-full w-full">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${action.disabled ? 'bg-gray-200 grayscale' : 'bg-tpq-green/10 text-tpq-green shadow-sm'
                          }`}>
                          {action.icon}
                        </div>
                        <p className={`text-[15px] font-bold ${action.disabled ? 'text-gray-500' : 'text-gray-900 group-hover:text-tpq-green transition-colors duration-300'}`}>
                          {action.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed pr-6">
                          {action.desc}
                        </p>

                        {!action.disabled && (
                          <div className="absolute right-0 bottom-0 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-tpq-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <div className="grid lg:grid-cols-3 gap-5">
                <section className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold text-gray-900">Santri Terbaru</h3>
                    <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                      {loadingSantri ? 'Memuat...' : `${totalSantri} total`}
                    </span>
                  </div>

                  {loadingSantri && (
                    <div className="py-8 text-center">
                      <p className="text-sm text-gray-400">Memuat data santri...</p>
                    </div>
                  )}

                  {!loadingSantri && santriError && (
                    <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {santriError}
                    </div>
                  )}

                  {!loadingSantri && !santriError && latestSantri.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-400 font-medium">Belum ada data santri</p>
                      <p className="text-xs text-gray-300 mt-1">Klik "Tambah Santri" untuk menambahkan data pertama.</p>
                    </div>
                  )}

                  {!loadingSantri && !santriError && latestSantri.length > 0 && (
                    <div className="space-y-3">
                      {latestSantri.map((santri) => (
                        <article key={santri.id} className="rounded-xl border border-gray-100 px-4 py-3 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">{santri.nama_lengkap}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {santri.jenis_kelamin}
                              {santri.nama_wali ? ` • Wali: ${santri.nama_wali}` : ''}
                            </p>
                          </div>
                          <span className="text-xs text-gray-400 shrink-0">
                            {formatDisplayDate(santri.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-900 mb-5">Profil Saya</h3>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-tpq-green to-tpq-light text-white flex items-center justify-center text-xl font-bold mb-3 shadow-lg shadow-tpq-green/20">
                      {userInitials}
                    </div>
                    <p className="font-semibold text-gray-900">{userName}</p>
                    <p className="text-xs text-gray-400 mt-1">{userEmail}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Akun Aktif
                    </span>
                  </div>

                  <div className="mt-6 pt-5 border-t border-gray-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Peran</span>
                      <span className="text-xs font-medium text-gray-700 bg-gray-50 px-2.5 py-1 rounded-md">Admin</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Supabase UID</span>
                      <p className="text-xs font-mono text-gray-500 mt-1 break-all bg-gray-50 rounded-lg p-2">{user?.id || '-'}</p>
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}
        </main>
      </div>

      {showAddSantriModal && (
        <div className="fixed inset-0 z-[60] px-4 bg-black/50 backdrop-blur-sm flex items-center justify-center animate-modal-overlay">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-modal-slide flex flex-col max-h-[90vh]">

            {/* ── Gradient Header ── */}
            <div className="relative bg-gradient-to-br from-tpq-green via-tpq-green to-tpq-light px-6 py-5 overflow-hidden shrink-0">
              <div className="absolute top-[-20px] right-[-20px] w-28 h-28 bg-white/5 rounded-full" />
              <div className="absolute bottom-[-15px] right-[50px] w-16 h-16 bg-tpq-yellow/10 rounded-full blur-lg" />

              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-tpq-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Tambah Santri</h3>
                    <p className="text-white/50 text-xs mt-0.5">Lengkapi data santri baru di bawah ini</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeAddSantriModal}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ── Scrollable Form Body ── */}
            <form onSubmit={handleAddSantri} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-5 space-y-6">

                {/* Section 1 — Data Pribadi */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-800">Data Pribadi</h4>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Nama Lengkap */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        Nama Lengkap <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.375 3.375 0 016.75 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          value={formSantri.namaLengkap}
                          onChange={(event) => handleFormChange('namaLengkap', event.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tpq-green/20 focus:border-tpq-green transition-shadow duration-200 hover:border-gray-300"
                          placeholder="Contoh: Ahmad Fauzi"
                          required
                        />
                      </div>
                    </div>

                    {/* Jenis Kelamin — Card Radio */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        Jenis Kelamin <span className="text-red-400">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => handleFormChange('jenisKelamin', 'Laki-laki')}
                          className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 text-left ${formSantri.jenisKelamin === 'Laki-laki'
                            ? 'border-tpq-green bg-tpq-green/5 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200 ${formSantri.jenisKelamin === 'Laki-laki' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                            }`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 016.75 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                          </div>
                          <div>
                            <p className={`text-sm font-semibold ${formSantri.jenisKelamin === 'Laki-laki' ? 'text-tpq-green' : 'text-gray-700'}`}>Laki-laki</p>
                            <p className="text-xs text-gray-400">Ikhwan</p>
                          </div>
                          {formSantri.jenisKelamin === 'Laki-laki' && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-tpq-green flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            </div>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleFormChange('jenisKelamin', 'Perempuan')}
                          className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 text-left ${formSantri.jenisKelamin === 'Perempuan'
                            ? 'border-tpq-green bg-tpq-green/5 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200 ${formSantri.jenisKelamin === 'Perempuan' ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-400'
                            }`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 016.75 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                          </div>
                          <div>
                            <p className={`text-sm font-semibold ${formSantri.jenisKelamin === 'Perempuan' ? 'text-tpq-green' : 'text-gray-700'}`}>Perempuan</p>
                            <p className="text-xs text-gray-400">Akhwat</p>
                          </div>
                          {formSantri.jenisKelamin === 'Perempuan' && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-tpq-green flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            </div>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Tanggal Lahir */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-sm font-medium text-gray-700">Tanggal Lahir</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                          </svg>
                        </div>
                        <input
                          type="date"
                          value={formSantri.tanggalLahir}
                          onChange={(event) => handleFormChange('tanggalLahir', event.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tpq-green/20 focus:border-tpq-green transition-shadow duration-200 hover:border-gray-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-dashed border-gray-200" />

                {/* Section 2 — Data Wali */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-800">Data Wali</h4>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Nama Wali */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Nama Wali</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 016.75 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          value={formSantri.namaWali}
                          onChange={(event) => handleFormChange('namaWali', event.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tpq-green/20 focus:border-tpq-green transition-shadow duration-200 hover:border-gray-300"
                          placeholder="Contoh: Bapak Ali"
                        />
                      </div>
                    </div>

                    {/* No. HP Wali */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">No. HP Wali</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                          </svg>
                        </div>
                        <input
                          type="tel"
                          value={formSantri.noHp}
                          onChange={(event) => handleFormChange('noHp', event.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tpq-green/20 focus:border-tpq-green transition-shadow duration-200 hover:border-gray-300"
                          placeholder="08xxxxxxxxxx"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-dashed border-gray-200" />

                {/* Section 3 — Informasi Tambahan */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-800">Informasi Tambahan</h4>
                  </div>

                  <div className="space-y-4">
                    {/* Alamat */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Alamat</label>
                      <div className="relative">
                        <div className="absolute left-3 top-3 text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                          </svg>
                        </div>
                        <textarea
                          value={formSantri.alamat}
                          onChange={(event) => handleFormChange('alamat', event.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tpq-green/20 focus:border-tpq-green min-h-[72px] resize-none transition-shadow duration-200 hover:border-gray-300"
                          placeholder="Alamat lengkap santri"
                        />
                      </div>
                    </div>

                    {/* Catatan */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Catatan</label>
                      <div className="relative">
                        <div className="absolute left-3 top-3 text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                        <textarea
                          value={formSantri.catatan}
                          onChange={(event) => handleFormChange('catatan', event.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tpq-green/20 focus:border-tpq-green min-h-[72px] resize-none transition-shadow duration-200 hover:border-gray-300"
                          placeholder="Catatan tambahan (opsional)"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error / Success Messages */}
                {saveError && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    {saveError}
                  </div>
                )}
                {saveSuccess && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {saveSuccess}
                  </div>
                )}
              </div>

              {/* ── Sticky Footer ── */}
              <div className="shrink-0 border-t border-gray-100 bg-gray-50/80 backdrop-blur-sm px-6 py-4">
                <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                  <button
                    type="button"
                    onClick={closeAddSantriModal}
                    disabled={savingSantri}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-white hover:border-gray-300 disabled:opacity-60 transition-all duration-200"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={savingSantri}
                    className="px-5 py-2.5 rounded-xl bg-tpq-green text-white text-sm font-semibold hover:bg-tpq-light disabled:opacity-60 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:shadow-tpq-green/10"
                  >
                    {savingSantri ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Simpan Santri
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddAbsensiModal && (
        <div className="fixed inset-0 z-[70] px-4 bg-black/50 backdrop-blur-sm flex items-center justify-center animate-modal-overlay">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-modal-slide">
            <div className="relative bg-gradient-to-br from-tpq-green via-tpq-green to-tpq-light px-6 py-5 overflow-hidden">
              <div className="absolute top-[-20px] right-[-20px] w-28 h-28 bg-white/5 rounded-full" />
              <div className="absolute bottom-[-15px] right-[50px] w-16 h-16 bg-tpq-yellow/10 rounded-full blur-lg" />

              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-tpq-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m5.25-6.75h-16.5A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25A2.25 2.25 0 0020.25 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Catat Absensi</h3>
                    <p className="text-white/60 text-xs mt-0.5">Simpan kehadiran santri sekaligus (bisa difilter per kelompok)</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeAddAbsensiModal}
                  disabled={savingAbsensi}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all duration-200 disabled:opacity-60"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleAddAbsensi} className="px-6 py-5 space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    Tanggal <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={formAbsensi.tanggal}
                    onChange={(event) => handleAbsensiDateChange(event.target.value)}
                    disabled={savingAbsensi}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tpq-green/20 focus:border-tpq-green transition-shadow duration-200 hover:border-gray-300 disabled:opacity-60"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Kelompok</label>
                  <select
                    value={selectedAbsensiKelompokId}
                    onChange={(event) => setSelectedAbsensiKelompokId(event.target.value)}
                    disabled={savingAbsensi || loadingSantriOptions || absensiKelompokOptions.length === 0}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tpq-green/20 focus:border-tpq-green transition-shadow duration-200 hover:border-gray-300 disabled:opacity-60"
                  >
                    <option value="">Semua Kelompok</option>
                    {absensiKelompokOptions.map((kelompok) => (
                      <option key={kelompok.id} value={kelompok.id}>{kelompok.nama_kelompok}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Cari Santri</label>
                  <input
                    type="text"
                    value={absensiSearchQuery}
                    onChange={(event) => setAbsensiSearchQuery(event.target.value)}
                    disabled={savingAbsensi || loadingSantriOptions || targetAbsensiSantri.length === 0}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tpq-green/20 focus:border-tpq-green transition-shadow duration-200 hover:border-gray-300 disabled:opacity-60"
                    placeholder="Cari nama santri..."
                  />
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-gray-600">
                    Pilih status tiap santri: <span className="font-semibold text-emerald-700">{totalChecklistHadir} Hadir</span>,{' '}
                    <span className="font-semibold text-rose-700">{totalChecklistTidakHadir} Tidak Hadir</span>,{' '}
                    <span className="font-semibold text-amber-700">{totalChecklistBelumDipilih} Belum dipilih</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setAllAbsensiChecklist('Hadir')}
                      disabled={savingAbsensi || loadingSantriOptions || targetAbsensiSantri.length === 0}
                      className="px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                    >
                      Semua Hadir
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllAbsensiChecklist('Tidak Hadir')}
                      disabled={savingAbsensi || loadingSantriOptions || targetAbsensiSantri.length === 0}
                      className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                    >
                      Semua Tidak Hadir
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllAbsensiChecklist('')}
                      disabled={savingAbsensi || loadingSantriOptions || targetAbsensiSantri.length === 0}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-60"
                    >
                      Kosongkan
                    </button>
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {loadingSantriOptions && (
                    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500">
                      Memuat data santri...
                    </div>
                  )}
                  {!loadingSantriOptions && targetAbsensiSantri.length === 0 && (
                    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500">
                      {selectedAbsensiKelompokId ? 'Belum ada santri aktif di kelompok ini.' : 'Belum ada santri aktif.'}
                    </div>
                  )}
                  {!loadingSantriOptions && targetAbsensiSantri.length > 0 && filteredSantriChecklist.length === 0 && (
                    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500">
                      Santri tidak ditemukan.
                    </div>
                  )}
                  {!loadingSantriOptions && filteredSantriChecklist.map((santri) => {
                    const currentStatus = absensiChecklist[santri.id] || '';

                    return (
                      <div key={santri.id} className="rounded-lg border border-gray-200 bg-white px-3 py-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium text-gray-800">{santri.nama_lengkap}</p>
                          <div className="flex flex-wrap items-center gap-3">
                            <label className="inline-flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={currentStatus === 'Hadir'}
                                onChange={() => handleAbsensiChecklistChange(santri.id, 'Hadir')}
                                disabled={savingAbsensi}
                                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              Hadir
                            </label>
                            <label className="inline-flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={currentStatus === 'Tidak Hadir'}
                                onChange={() => handleAbsensiChecklistChange(santri.id, 'Tidak Hadir')}
                                disabled={savingAbsensi}
                                className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                              />
                              Tidak Hadir
                            </label>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Catatan</label>
                <textarea
                  value={formAbsensi.catatan}
                  onChange={(event) => handleAbsensiFormChange('catatan', event.target.value)}
                  disabled={savingAbsensi}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm min-h-[84px] resize-none focus:outline-none focus:ring-2 focus:ring-tpq-green/20 focus:border-tpq-green transition-shadow duration-200 hover:border-gray-300 disabled:opacity-60"
                  placeholder="Catatan umum untuk absensi tanggal ini (opsional)"
                />
              </div>

              {saveAbsensiError && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {saveAbsensiError}
                </div>
              )}
              {saveAbsensiSuccess && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {saveAbsensiSuccess}
                </div>
              )}

              <div className="pt-2 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={closeAddAbsensiModal}
                  disabled={savingAbsensi}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 transition-all duration-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingAbsensi || loadingSantriOptions || targetAbsensiSantri.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-tpq-green text-white text-sm font-semibold hover:bg-tpq-light disabled:opacity-60 transition-all duration-200"
                >
                  {savingAbsensi ? 'Menyimpan...' : 'Simpan Absensi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddNilaiModal && (
        <div className="fixed inset-0 z-[75] px-4 bg-black/50 backdrop-blur-sm flex items-center justify-center animate-modal-overlay">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-modal-slide">
            <div className="relative bg-gradient-to-br from-tpq-green via-tpq-green to-tpq-light px-6 py-5 overflow-hidden">
              <div className="absolute top-[-20px] right-[-20px] w-28 h-28 bg-white/5 rounded-full" />
              <div className="absolute bottom-[-15px] right-[50px] w-16 h-16 bg-tpq-yellow/10 rounded-full blur-lg" />

              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-tpq-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5l6.75-6.75 4.5 4.5 6.75-6.75" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25V3h-5.25" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 20.25h18" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Input Nilai Ngaji</h3>
                    <p className="text-white/60 text-xs mt-0.5">Gunakan L, KL, atau TL sesuai hasil bacaan santri</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeAddNilaiModal}
                  disabled={savingNilai}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all duration-200 disabled:opacity-60"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleAddNilai} className="px-6 py-5 space-y-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-xs font-semibold text-blue-800">Panduan cepat penilaian</p>
                <div className="mt-2 grid sm:grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg bg-white px-2.5 py-2 text-gray-700 border border-blue-100">
                    <p className="font-semibold text-emerald-700">L (Lancar)</p>
                    <p>Bacaan lancar, tajwid dan makhraj sudah baik.</p>
                  </div>
                  <div className="rounded-lg bg-white px-2.5 py-2 text-gray-700 border border-blue-100">
                    <p className="font-semibold text-amber-700">KL (Kurang Lancar)</p>
                    <p>Masih tersendat, perlu arahan saat membaca.</p>
                  </div>
                  <div className="rounded-lg bg-white px-2.5 py-2 text-gray-700 border border-blue-100">
                    <p className="font-semibold text-rose-700">TL (Tidak Lancar)</p>
                    <p>Belum lancar, butuh pendampingan dan pengulangan.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  Santri <span className="text-red-400">*</span>
                </label>
                <select
                  value={formNilai.santriId}
                  onChange={(event) => handleNilaiFormChange('santriId', event.target.value)}
                  disabled={savingNilai || loadingSantriOptions || santriOptions.length === 0}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tpq-green/20 focus:border-tpq-green transition-shadow duration-200 hover:border-gray-300 disabled:opacity-60"
                  required
                >
                  {loadingSantriOptions && <option value="">Memuat data santri...</option>}
                  {!loadingSantriOptions && santriOptions.length === 0 && <option value="">Belum ada data santri</option>}
                  {!loadingSantriOptions && santriOptions.length > 0 && (
                    <>
                      <option value="" disabled>Pilih santri</option>
                      {santriOptions.map((santri) => (
                        <option key={santri.id} value={santri.id}>{santri.nama_lengkap}</option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    Tanggal <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={formNilai.tanggal}
                    onChange={(event) => handleNilaiFormChange('tanggal', event.target.value)}
                    disabled={savingNilai}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tpq-green/20 focus:border-tpq-green transition-shadow duration-200 hover:border-gray-300 disabled:opacity-60"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    Nilai <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formNilai.penilaian}
                    onChange={(event) => handleNilaiFormChange('penilaian', event.target.value)}
                    disabled={savingNilai}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tpq-green/20 focus:border-tpq-green transition-shadow duration-200 hover:border-gray-300 disabled:opacity-60"
                    required
                  >
                    <option value="L">L - Lancar</option>
                    <option value="KL">KL - Kurang Lancar</option>
                    <option value="TL">TL - Tidak Lancar</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Materi Ngaji</label>
                <input
                  type="text"
                  value={formNilai.materi}
                  onChange={(event) => handleNilaiFormChange('materi', event.target.value)}
                  disabled={savingNilai}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tpq-green/20 focus:border-tpq-green transition-shadow duration-200 hover:border-gray-300 disabled:opacity-60"
                  placeholder="Contoh: Jilid 3 halaman 12 atau QS Al-Baqarah ayat 1-5"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Catatan Evaluasi</label>
                <textarea
                  value={formNilai.catatan}
                  onChange={(event) => handleNilaiFormChange('catatan', event.target.value)}
                  disabled={savingNilai}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm min-h-[84px] resize-none focus:outline-none focus:ring-2 focus:ring-tpq-green/20 focus:border-tpq-green transition-shadow duration-200 hover:border-gray-300 disabled:opacity-60"
                  placeholder="Contoh: perlu latihan panjang-pendek dan ghunnah"
                />
              </div>

              {saveNilaiError && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {saveNilaiError}
                </div>
              )}
              {saveNilaiSuccess && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {saveNilaiSuccess}
                </div>
              )}

              <div className="pt-2 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={closeAddNilaiModal}
                  disabled={savingNilai}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 transition-all duration-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingNilai || loadingSantriOptions || santriOptions.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-tpq-green text-white text-sm font-semibold hover:bg-tpq-light disabled:opacity-60 transition-all duration-200"
                >
                  {savingNilai ? 'Menyimpan...' : 'Simpan Nilai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
