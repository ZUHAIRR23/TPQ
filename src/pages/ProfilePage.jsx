import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const ProfilePage = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const [form, setForm] = useState({
        institutionName: '',
        address: '',
        phone: '',
        description: '',
    });
    const [logoUrl, setLogoUrl] = useState('');
    const [logoPreview, setLogoPreview] = useState('');

    // Fetch user & profile
    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) {
                navigate('/auth', { replace: true });
                return;
            }
            setUser(currentUser);

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', currentUser.id)
                .maybeSingle();

            if (error) {
                console.error('Error loading profile:', error);
            }

            if (data) {
                setForm({
                    institutionName: data.institution_name || '',
                    address: data.address || '',
                    phone: data.phone || '',
                    description: data.description || '',
                });
                if (data.logo_url) {
                    setLogoUrl(data.logo_url);
                    setLogoPreview(data.logo_url);
                }
            }

            setLoading(false);
        };

        loadProfile();
    }, [navigate]);

    // Clear success message after 4s
    useEffect(() => {
        if (!successMsg) return undefined;
        const timer = setTimeout(() => setSuccessMsg(''), 4000);
        return () => clearTimeout(timer);
    }, [successMsg]);

    const handleFormChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleLogoUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        if (!file.type.startsWith('image/')) {
            setErrorMsg('File harus berupa gambar (JPG, PNG, dll).');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setErrorMsg('Ukuran file maksimal 2MB.');
            return;
        }

        setUploading(true);
        setErrorMsg('');

        try {
            const ext = file.name.split('.').pop();
            const filePath = `${user.id}/logo.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('logos')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('logos')
                .getPublicUrl(filePath);

            // Append cache-buster to force preview refresh
            const freshUrl = `${publicUrl}?t=${Date.now()}`;
            setLogoUrl(freshUrl);
            setLogoPreview(freshUrl);
            setSuccessMsg('Logo berhasil diunggah.');
        } catch (err) {
            console.error('Upload error:', err);
            setErrorMsg(err.message || 'Gagal mengunggah logo.');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (event) => {
        event.preventDefault();

        if (!user) return;

        const institutionName = form.institutionName.trim();
        if (!institutionName) {
            setErrorMsg('Nama lembaga wajib diisi.');
            return;
        }

        setSaving(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const payload = {
                user_id: user.id,
                institution_name: institutionName,
                address: form.address.trim() || null,
                phone: form.phone.trim() || null,
                description: form.description.trim() || null,
                logo_url: logoUrl || null,
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(payload, { onConflict: 'user_id' });

            if (error) throw error;

            setSuccessMsg('Profil berhasil disimpan.');
        } catch (err) {
            console.error('Save error:', err);
            setErrorMsg(err.message || 'Gagal menyimpan profil.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/80 text-gray-500">
                Memuat profil...
            </div>
        );
    }

    const userName = user?.user_metadata?.full_name || 'Pengguna';
    const userEmail = user?.email || '-';
    const userInitials = userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="min-h-screen bg-gray-50/80">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/60">
                <div className="flex items-center justify-between px-5 lg:px-8 h-16 max-w-5xl mx-auto">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/dashboard"
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-tpq-green hover:bg-tpq-green/5 transition"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                            </svg>
                            Kembali
                        </Link>
                    </div>
                    <h1 className="text-lg font-bold text-gray-900">Profil Lembaga</h1>
                    <div className="w-9 h-9 rounded-full bg-tpq-green text-white flex items-center justify-center text-xs font-bold">
                        {userInitials}
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-5 lg:px-8 py-8 space-y-6">
                {/* Success / Error */}
                {successMsg && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-700">
                        {successMsg}
                    </div>
                )}
                {errorMsg && (
                    <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
                        {errorMsg}
                    </div>
                )}

                {/* Logo Section */}
                <section className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Logo Lembaga</h2>
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            {logoPreview ? (
                                <img
                                    src={logoPreview}
                                    alt="Logo lembaga"
                                    className="w-24 h-24 rounded-2xl object-cover border-2 border-gray-200/80 shadow-sm"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                                    </svg>
                                </div>
                            )}
                            {/* Hover overlay */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 space-y-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-tpq-green text-white text-sm font-medium hover:bg-tpq-light transition disabled:opacity-50"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                </svg>
                                {uploading ? 'Mengunggah...' : (logoPreview ? 'Ganti Logo' : 'Unggah Logo')}
                            </button>
                            <p className="text-xs text-gray-400">Format: JPG, PNG • Maks 2MB</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                            />
                        </div>
                    </div>
                </section>

                {/* Profile Form */}
                <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6 space-y-5">
                    <h2 className="text-base font-semibold text-gray-900">Informasi Lembaga</h2>

                    {/* Institution Name */}
                    <div>
                        <label htmlFor="institutionName" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Nama Lembaga <span className="text-red-400">*</span>
                        </label>
                        <input
                            id="institutionName"
                            type="text"
                            value={form.institutionName}
                            onChange={(e) => handleFormChange('institutionName', e.target.value)}
                            placeholder="Contoh: TPQ Al-Hikmah"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tpq-green/30 focus:border-tpq-green transition"
                        />
                    </div>

                    {/* Address */}
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Alamat
                        </label>
                        <textarea
                            id="address"
                            rows={3}
                            value={form.address}
                            onChange={(e) => handleFormChange('address', e.target.value)}
                            placeholder="Alamat lengkap lembaga"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tpq-green/30 focus:border-tpq-green transition resize-none"
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Nomor Telepon
                        </label>
                        <input
                            id="phone"
                            type="tel"
                            value={form.phone}
                            onChange={(e) => handleFormChange('phone', e.target.value)}
                            placeholder="Contoh: 08123456789"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tpq-green/30 focus:border-tpq-green transition"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Deskripsi
                        </label>
                        <textarea
                            id="description"
                            rows={4}
                            value={form.description}
                            onChange={(e) => handleFormChange('description', e.target.value)}
                            placeholder="Deskripsi singkat tentang lembaga TPQ Anda"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tpq-green/30 focus:border-tpq-green transition resize-none"
                        />
                    </div>

                    {/* User Info (Read-only) */}
                    <div className="pt-3 border-t border-gray-100 space-y-3">
                        <h3 className="text-sm font-medium text-gray-500">Informasi Akun</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="bg-gray-50 rounded-xl px-4 py-3">
                                <p className="text-xs text-gray-400 mb-0.5">Nama</p>
                                <p className="text-sm font-medium text-gray-700">{userName}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl px-4 py-3">
                                <p className="text-xs text-gray-400 mb-0.5">Email</p>
                                <p className="text-sm font-medium text-gray-700">{userEmail}</p>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-tpq-green text-white text-sm font-semibold hover:bg-tpq-light transition shadow-sm disabled:opacity-50"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            {saving ? 'Menyimpan...' : 'Simpan Profil'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default ProfilePage;
