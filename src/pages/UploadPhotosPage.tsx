import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  UploadCloud,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { EventSettings, PhotoItem } from '../types';
import { processImageCleanExif } from '../utils/calendarAndShare';

interface QueuedFile {
  id: string;
  file: File;
  previewUrl: string;
  status: 'idle' | 'processing' | 'uploading' | 'success' | 'error';
  progress: number;
  errorMessage?: string;
}

interface UploadPhotosPageProps {
  settings: EventSettings;
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

export const UploadPhotosPage: React.FC<UploadPhotosPageProps> = ({
  settings,
  onUploadSinglePhoto,
  onNotify,
}) => {
  const { locale, t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [contributorName, setContributorName] = useState('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState<PhotoItem['category']>('ceremony');
  const [showContributorName, setShowContributorName] = useState(true);
  const [albumConsent, setAlbumConsent] = useState(false);
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [globalWarning, setGlobalWarning] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [batchCompleted, setBatchCompleted] = useState(false);

  const addFilesToQueue = (filesList: FileList | File[]) => {
    setGlobalWarning(null);
    const incoming = Array.from(filesList);

    const nextQueue = [...queuedFiles];
    for (const file of incoming) {
      if (nextQueue.length >= 10) {
        setGlobalWarning(
          locale === 'fr'
            ? 'Limite atteinte : maximum 10 photos par envoi.'
            : 'Limit reached: maximum 10 photos per batch.'
        );
        break;
      }

      const lower = file.name.toLowerCase();
      if (
        lower.endsWith('.heic') ||
        lower.endsWith('.heif') ||
        file.type === 'image/heic' ||
        file.type === 'image/heif'
      ) {
        setGlobalWarning(t.upload.heicWarning);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        setGlobalWarning(
          locale === 'fr'
            ? `Le fichier "${file.name}" dépasse la limite de 10 Mo.`
            : `File "${file.name}" exceeds the 10 MB limit.`
        );
        continue;
      }

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setGlobalWarning(
          locale === 'fr'
            ? `Format non pris en charge pour "${file.name}". Utilisez JPEG, PNG ou WebP.`
            : `Unsupported format for "${file.name}". Please use JPEG, PNG, or WebP.`
        );
        continue;
      }

      nextQueue.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        status: 'idle',
        progress: 0,
      });
    }

    setQueuedFiles(nextQueue);
  };

  const removeFileFromQueue = (id: string) => {
    setQueuedFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const processAndUploadItem = async (item: QueuedFile): Promise<boolean> => {
    setQueuedFiles((prev) =>
      prev.map((q) =>
        q.id === item.id ? { ...q, status: 'processing', progress: 25, errorMessage: undefined } : q
      )
    );

    try {
      const processed = await processImageCleanExif(item.file);

      setQueuedFiles((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading', progress: 65 } : q))
      );

      const res = await onUploadSinglePhoto({
        contributorName: contributorName.trim(),
        showContributorName,
        caption: caption.trim(),
        category,
        imageDataUrl: processed.imageDataUrl,
        thumbnailDataUrl: processed.thumbnailDataUrl,
        mimeType: processed.mimeType,
        width: processed.width,
        height: processed.height,
        fileSize: processed.fileSize,
        consentGiven: albumConsent,
      });

      if (res.ok) {
        setQueuedFiles((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'success', progress: 100 } : q))
        );
        return true;
      } else {
        setQueuedFiles((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: 'error',
                  progress: 0,
                  errorMessage:
                    res.error || (locale === 'fr' ? "Échec de l'envoi" : 'Upload failed'),
                }
              : q
          )
        );
        return false;
      }
    } catch (err) {
      const code = err instanceof Error ? err.message : 'ERROR';
      const msg =
        code === 'HEIC_NOT_SUPPORTED'
          ? t.upload.heicWarning
          : locale === 'fr'
          ? 'Fichier image invalide ou corrompu.'
          : 'Invalid or corrupted image file.';
      setQueuedFiles((prev) =>
        prev.map((q) =>
          q.id === item.id ? { ...q, status: 'error', progress: 0, errorMessage: msg } : q
        )
      );
      return false;
    }
  };

  const handleUploadAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributorName.trim() || !albumConsent || queuedFiles.length === 0) return;

    setBatchCompleted(false);
    const pendingItems = queuedFiles.filter((q) => q.status === 'idle' || q.status === 'error');
    let allSucceeded = true;

    for (const item of pendingItems) {
      const ok = await processAndUploadItem(item);
      if (!ok) allSucceeded = false;
    }

    if (allSucceeded && pendingItems.length > 0) {
      setBatchCompleted(true);
      onNotify(t.upload.uploadSuccess);
    }
  };

  const hasFailedFiles = queuedFiles.some((q) => q.status === 'error');
  const isUploadingAny = queuedFiles.some(
    (q) => q.status === 'processing' || q.status === 'uploading'
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
      <div className="mb-8 flex items-center justify-between">
        <Link
          to="/souvenirs"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#E67E22] hover:text-[#1F1610]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.nav.memories}</span>
        </Link>
      </div>

      <div className="mb-8">
        <p className="text-xs font-bold text-[#E67E22] tracking-wider uppercase mb-2">
          {t.upload.pageKicker}
        </p>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#1F1610] mb-3">
          {t.upload.pageTitle}
        </h1>
        <p className="text-sm sm:text-base text-[#5C4B3E] leading-relaxed">{t.upload.pageIntro}</p>
      </div>

      {!settings.allowPhotoContributions ? (
        <div className="neon-section p-8 rounded-3xl bg-white text-center text-sm text-[#5C4B3E]">
          {t.upload.closedNotice}
        </div>
      ) : (
        <form
          onSubmit={handleUploadAll}
          className="neon-section rounded-3xl bg-white p-6 sm:p-10 space-y-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="up-contributor"
                className="block text-xs font-bold text-[#1F1610] mb-1.5"
              >
                {t.upload.contributorName}
              </label>
              <input
                id="up-contributor"
                type="text"
                required
                maxLength={100}
                value={contributorName}
                onChange={(e) => setContributorName(e.target.value)}
                placeholder={t.upload.contributorPlaceholder}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#FFF9F3] border border-[#FF9F43]/40 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="up-category"
                className="block text-xs font-bold text-[#1F1610] mb-1.5"
              >
                {t.upload.category}
              </label>
              <select
                id="up-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as PhotoItem['category'])}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#FFF9F3] border border-[#FF9F43]/40 text-sm"
              >
                <option value="defense">{t.gallery.filterDefense}</option>
                <option value="group">{t.gallery.filterGroup}</option>
                <option value="ceremony">{t.gallery.filterCeremony}</option>
                <option value="preparation">{t.gallery.filterPreparation}</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="up-caption"
              className="block text-xs font-bold text-[#1F1610] mb-1.5"
            >
              {t.upload.caption}
            </label>
            <input
              id="up-caption"
              type="text"
              maxLength={300}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={t.upload.captionPlaceholder}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#FFF9F3] border border-[#FF9F43]/40 text-sm"
            />
          </div>

          {/* Drag and Drop Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files) addFilesToQueue(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={`neon-card p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-[#FF9F43] bg-[#FFF2E2]'
                : 'border-[#FF9F43]/40 bg-[#FFF9F3] hover:border-[#FF9F43]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                if (e.target.files) addFilesToQueue(e.target.files);
                e.target.value = '';
              }}
              className="hidden"
            />
            <UploadCloud className="w-10 h-10 text-[#FF9F43] mx-auto mb-3" />
            <p className="text-sm font-bold text-[#1F1610] mb-1">{t.upload.dropzoneTitle}</p>
            <p className="text-xs text-[#6B5B4E]">{t.upload.dropzoneFormats}</p>
          </div>

          {globalWarning && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#E67E22] shrink-0 mt-0.5" />
              <span>{globalWarning}</span>
            </div>
          )}

          {queuedFiles.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {queuedFiles.map((item) => (
                <div
                  key={item.id}
                  className="neon-card p-3 rounded-xl bg-[#FFF9F3] flex items-center gap-3"
                >
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="w-16 h-16 rounded-lg object-cover shrink-0 border border-[#FF9F43]/30"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#1F1610] truncate">{item.file.name}</p>
                    <p className="font-mono text-[11px] text-[#6B5B4E] tabular-nums">
                      {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>

                    <div className="w-full h-1.5 bg-[#FF9F43]/20 rounded-full overflow-hidden mt-1.5">
                      <div
                        className={`h-full transition-all duration-200 ${
                          item.status === 'error'
                            ? 'bg-red-600'
                            : item.status === 'success'
                            ? 'bg-emerald-700'
                            : 'bg-[#FF9F43]'
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>

                    {item.errorMessage && (
                      <p className="text-[11px] text-red-700 mt-1">{item.errorMessage}</p>
                    )}
                  </div>

                  {item.status === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                  ) : (
                    <button
                      type="button"
                      disabled={item.status === 'processing' || item.status === 'uploading'}
                      onClick={() => removeFileFromQueue(item.id)}
                      title={t.upload.removeFile}
                      className="p-1.5 text-[#6B5B4E] hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 pt-2 border-t border-[#FF9F43]/30">
            <label className="flex items-start gap-2.5 text-xs text-[#1F1610] cursor-pointer">
              <input
                type="checkbox"
                checked={showContributorName}
                onChange={(e) => setShowContributorName(e.target.checked)}
                className="mt-0.5 rounded border-[#FF9F43]"
              />
              <span>{t.upload.showNameConsent}</span>
            </label>

            <label className="flex items-start gap-2.5 text-xs text-[#1F1610] cursor-pointer">
              <input
                type="checkbox"
                required
                checked={albumConsent}
                onChange={(e) => setAlbumConsent(e.target.checked)}
                className="mt-0.5 rounded border-[#FF9F43]"
              />
              <span>{t.upload.albumConsent}</span>
            </label>
          </div>

          {batchCompleted && (
            <div className="p-4 rounded-xl bg-[#FFF2E2] border border-[#FF9F43] text-xs sm:text-sm font-bold text-[#9A4D06] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#E67E22] shrink-0" />
              <span>{t.upload.uploadSuccess}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isUploadingAny || queuedFiles.length === 0 || !albumConsent}
              className="neon-bubble inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#FF9F43] text-[#1A1008] text-xs sm:text-sm font-bold hover:bg-[#FFB870] disabled:opacity-50 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>
                {isUploadingAny
                  ? t.upload.uploading
                  : hasFailedFiles
                  ? t.upload.retryFailed
                  : t.upload.uploadButton}
              </span>
            </button>

            {hasFailedFiles && !isUploadingAny && (
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-3 rounded-full border border-[#FF9F43] text-[#E67E22] text-xs font-bold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t.upload.retryFailed}</span>
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};
