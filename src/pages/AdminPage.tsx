import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  LogOut,
  Save,
  Check,
  X,
  Trash2,
  Plus,
  Sparkles,
  RefreshCw,
  Database,
  AlertTriangle,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import {
  EventSettings,
  Announcement,
  Testimonial,
  PhotoItem,
  RsvpSubmission,
  ModerationStatus,
} from '../types';

interface AdminPageProps {
  onPublicDataRefresh: () => Promise<void>;
  onNotify: (msg: string) => void;
}

interface AdminDashboardPayload {
  settings: EventSettings;
  announcements: Announcement[];
  testimonials: Testimonial[];
  photos: PhotoItem[];
  rsvps: RsvpSubmission[];
  sanityStatus: {
    connected: boolean;
    projectId: string;
    organizationId: string;
    dataset: string;
    lastSyncAt: string | null;
  };
}

const ADMIN_TOKEN_KEY = 'rnm_admin_session_token';

export const AdminPage: React.FC<AdminPageProps> = ({ onPublicDataRefresh, onNotify }) => {
  const { locale, t } = useI18n();

  const [token, setToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(ADMIN_TOKEN_KEY);
    } catch {
      return null;
    }
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [dashboard, setDashboard] = useState<AdminDashboardPayload | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'general' | 'dissertation' | 'moderation' | 'rsvp' | 'announcements' | 'celebration'
  >('general');

  const [draftSettings, setDraftSettings] = useState<EventSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // New Announcement Form
  const [annType, setAnnType] = useState<Announcement['type']>('access_detail');
  const [annTitleFr, setAnnTitleFr] = useState('');
  const [annTitleEn, setAnnTitleEn] = useState('');
  const [annMessageFr, setAnnMessageFr] = useState('');
  const [annMessageEn, setAnnMessageEn] = useState('');

  // Deletion Confirmation Modal State
  const [confirmDelete, setConfirmDelete] = useState<{
    kind: 'testimonial' | 'photo' | 'rsvp' | 'announcement';
    id: string;
    label: string;
  } | null>(null);

  const fetchDashboard = useCallback(
    async (authToken: string) => {
      setLoadingDashboard(true);
      try {
        const res = await fetch('/api/admin/dashboard', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.status === 401) {
          sessionStorage.removeItem(ADMIN_TOKEN_KEY);
          setToken(null);
          setDashboard(null);
          return;
        }
        if (res.ok) {
          const data: AdminDashboardPayload = await res.json();
          setDashboard(data);
          setDraftSettings(data.settings);
        }
      } catch {
        // ignore network error
      } finally {
        setLoadingDashboard(false);
      }
    },
    []
  );

  useEffect(() => {
    if (token) {
      fetchDashboard(token);
    }
  }, [token, fetchDashboard]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        setToken(data.token);
        setPassword('');
      } else {
        setLoginError(
          data.error ||
            (locale === 'fr'
              ? 'Identifiants administrateur invalides.'
              : 'Invalid administrator credentials.')
        );
      }
    } catch {
      setLoginError(locale === 'fr' ? 'Erreur de connexion au serveur.' : 'Server connection error.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken(null);
    setDashboard(null);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !draftSettings) return;
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ settings: draftSettings }),
      });
      if (res.ok) {
        await fetchDashboard(token);
        await onPublicDataRefresh();
        onNotify(t.admin.savedSuccess);
      }
    } finally {
      setSavingSettings(false);
    }
  };

  const handleModerateTestimonial = async (id: string, status: ModerationStatus) => {
    if (!token) return;
    const res = await fetch(`/api/admin/testimonials/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await fetchDashboard(token);
      await onPublicDataRefresh();
      onNotify(locale === 'fr' ? 'Statut du message mis à jour.' : 'Message status updated.');
    }
  };

  const handleModeratePhoto = async (id: string, status: ModerationStatus) => {
    if (!token) return;
    const res = await fetch(`/api/admin/photos/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await fetchDashboard(token);
      await onPublicDataRefresh();
      onNotify(locale === 'fr' ? 'Statut de la photo mis à jour.' : 'Photo status updated.');
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !annTitleFr.trim() || !annMessageFr.trim()) return;
    const res = await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: annType,
        titleFr: annTitleFr.trim(),
        titleEn: annTitleEn.trim() || annTitleFr.trim(),
        messageFr: annMessageFr.trim(),
        messageEn: annMessageEn.trim() || annMessageFr.trim(),
      }),
    });
    if (res.ok) {
      setAnnTitleFr('');
      setAnnTitleEn('');
      setAnnMessageFr('');
      setAnnMessageEn('');
      await fetchDashboard(token);
      await onPublicDataRefresh();
      onNotify(locale === 'fr' ? 'Annonce publiée.' : 'Announcement published.');
    }
  };

  const handleToggleAnnouncement = async (id: string, isActive: boolean) => {
    if (!token) return;
    const res = await fetch(`/api/admin/announcements/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isActive }),
    });
    if (res.ok) {
      await fetchDashboard(token);
      await onPublicDataRefresh();
    }
  };

  const executeConfirmedDelete = async () => {
    if (!token || !confirmDelete) return;
    const { kind, id } = confirmDelete;
    const endpointMap = {
      testimonial: `/api/admin/testimonials/${id}`,
      photo: `/api/admin/photos/${id}`,
      rsvp: `/api/admin/rsvps/${id}`,
      announcement: `/api/admin/announcements/${id}`,
    };
    const res = await fetch(endpointMap[kind], {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setConfirmDelete(null);
    if (res.ok) {
      await fetchDashboard(token);
      await onPublicDataRefresh();
      onNotify(locale === 'fr' ? 'Élément supprimé définitivement.' : 'Item permanently deleted.');
    }
  };

  const handleSyncSanity = async () => {
    if (!token) return;
    const res = await fetch('/api/admin/sanity-sync', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      await fetchDashboard(token);
      onNotify(
        locale === 'fr'
          ? 'Synchronisation complète avec Sanity CMS (occg14cs) effectuée.'
          : 'Full sync with Sanity CMS (occg14cs) completed.'
      );
    }
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
        <div className="rounded-2xl bg-white border border-[#14243B]/15 p-8 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[#14243B] text-[#D9BE8A] flex items-center justify-center mb-4">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#14243B] mb-2">
            {t.admin.loginTitle}
          </h1>
          <p className="text-xs text-[#647080] mb-6">{t.admin.subtitle}</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold text-[#14243B] mb-1"
              >
                {t.admin.emailLabel}
              </label>
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="roseline.admin@inseck.cm"
                className="w-full px-3.5 py-2.5 rounded-md bg-[#FCFAF6] border border-[#14243B]/20 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-[#14243B] mb-1"
              >
                {t.admin.passwordLabel}
              </label>
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-md bg-[#FCFAF6] border border-[#14243B]/20 text-sm"
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-800">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 px-4 rounded-md bg-[#14243B] text-[#FCFAF6] text-xs font-semibold hover:bg-[#1D2633] transition-colors cursor-pointer"
            >
              {loggingIn ? '...' : t.admin.loginBtn}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#14243B]/15 mb-8">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#14243B]">
            {t.admin.title}
          </h1>
          <p className="text-xs sm:text-sm text-[#647080] mt-1">{t.admin.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {dashboard?.sanityStatus && (
            <button
              type="button"
              onClick={handleSyncSanity}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#EDF3F9] border border-[#14243B]/15 text-xs font-semibold text-[#14243B] hover:border-[#8A642C] cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-[#8A642C]" />
              <span>Sanity CMS ({dashboard.sanityStatus.projectId})</span>
              <RefreshCw className="w-3 h-3 text-[#647080]" />
            </button>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-[#14243B]/20 text-xs font-semibold text-[#14243B] hover:bg-red-50 hover:text-red-800 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.admin.logoutBtn}</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="mb-8 flex flex-wrap gap-1.5 p-1.5 bg-[#EDF3F9] rounded-xl border border-[#14243B]/10">
        {(
          [
            { id: 'general', label: t.admin.tabGeneral },
            { id: 'dissertation', label: t.admin.tabDissertation },
            {
              id: 'moderation',
              label: `${t.admin.tabModeration} (${
                (dashboard?.testimonials.filter((i) => i.status === 'pending').length || 0) +
                (dashboard?.photos.filter((p) => p.status === 'pending').length || 0)
              })`,
            },
            { id: 'rsvp', label: `${t.admin.tabRsvp} (${dashboard?.rsvps.length || 0})` },
            { id: 'announcements', label: t.admin.tabAnnouncements },
            { id: 'celebration', label: t.admin.tabCelebration },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#14243B] text-[#FCFAF6] shadow-xs'
                : 'text-[#14243B] hover:text-[#8A642C]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loadingDashboard || !draftSettings ? (
        <div className="p-12 text-center text-sm text-[#647080]">Chargement...</div>
      ) : (
        <>
          {/* TAB 1: GENERAL EVENT & VENUE SETTINGS */}
          {activeTab === 'general' && (
            <form
              onSubmit={handleSaveSettings}
              className="rounded-2xl bg-white border border-[#14243B]/12 p-6 sm:p-8 space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#14243B] mb-1">
                    Date de la soutenance (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    value={draftSettings.eventDate || ''}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        eventDate: e.target.value || null,
                      })
                    }
                    className="w-full px-3 py-2 rounded-md border border-[#14243B]/20 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#14243B] mb-1">
                    Heure de début
                  </label>
                  <input
                    type="text"
                    value={draftSettings.startTime}
                    onChange={(e) =>
                      setDraftSettings({ ...draftSettings, startTime: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-md border border-[#14243B]/20 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#14243B] mb-1">
                    Heure de fin
                  </label>
                  <input
                    type="text"
                    value={draftSettings.endTime}
                    onChange={(e) =>
                      setDraftSettings({ ...draftSettings, endTime: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-md border border-[#14243B]/20 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#14243B] mb-1">
                    Établissement communiqué
                  </label>
                  <input
                    type="text"
                    value={draftSettings.institutionName}
                    onChange={(e) =>
                      setDraftSettings({ ...draftSettings, institutionName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-md border border-[#14243B]/20 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#14243B] mb-1">
                    Intitulé officiel confirmé (INSECK - Ngoa-Ekellé)
                  </label>
                  <input
                    type="text"
                    value={draftSettings.institutionOfficialName}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        institutionOfficialName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-md border border-[#14243B]/20 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#14243B] mb-1">
                    Amphithéâtre
                  </label>
                  <input
                    type="text"
                    value={draftSettings.amphitheatre}
                    onChange={(e) =>
                      setDraftSettings({ ...draftSettings, amphitheatre: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-md border border-[#14243B]/20 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#14243B] mb-1">Salle</label>
                  <input
                    type="text"
                    value={draftSettings.room}
                    onChange={(e) => setDraftSettings({ ...draftSettings, room: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-[#14243B]/20 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#14243B] mb-1">
                    Numéro WhatsApp autorisé
                  </label>
                  <input
                    type="text"
                    value={draftSettings.whatsappNumber}
                    onChange={(e) =>
                      setDraftSettings({ ...draftSettings, whatsappNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-md border border-[#14243B]/20 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#14243B] mb-1">
                    Adresse / Campus
                  </label>
                  <input
                    type="text"
                    value={draftSettings.address}
                    onChange={(e) =>
                      setDraftSettings({ ...draftSettings, address: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-md border border-[#14243B]/20 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#14243B] mb-1">
                    Lien Google Maps validé (optionnel)
                  </label>
                  <input
                    type="url"
                    value={draftSettings.mapsUrl}
                    onChange={(e) =>
                      setDraftSettings({ ...draftSettings, mapsUrl: e.target.value })
                    }
                    placeholder="https://maps.google.com/..."
                    className="w-full px-3 py-2 rounded-md border border-[#14243B]/20 text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#14243B]">
                  <input
                    type="checkbox"
                    checked={draftSettings.locationConfirmed}
                    onChange={(e) =>
                      setDraftSettings({ ...draftSettings, locationConfirmed: e.target.checked })
                    }
                  />
                  <span>Localisation précise confirmée</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-[#14243B]">
                  <input
                    type="checkbox"
                    checked={draftSettings.sameSpaceConfirmed}
                    onChange={(e) =>
                      setDraftSettings({ ...draftSettings, sameSpaceConfirmed: e.target.checked })
                    }
                  />
                  <span>« Amphi 250 » et « Salle SA B2 » désignent le même espace</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-[#14243B]">
                  <input
                    type="checkbox"
                    checked={draftSettings.allowRsvp}
                    onChange={(e) =>
                      setDraftSettings({ ...draftSettings, allowRsvp: e.target.checked })
                    }
                  />
                  <span>Activer les confirmations de présence (RSVP)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-[#14243B]">
                  <input
                    type="checkbox"
                    checked={draftSettings.allowPhotoContributions}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        allowPhotoContributions: e.target.checked,
                      })
                    }
                  />
                  <span>Ouvrir l’envoi de photos par les invités</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-[#14243B]">
                  <input
                    type="checkbox"
                    checked={draftSettings.galleryVisibility === 'public'}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        galleryVisibility: e.target.checked ? 'public' : 'private',
                      })
                    }
                  />
                  <span>Galerie publique (sans code invité)</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-[#14243B] text-[#FCFAF6] text-xs font-semibold hover:bg-[#1D2633] cursor-pointer"
              >
                <Save className="w-4 h-4 text-[#D9BE8A]" />
                <span>{t.admin.saveChanges}</span>
              </button>
            </form>
          )}

          {/* TAB 2: DISSERTATION CONTENT */}
          {activeTab === 'dissertation' && (
            <form
              onSubmit={handleSaveSettings}
              className="rounded-2xl bg-white border border-[#14243B]/12 p-6 sm:p-8 space-y-5"
            >
              <div>
                <label className="block text-xs font-semibold text-[#14243B] mb-1">
                  Thème exact du mémoire (FR)
                </label>
                <input
                  type="text"
                  value={draftSettings.dissertationTitle}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, dissertationTitle: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-md border border-[#14243B]/20 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14243B] mb-1">
                  Dissertation Title (EN)
                </label>
                <input
                  type="text"
                  value={draftSettings.dissertationTitleEn}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, dissertationTitleEn: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-md border border-[#14243B]/20 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14243B] mb-1">
                  Problématique (FR)
                </label>
                <textarea
                  rows={3}
                  value={draftSettings.dissertationProblematic}
                  onChange={(e) =>
                    setDraftSettings({
                      ...draftSettings,
                      dissertationProblematic: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-md border border-[#14243B]/20 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14243B] mb-1">
                  Résumé public (FR)
                </label>
                <textarea
                  rows={4}
                  value={draftSettings.dissertationSummary}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, dissertationSummary: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-md border border-[#14243B]/20 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#14243B] mb-1">
                    Nom de l’encadrant (si publication autorisée)
                  </label>
                  <input
                    type="text"
                    value={draftSettings.supervisorName}
                    onChange={(e) =>
                      setDraftSettings({ ...draftSettings, supervisorName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-md border border-[#14243B]/20 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#14243B] mb-1">
                    URL d’un extrait PDF autorisé (optionnel)
                  </label>
                  <input
                    type="text"
                    value={draftSettings.dissertationPdfUrl}
                    onChange={(e) =>
                      setDraftSettings({ ...draftSettings, dissertationPdfUrl: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-md border border-[#14243B]/20 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-[#14243B] text-[#FCFAF6] text-xs font-semibold hover:bg-[#1D2633] cursor-pointer"
              >
                <Save className="w-4 h-4 text-[#D9BE8A]" />
                <span>{t.admin.saveChanges}</span>
              </button>
            </form>
          )}

          {/* TAB 3: MODERATION OF TESTIMONIALS & PHOTOS */}
          {activeTab === 'moderation' && dashboard && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Testimonials Moderation */}
              <div className="rounded-2xl bg-white border border-[#14243B]/12 p-6 space-y-4">
                <h2 className="font-serif text-2xl font-bold text-[#14243B]">
                  Témoignages & Encouragements ({dashboard.testimonials.length})
                </h2>

                {dashboard.testimonials.length === 0 ? (
                  <p className="text-xs text-[#647080]">Aucun témoignage reçu pour le moment.</p>
                ) : (
                  <div className="space-y-3">
                    {dashboard.testimonials.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl bg-[#FCFAF6] border border-[#14243B]/10 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div>
                            <strong className="text-[#14243B]">{item.authorName}</strong>
                            {item.relationship ? ` · ${item.relationship}` : ''}
                            <span className="ml-2 font-mono text-[11px] uppercase text-[#8A642C]">
                              [{item.status}]
                            </span>
                          </div>
                          {item.removalRequested && (
                            <span className="text-red-700 font-bold text-[11px]">
                              Retrait demandé : {item.removalReason}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-[#1D2633]">{item.content}</p>
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => handleModerateTestimonial(item.id, 'approved')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-800 text-white text-xs font-semibold cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approuver</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleModerateTestimonial(item.id, 'rejected')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-700 text-white text-xs font-semibold cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Masquer</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmDelete({
                                kind: 'testimonial',
                                id: item.id,
                                label: item.authorName,
                              })
                            }
                            className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded text-red-700 hover:bg-red-50 text-xs font-semibold cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Supprimer</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Photos Moderation */}
              <div className="rounded-2xl bg-white border border-[#14243B]/12 p-6 space-y-4">
                <h2 className="font-serif text-2xl font-bold text-[#14243B]">
                  Photographies ({dashboard.photos.length})
                </h2>

                {dashboard.photos.length === 0 ? (
                  <p className="text-xs text-[#647080]">Aucune photo enregistrée.</p>
                ) : (
                  <div className="space-y-3">
                    {dashboard.photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="p-3 rounded-xl bg-[#FCFAF6] border border-[#14243B]/10 flex items-start gap-3"
                      >
                        <img
                          src={photo.thumbnailUrl || photo.imageUrl}
                          alt={photo.caption || 'Photo'}
                          className="w-20 h-20 rounded-lg object-cover shrink-0 border border-[#14243B]/10"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-[#14243B]">
                            {photo.contributorName}{' '}
                            <span className="font-mono text-[11px] uppercase text-[#8A642C]">
                              [{photo.status}]
                            </span>
                          </div>
                          {photo.caption && (
                            <p className="text-xs text-[#647080] truncate">{photo.caption}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => handleModeratePhoto(photo.id, 'approved')}
                              className="px-2.5 py-1 rounded bg-emerald-800 text-white text-xs font-semibold cursor-pointer"
                            >
                              Approuver
                            </button>
                            <button
                              type="button"
                              onClick={() => handleModeratePhoto(photo.id, 'rejected')}
                              className="px-2.5 py-1 rounded bg-amber-700 text-white text-xs font-semibold cursor-pointer"
                            >
                              Rejeter
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmDelete({
                                  kind: 'photo',
                                  id: photo.id,
                                  label: photo.caption || photo.contributorName,
                                })
                              }
                              className="px-2.5 py-1 rounded text-red-700 hover:bg-red-50 text-xs font-semibold cursor-pointer"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: RSVP SUBMISSIONS */}
          {activeTab === 'rsvp' && dashboard && (
            <div className="rounded-2xl bg-white border border-[#14243B]/12 p-6 space-y-4">
              <h2 className="font-serif text-2xl font-bold text-[#14243B]">
                Confirmations de présence ({dashboard.rsvps.length})
              </h2>

              {dashboard.rsvps.length === 0 ? (
                <p className="text-xs text-[#647080]">Aucune confirmation enregistrée.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-[#14243B]/15 text-[#647080]">
                        <th className="py-2.5 pr-4">Invité(e)</th>
                        <th className="py-2.5 pr-4">Réponse</th>
                        <th className="py-2.5 pr-4">Accompagnants</th>
                        <th className="py-2.5 pr-4">Message</th>
                        <th className="py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#14243B]/10">
                      {dashboard.rsvps.map((r) => (
                        <tr key={r.id}>
                          <td className="py-3 pr-4 font-semibold text-[#14243B]">
                            {r.firstName} {r.lastName}
                          </td>
                          <td className="py-3 pr-4">{r.attendance}</td>
                          <td className="py-3 pr-4 font-mono tabular-nums">{r.guestsCount}</td>
                          <td className="py-3 pr-4 text-[#647080]">{r.message || '—'}</td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmDelete({
                                  kind: 'rsvp',
                                  id: r.id,
                                  label: `${r.firstName} ${r.lastName || ''}`,
                                })
                              }
                              className="text-red-700 hover:underline text-xs font-semibold cursor-pointer"
                            >
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && dashboard && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <form
                onSubmit={handleCreateAnnouncement}
                className="lg:col-span-5 rounded-2xl bg-white border border-[#14243B]/12 p-6 space-y-4"
              >
                <h2 className="font-serif text-xl font-bold text-[#14243B]">
                  Publier une annonce (Changement de salle / Horaire / Accès)
                </h2>
                <div>
                  <label className="block text-xs font-semibold text-[#14243B] mb-1">Type</label>
                  <select
                    value={annType}
                    onChange={(e) => setAnnType(e.target.value as Announcement['type'])}
                    className="w-full px-3 py-2 rounded-md border border-[#14243B]/20 text-sm"
                  >
                    <option value="access_detail">Précision d’accès</option>
                    <option value="room_change">Changement de salle</option>
                    <option value="schedule_update">Modification d’horaire</option>
                    <option value="general">Information générale</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#14243B] mb-1">
                    Titre (FR) *
                  </label>
                  <input
                    type="text"
                    required
                    value={annTitleFr}
                    onChange={(e) => setAnnTitleFr(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-[#14243B]/20 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#14243B] mb-1">
                    Message (FR) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={annMessageFr}
                    onChange={(e) => setAnnMessageFr(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-[#14243B]/20 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#14243B] text-[#FCFAF6] text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#D9BE8A]" />
                  <span>Publier l’annonce</span>
                </button>
              </form>

              <div className="lg:col-span-7 rounded-2xl bg-white border border-[#14243B]/12 p-6 space-y-3">
                <h2 className="font-serif text-xl font-bold text-[#14243B]">
                  Annonces configurées ({dashboard.announcements.length})
                </h2>
                {dashboard.announcements.map((a) => (
                  <div
                    key={a.id}
                    className="p-4 rounded-xl bg-[#FCFAF6] border border-[#14243B]/10 flex items-start justify-between gap-4"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#14243B]">{a.titleFr}</p>
                      <p className="text-xs text-[#647080] mt-1">{a.messageFr}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleAnnouncement(a.id, !a.isActive)}
                        className="px-2.5 py-1 rounded border border-[#14243B]/20 text-xs font-semibold cursor-pointer"
                      >
                        {a.isActive ? 'Désactiver' : 'Activer'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmDelete({
                            kind: 'announcement',
                            id: a.id,
                            label: a.titleFr,
                          })
                        }
                        className="text-red-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: EVENT STATUS & CELEBRATION MODE */}
          {activeTab === 'celebration' && (
            <form
              onSubmit={handleSaveSettings}
              className="rounded-2xl bg-white border border-[#14243B]/12 p-6 sm:p-8 space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-[#14243B] mb-1.5">
                    État de l’événement (upcoming / event_day / completed)
                  </label>
                  <select
                    value={draftSettings.eventStatus}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        eventStatus: e.target.value as EventSettings['eventStatus'],
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-md border border-[#14243B]/20 text-sm"
                  >
                    <option value="upcoming">Avant la soutenance (upcoming)</option>
                    <option value="event_day">Jour J — Soutenance en cours (event_day)</option>
                    <option value="completed">Après la soutenance (completed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#14243B] mb-1.5">
                    État du résultat (séparé de l’état de l’événement)
                  </label>
                  <select
                    value={draftSettings.resultStatus}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        resultStatus: e.target.value as EventSettings['resultStatus'],
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-md border border-[#14243B]/20 text-sm"
                  >
                    <option value="not_announced">Non annoncé (not_announced)</option>
                    <option value="confirmed_success">
                      Réussite confirmée manuellement (confirmed_success)
                    </option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-[#14243B]">
                <input
                  type="checkbox"
                  checked={draftSettings.laureateTitleConfirmed}
                  onChange={(e) =>
                    setDraftSettings({
                      ...draftSettings,
                      laureateTitleConfirmed: e.target.checked,
                    })
                  }
                />
                <span>Autoriser l’affichage de la mention « Lauréate » (uniquement si réussite confirmée)</span>
              </label>

              <div>
                <label className="block text-xs font-semibold text-[#14243B] mb-1">
                  Texte public du résultat / remerciement après validation (FR)
                </label>
                <textarea
                  rows={3}
                  value={draftSettings.resultPublicText}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, resultPublicText: e.target.value })
                  }
                  placeholder="Ex. : Soutenance de mémoire validée devant le jury de l'INSECK. Merci infiniment pour votre soutien."
                  className="w-full px-3.5 py-2.5 rounded-md border border-[#14243B]/20 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-[#14243B] text-[#FCFAF6] text-xs font-semibold hover:bg-[#1D2633] cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#D9BE8A]" />
                <span>{t.admin.saveChanges}</span>
              </button>
            </form>
          )}
        </>
      )}

      {/* Permanent Deletion Confirmation Modal */}
      {confirmDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#14243B]/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#14243B]/15 shadow-2xl">
            <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Confirmer la suppression définitive</span>
            </div>
            <p className="text-xs sm:text-sm text-[#1D2633] mb-6">
              Voulez-vous vraiment supprimer définitivement « {confirmDelete.label} » ? Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-[#647080]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={executeConfirmedDelete}
                className="px-4 py-2 rounded-md bg-red-700 text-white text-xs font-semibold"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
