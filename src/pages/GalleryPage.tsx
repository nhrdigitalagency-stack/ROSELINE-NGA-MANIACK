import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  Lock,
  X,
  ChevronLeft,
  ChevronRight,
  Images,
  ShieldAlert,
  UploadCloud,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { EventSettings, PhotoItem } from '../types';
import { processImageCleanExif } from '../utils/calendarAndShare';

interface GalleryPageProps {
  settings: EventSettings;
  photos: PhotoItem[];
  galleryUnlocked: boolean;
  onUnlockGallery: (code: string) => Promise<boolean>;
  onUploadSinglePhoto: (payload: {
    contributorName: string;
    showContributorName: boolean;
    caption: string;
    category: PhotoItem['category'];
    imageDataUrl: string;
    thumbnailDataUrl: string;
    mimeType: string;
    width: number;
    height: number;
    fileSize: number;
    consentGiven: boolean;
  }) => Promise<{ ok: boolean; error?: string }>;
  onNotify: (msg: string) => void;
}

export const GalleryPage: React.FC<GalleryPageProps> = ({
  settings,
  photos,
  galleryUnlocked,
  onUnlockGallery,
  onUploadSinglePhoto,
  onNotify,
}) => {
  const { locale, t } = useI18n();
  const [filter, setFilter] = useState<
    'all' | 'official' | 'preparation' | 'defense' | 'group' | 'ceremony'
  >('all');
  const [guestCode, setGuestCode] = useState('');
  const [unlockError, setUnlockError] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Direct Sanity Quick-Import State inside Gallery
  const [showQuickUpload, setShowQuickUpload] = useState(false);
  const [contributorName, setContributorName] = useState('');
  const [caption, setCaption] = useState('');
  const [uploadCategory, setUploadCategory] = useState<PhotoItem['category']>('ceremony');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const quickInputRef = useRef<HTMLInputElement | null>(null);

  const canViewAlbum = settings.galleryVisibility === 'public' || galleryUnlocked;

  const filteredPhotos = photos.filter((p) => (filter === 'all' ? true : p.category === filter));

  const handleCloseLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const handlePrev = useCallback(() => {
    setLightboxIndex((prev) => {
      if (prev === null || filteredPhotos.length === 0) return null;
      return (prev - 1 + filteredPhotos.length) % filteredPhotos.length;
    });
  }, [filteredPhotos.length]);

  const handleNext = useCallback(() => {
    setLightboxIndex((prev) => {
      if (prev === null || filteredPhotos.length === 0) return null;
      return (prev + 1) % filteredPhotos.length;
    });
  }, [filteredPhotos.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseLightbox();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIndex, handleCloseLightbox, handlePrev, handleNext]);

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestCode.trim()) return;
    setUnlocking(true);
    setUnlockError(false);
    const ok = await onUnlockGallery(guestCode.trim());
    setUnlocking(false);
    if (!ok) {
      setUnlockError(true);
    }
  };

  const handleQuickFileSelect = (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError(
        locale === 'fr'
          ? 'Format non pris en charge. Choisissez JPEG, PNG ou WebP.'
          : 'Unsupported format. Please select JPEG, PNG, or WebP.'
      );
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(
        locale === 'fr'
          ? 'La photo dépasse la limite de 10 Mo.'
          : 'Photo exceeds the 10 MB limit.'
      );
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleQuickImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !contributorName.trim()) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const processed = await processImageCleanExif(selectedFile);
      const res = await onUploadSinglePhoto({
        contributorName: contributorName.trim(),
        showContributorName: true,
        caption: caption.trim(),
        category: uploadCategory,
        imageDataUrl: processed.imageDataUrl,
        thumbnailDataUrl: processed.thumbnailDataUrl,
        mimeType: processed.mimeType,
        width: processed.width,
        height: processed.height,
        fileSize: processed.fileSize,
        consentGiven: true,
      });

      if (res.ok) {
        onNotify(t.upload.uploadSuccess);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setSelectedFile(null);
        setPreviewUrl(null);
        setCaption('');
        setShowQuickUpload(false);
      } else {
        setUploadError(
          res.error ||
            (locale === 'fr'
              ? "Échec de l'importation vers Sanity."
              : 'Failed to import photo to Sanity.')
        );
      }
    } catch {
      setUploadError(
        locale === 'fr'
          ? 'Erreur lors du traitement de la photo.'
          : 'Error while processing image.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#E67E22] hover:text-[#1F1610]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.nav.home}</span>
        </Link>

        {settings.allowPhotoContributions && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowQuickUpload((prev) => !prev)}
              className="neon-bubble inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF9F43] text-[#1A1008] text-xs font-bold hover:bg-[#FFB870] cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>
                {locale === 'fr'
                  ? 'Importer une image ici (Sanity)'
                  : 'Import Image Here (Sanity)'}
              </span>
            </button>

            <Link
              to="/partager-des-photos"
              className="neon-card inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white text-[#1F1610] text-xs font-bold hover:bg-[#FFF2E2]"
            >
              <Camera className="w-4 h-4 text-[#E67E22]" />
              <span>{t.gallery.contributeCta}</span>
            </Link>
          </div>
        )}
      </div>

      {/* Inline Sanity Photo Importer Drawer */}
      {settings.allowPhotoContributions && showQuickUpload && (
        <form
          onSubmit={handleQuickImportSubmit}
          className="neon-section mb-10 p-6 sm:p-8 rounded-3xl bg-white space-y-5"
        >
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#FF9F43]/30">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FF9F43]" />
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1F1610]">
                {locale === 'fr'
                  ? 'Importation directe de photo (reliée à Sanity Cloud)'
                  : 'Direct Photo Import (Connected to Sanity Cloud)'}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowQuickUpload(false)}
              className="text-xs font-bold text-[#6B5B4E] hover:text-[#1F1610] cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1F1610] mb-1">
                {t.upload.contributorName}
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={contributorName}
                onChange={(e) => setContributorName(e.target.value)}
                placeholder={t.upload.contributorPlaceholder}
                className="w-full px-3.5 py-2 rounded-lg bg-[#FFF9F3] border border-[#FF9F43]/40 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F1610] mb-1">
                {t.upload.category}
              </label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value as PhotoItem['category'])}
                className="w-full px-3.5 py-2 rounded-lg bg-[#FFF9F3] border border-[#FF9F43]/40 text-sm"
              >
                <option value="defense">{t.gallery.filterDefense}</option>
                <option value="group">{t.gallery.filterGroup}</option>
                <option value="ceremony">{t.gallery.filterCeremony}</option>
                <option value="preparation">{t.gallery.filterPreparation}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F1610] mb-1">
                {t.upload.caption}
              </label>
              <input
                type="text"
                maxLength={300}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={t.upload.captionPlaceholder}
                className="w-full px-3.5 py-2 rounded-lg bg-[#FFF9F3] border border-[#FF9F43]/40 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <input
              ref={quickInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleQuickFileSelect(e.target.files?.[0])}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => quickInputRef.current?.click()}
              className="neon-card flex-1 w-full py-4 px-5 rounded-2xl border-2 border-dashed border-[#FF9F43]/50 bg-[#FFF9F3] hover:border-[#FF9F43] flex items-center justify-center gap-3 text-xs sm:text-sm font-bold text-[#1F1610] cursor-pointer"
            >
              <UploadCloud className="w-5 h-5 text-[#FF9F43]" />
              <span>
                {selectedFile
                  ? selectedFile.name
                  : locale === 'fr'
                  ? 'Choisir une photo depuis votre appareil (JPEG, PNG, WebP)'
                  : 'Choose a photo from your device (JPEG, PNG, WebP)'}
              </span>
            </button>

            {previewUrl && (
              <img
                src={previewUrl}
                alt="Aperçu"
                className="w-20 h-20 rounded-xl object-cover border-2 border-[#FF9F43] shrink-0"
              />
            )}

            <button
              type="submit"
              disabled={!selectedFile || !contributorName.trim() || isUploading}
              className="neon-bubble px-6 py-4 rounded-full bg-[#FF9F43] text-[#1A1008] text-xs sm:text-sm font-bold hover:bg-[#FFB870] disabled:opacity-50 cursor-pointer shrink-0 inline-flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isUploading
                  ? locale === 'fr'
                    ? 'Envoi vers Sanity...'
                    : 'Uploading to Sanity...'
                  : locale === 'fr'
                  ? 'Publier dans la galerie'
                  : 'Publish to Gallery'}
              </span>
            </button>
          </div>

          {uploadError && <p className="text-xs text-red-700 font-semibold">{uploadError}</p>}
        </form>
      )}

      <div className="mb-10 max-w-3xl">
        <p className="text-xs font-bold text-[#E67E22] tracking-wider uppercase mb-2">
          {t.gallery.sectionKicker}
        </p>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#1F1610] mb-3">
          {t.gallery.sectionTitle}
        </h1>
        <p className="text-sm sm:text-base text-[#5C4B3E]">{t.gallery.sectionIntro}</p>
      </div>

      {!canViewAlbum ? (
        <div className="neon-section max-w-md mx-auto my-12 p-8 rounded-3xl bg-white text-center">
          <div className="w-12 h-12 rounded-full bg-[#FFF2E2] text-[#E67E22] flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#1F1610] mb-2">
            {t.gallery.privateTitle}
          </h2>
          <p className="text-xs sm:text-sm text-[#5C4B3E] leading-relaxed mb-6">
            {t.gallery.privateSubtitle}
          </p>

          <form onSubmit={handleUnlockSubmit} className="space-y-3">
            <input
              type="text"
              required
              value={guestCode}
              onChange={(e) => setGuestCode(e.target.value)}
              placeholder={t.gallery.codePlaceholder}
              aria-label={t.gallery.codePlaceholder}
              className="w-full px-4 py-2.5 rounded-lg bg-[#FFF9F3] border border-[#FF9F43]/40 text-center font-mono text-sm uppercase tracking-wider focus:outline-none focus:border-[#FF9F43]"
            />
            {unlockError && (
              <p className="text-xs text-red-700 font-medium">{t.gallery.unlockError}</p>
            )}
            <button
              type="submit"
              disabled={unlocking}
              className="neon-bubble w-full py-2.5 px-4 rounded-full bg-[#FF9F43] text-[#1A1008] text-xs font-bold hover:bg-[#FFB870] transition-colors cursor-pointer"
            >
              {t.gallery.unlockButton}
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Filter Tabs */}
          <div className="mb-8 inline-flex flex-wrap items-center gap-1 p-1 bg-[#FFF2E2] rounded-xl border border-[#FF9F43]/30">
            {(
              [
                { id: 'all', label: t.gallery.filterAll },
                { id: 'official', label: t.gallery.filterOfficial },
                { id: 'preparation', label: t.gallery.filterPreparation },
                { id: 'defense', label: t.gallery.filterDefense },
                { id: 'group', label: t.gallery.filterGroup },
                { id: 'ceremony', label: t.gallery.filterCeremony },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  filter === tab.id
                    ? 'bg-[#FF9F43] text-[#1A1008] shadow-xs'
                    : 'text-[#1F1610] hover:text-[#E67E22]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filteredPhotos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPhotos.map((photo, idx) => (
                <figure
                  key={photo.id}
                  onClick={() => setLightboxIndex(idx)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setLightboxIndex(idx);
                    }
                  }}
                  className="neon-card group rounded-2xl overflow-hidden bg-white cursor-pointer"
                >
                  <div className="aspect-4/3 overflow-hidden bg-[#1A120B]">
                    <img
                      src={photo.thumbnailUrl || photo.imageUrl}
                      alt={photo.caption || settings.honoreeName}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <figcaption className="p-4">
                    {photo.caption && (
                      <p className="text-sm font-bold text-[#1F1610] mb-1 line-clamp-2">
                        {photo.caption}
                      </p>
                    )}
                    {photo.showContributorName && photo.contributorName && (
                      <p className="text-xs text-[#6B5B4E]">
                        {t.gallery.photoBy}{' '}
                        <strong className="text-[#E67E22]">{photo.contributorName}</strong>
                      </p>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className="neon-section p-12 rounded-3xl bg-white text-center">
              <Images className="w-10 h-10 text-[#FF9F43] mx-auto mb-3" />
              <p className="text-sm sm:text-base text-[#5C4B3E] mb-4">{t.gallery.emptyState}</p>
              {settings.allowPhotoContributions && (
                <button
                  type="button"
                  onClick={() => setShowQuickUpload(true)}
                  className="neon-bubble inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF9F43] text-[#1A1008] text-xs font-bold cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>{t.gallery.contributeCta}</span>
                </button>
              )}
            </div>
          )}

          <div className="neon-card mt-10 p-4 rounded-xl bg-[#FFF2E2] flex items-center gap-3 text-xs text-[#5C4B3E]">
            <ShieldAlert className="w-4 h-4 text-[#E67E22] shrink-0" />
            <span>{t.gallery.ethicsNotice}</span>
          </div>
        </>
      )}

      {/* Accessible Lightbox Modal */}
      {lightboxIndex !== null && filteredPhotos[lightboxIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4"
        >
          <div className="w-full max-w-5xl flex items-center justify-between text-white mb-4">
            <span className="font-mono text-xs text-[#FF9F43] tabular-nums">
              {lightboxIndex + 1} / {filteredPhotos.length}
            </span>
            <button
              type="button"
              onClick={handleCloseLightbox}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-[#FF9F43] hover:text-[#1A1008] text-xs font-bold cursor-pointer"
            >
              <span>{t.gallery.closeLightbox}</span>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative w-full max-w-4xl flex items-center justify-center">
            {filteredPhotos.length > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                aria-label={t.gallery.prevPhoto}
                className="absolute left-2 z-10 p-2.5 rounded-full bg-black/80 text-[#FF9F43] border border-[#FF9F43] hover:bg-[#FF9F43] hover:text-[#1A1008] cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <img
              src={filteredPhotos[lightboxIndex].imageUrl}
              alt={filteredPhotos[lightboxIndex].caption || settings.honoreeName}
              referrerPolicy="no-referrer"
              className="max-h-[75vh] max-w-full rounded-2xl object-contain border border-[#FF9F43]"
            />

            {filteredPhotos.length > 1 && (
              <button
                type="button"
                onClick={handleNext}
                aria-label={t.gallery.nextPhoto}
                className="absolute right-2 z-10 p-2.5 rounded-full bg-black/80 text-[#FF9F43] border border-[#FF9F43] hover:bg-[#FF9F43] hover:text-[#1A1008] cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="mt-4 text-center max-w-2xl text-white">
            {filteredPhotos[lightboxIndex].caption && (
              <p className="font-serif text-lg mb-1">{filteredPhotos[lightboxIndex].caption}</p>
            )}
            {filteredPhotos[lightboxIndex].showContributorName &&
              filteredPhotos[lightboxIndex].contributorName && (
                <p className="text-xs text-[#FFB870]">
                  {t.gallery.photoBy} {filteredPhotos[lightboxIndex].contributorName}
                </p>
              )}
          </div>
        </div>
      )}
    </div>
  );
};
