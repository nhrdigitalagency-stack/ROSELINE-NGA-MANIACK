import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  BookOpen,
  Clock,
  MapPin,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Share2,
  MessageSquareHeart,
  Send,
  Sparkles,
  Camera,
  ExternalLink,
  QrCode,
  FileText,
  Pause,
  Play,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import {
  EventSettings,
  Announcement,
  Testimonial,
  PhotoItem,
} from '../types';
import {
  downloadDefenseIcs,
  buildWhatsAppRsvpText,
  buildWhatsAppUrl,
  downloadSouvenirCardPng,
} from '../utils/calendarAndShare';
import { MonogramRnm, OpenBookDivider, CelebrationCanvas } from '../components/Layout';
import { HeroBubbleMenu } from '../components/BubbleMenu';

const HERO_VIDEO_URL =
  '/assets/aistudio/Graduate_woman_holding_diploma_1080p_20261026104405_6280c793.mp4';
const JURY_DEFENSE_PHOTO_URL = '/assets/aistudio/Soutenance_devant_le_jury_24daadeb.png';
const FAMILY_PRIDE_PHOTO_URL =
  '/assets/aistudio/Portrait_familial_de_fiert__et_de_r_ussite_02488a8f.png';

interface HomePageProps {
  settings: EventSettings;
  announcements: Announcement[];
  testimonials: Testimonial[];
  photos: PhotoItem[];
  galleryUnlocked: boolean;
  onNotify: (msg: string) => void;
  onSubmitRsvp: (payload: {
    firstName: string;
    lastName?: string;
    attendance: 'present' | 'absent' | 'maybe';
    guestsCount: number;
    message?: string;
    channel: 'database' | 'whatsapp';
  }) => Promise<boolean>;
}

export const HomePage: React.FC<HomePageProps> = ({
  settings,
  testimonials,
  photos,
  galleryUnlocked,
  onNotify,
  onSubmitRsvp,
}) => {
  const { locale, t, formatDate } = useI18n();
  const shouldReduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [dissertationExpanded, setDissertationExpanded] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [copiedDirections, setCopiedDirections] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeMilestoneIdx, setActiveMilestoneIdx] = useState<number>(0);
  const milestoneRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const elements = milestoneRefs.current.filter(Boolean) as HTMLDivElement[];
    if (elements.length === 0 || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idxAttr = entry.target.getAttribute('data-milestone-idx');
            if (idxAttr !== null) {
              const parsed = Number(idxAttr);
              if (!Number.isNaN(parsed)) {
                setActiveMilestoneIdx((prev) => Math.max(prev, parsed));
              }
            }
          }
        });
      },
      { threshold: 0.55 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [settings.milestones?.length]);

  // RSVP Form State
  const [rsvpFirstName, setRsvpFirstName] = useState('');
  const [rsvpLastName, setRsvpLastName] = useState('');
  const [rsvpAttendance, setRsvpAttendance] = useState<'present' | 'absent' | 'maybe'>('present');
  const [rsvpGuests, setRsvpGuests] = useState(0);
  const [rsvpMessage, setRsvpMessage] = useState('');
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpSaved, setRsvpSaved] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [copiedWhatsappMsg, setCopiedWhatsappMsg] = useState(false);

  const formattedDate = formatDate(settings.eventDate);

  const dissertationTitle =
    locale === 'fr'
      ? settings.dissertationTitle
      : settings.dissertationTitleEn || settings.dissertationTitle;
  const dissertationSubtitle =
    locale === 'fr'
      ? settings.dissertationSubtitle
      : settings.dissertationSubtitleEn || settings.dissertationSubtitle;
  const dissertationDomain =
    locale === 'fr'
      ? settings.dissertationDomain
      : settings.dissertationDomainEn || settings.dissertationDomain;
  const dissertationProblematic =
    locale === 'fr'
      ? settings.dissertationProblematic
      : settings.dissertationProblematicEn || settings.dissertationProblematic;
  const dissertationSummary =
    locale === 'fr'
      ? settings.dissertationSummary
      : settings.dissertationSummaryEn || settings.dissertationSummary;
  const dissertationObjectives =
    locale === 'fr'
      ? settings.dissertationObjectives
      : settings.dissertationObjectivesEn?.length
      ? settings.dissertationObjectivesEn
      : settings.dissertationObjectives;
  const dissertationKeywords =
    locale === 'fr'
      ? settings.dissertationKeywords
      : settings.dissertationKeywordsEn?.length
      ? settings.dissertationKeywordsEn
      : settings.dissertationKeywords;

  const toggleHeroVideo = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setIsVideoPlaying(true);
    } else {
      v.pause();
      setIsVideoPlaying(false);
    }
  };

  const handleCopyDirections = async () => {
    const text = [
      `${settings.honoreeName} — ${t.meta.eventLabel} (${t.meta.discipline})`,
      `${t.practical.cardDate} : ${formattedDate}`,
      `${t.practical.cardTime} : ${settings.startTime} – ${settings.endTime} (${settings.timeZone})`,
      `${t.practical.cardInstitution} : ${settings.institutionOfficialName || settings.institutionName}`,
      `${t.practical.cardVenue} : ${settings.amphitheatre} / ${settings.room}${
        settings.sameSpaceConfirmed ? ' (même espace — INSECK)' : ''
      }`,
      settings.address ? `${t.practical.cardAddress} : ${settings.address}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopiedDirections(true);
      onNotify(t.practical.copiedDirections);
      setTimeout(() => setCopiedDirections(false), 2500);
    } catch {
      // ignore clipboard error
    }
  };

  const handleRsvpDatabaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpFirstName.trim()) return;
    setRsvpSubmitting(true);
    setRsvpError(null);
    setRsvpSaved(false);
    try {
      const ok = await onSubmitRsvp({
        firstName: rsvpFirstName.trim(),
        lastName: rsvpLastName.trim(),
        attendance: rsvpAttendance,
        guestsCount: rsvpAttendance === 'present' ? rsvpGuests : 0,
        message: rsvpMessage.trim(),
        channel: 'database',
      });
      if (ok) {
        setRsvpSaved(true);
        onNotify(t.rsvp.successSaved);
      } else {
        setRsvpError(
          locale === 'fr'
            ? "L'enregistrement n'a pas pu aboutir. Veuillez réessayer ou utiliser WhatsApp."
            : 'Could not save confirmation. Please try again or use WhatsApp.'
        );
      }
    } catch {
      setRsvpError(
        locale === 'fr' ? 'Erreur de connexion au serveur.' : 'Server connection error.'
      );
    } finally {
      setRsvpSubmitting(false);
    }
  };

  const whatsappPreviewText = buildWhatsAppRsvpText(
    {
      firstName: rsvpFirstName || (locale === 'fr' ? 'Invité(e)' : 'Guest'),
      lastName: rsvpLastName,
      attendance: rsvpAttendance,
      guestsCount: rsvpGuests,
      message: rsvpMessage,
    },
    settings,
    locale
  );

  const whatsappHref = buildWhatsAppUrl(settings.whatsappNumber, whatsappPreviewText);

  const handleCopyWhatsappText = async () => {
    try {
      await navigator.clipboard.writeText(whatsappPreviewText);
      setCopiedWhatsappMsg(true);
      onNotify(t.rsvp.copiedMessage);
      setTimeout(() => setCopiedWhatsappMsg(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleShareSite = async () => {
    const shareUrl = settings.siteUrl || window.location.origin;
    const shareData = {
      title: t.meta.siteTitle,
      text: `${settings.honoreeName} — ${t.meta.eventLabel} (${formattedDate})`,
      url: shareUrl,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      onNotify(t.souvenirCard.linkCopied);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div>
      {/* Voluntary Celebration Effect */}
      <CelebrationCanvas active={celebrating} onComplete={() => setCelebrating(false)} />

      {/* Event Day Banner */}
      {settings.eventStatus === 'event_day' && (
        <div className="bg-[#1A120B] text-white border-b border-[#FF9F43] py-3 px-4">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#FF9F43]" />
              <span className="font-semibold text-[#FF9F43]">{t.hero.statusEventDay}</span>
              <span>·</span>
              <span>
                {settings.startTime} – {settings.endTime} · {settings.amphitheatre} ({settings.room})
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                document.getElementById('infos-pratiques')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="underline decoration-[#FF9F43] underline-offset-4 text-[#FFB870] font-medium"
            >
              {t.practical.sectionTitle} →
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          HERO SECTION — FULL-BLEED VIDEO BACKGROUND + BLACK OVERLAY rgba(0,0,0,0.4)
          + ORANGE (#FF9F43) TYPOGRAPHY & SINGLE-LINE INTERACTIVE BUBBLE HEADER
      ===================================================================== */}
      <section className="relative min-h-[90vh] flex flex-col justify-between overflow-hidden bg-black text-white border-b-2 border-[#FF9F43] shadow-[0_6px_35px_rgba(255,159,67,0.35)]">
        {/* Background Video of Roseline (MP4/WebM, loop, muted, playsInline) */}
        <video
          ref={videoRef}
          poster={settings.portraitUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-center"
        >
          <source src={HERO_VIDEO_URL} type="video/mp4" />
        </video>

        {/* Black Overlay rgba(0, 0, 0, 0.4) */}
        <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

        {/* Top Single-Line Interactive Bubble Header (with 3-horizontal-line hamburger on mobile) */}
        <div className="relative z-40 w-full pt-3">
          <HeroBubbleMenu settings={settings} onNotify={onNotify} />
        </div>

        {/* Center Hero Typography Overlay with Orange (#FF9F43) Palette */}
        <div className="relative z-20 max-w-5xl mx-auto w-full px-4 sm:px-8 py-12 sm:py-16 text-center flex flex-col items-center">
          {/* Monogram RNM + Kicker */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-black/45 border border-[#FF9F43] shadow-[0_0_20px_rgba(255,159,67,0.5)] mb-6 backdrop-blur-xs"
          >
            <MonogramRnm className="w-9 h-9 shrink-0" light />
            <div className="text-xs sm:text-sm font-semibold text-[#FF9F43] tracking-wide">
              <span>{t.hero.kicker}</span>
              <span className="mx-2 text-white">·</span>
              <span className="text-[#FFB870]">{t.hero.mention}</span>
            </div>
          </motion.div>

          {/* Candidate Name H1 in #FF9F43 Orange */}
          <motion.h1
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06 }}
            className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold text-[#FF9F43] leading-[1.05] tracking-tight mb-4 text-balance drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]"
          >
            {settings.honoreeName}
          </motion.h1>

          {/* Subtitle in Light Orange */}
          <motion.p
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            className="font-serif italic text-xl sm:text-3xl text-[#FFB870] mb-6 drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)]"
          >
            {t.hero.subtitle}
          </motion.p>

          {/* Confirmed Success / Laureate Callout */}
          {settings.resultStatus === 'confirmed_success' && (
            <div className="neon-card mb-6 p-4 rounded-xl bg-black/50 text-white max-w-2xl w-full backdrop-blur-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-left">
                  {settings.laureateTitleConfirmed && (
                    <p className="text-xs font-bold tracking-wider text-[#FF9F43] mb-1">
                      {t.hero.laureateBadge} · {settings.honoreeName}
                    </p>
                  )}
                  <p className="text-sm font-medium text-white">
                    {locale === 'fr'
                      ? settings.resultPublicText ||
                        'Soutenance validée avec succès. Merci à toutes et à tous pour votre présence et vos encouragements.'
                      : settings.resultPublicTextEn ||
                        settings.resultPublicText ||
                        'Dissertation defense successfully completed. Thank you all for your support.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCelebrating(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#FF9F43] text-[#1A1008] text-xs font-bold hover:bg-[#FFB870] transition-colors shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t.hero.btnCelebrate}</span>
                </button>
              </div>
            </div>
          )}

          {/* Invitation Copy */}
          <motion.p
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="text-base sm:text-lg text-white leading-relaxed max-w-2xl mb-7 drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]"
          >
            {t.hero.invitationText}
          </motion.p>

          {/* Dissertation Topic Box with Neon Orange Hover Border */}
          {dissertationTitle && (
            <div className="neon-card mb-8 p-5 sm:p-6 rounded-2xl bg-black/45 backdrop-blur-sm max-w-3xl w-full text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-[#FF9F43] mb-2">
                {locale === 'fr' ? 'Thème du mémoire de licence' : 'Undergraduate Dissertation Topic'}
              </p>
              <p className="font-serif text-xl sm:text-2xl font-semibold text-[#FFB870] leading-snug">
                « {dissertationTitle} »
              </p>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <Link
              to="/memoire"
              className="neon-bubble inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#FF9F43] text-[#1A1008] text-sm font-bold hover:bg-[#FFB870] transition-all whitespace-nowrap"
            >
              <BookOpen className="w-4 h-4" />
              <span>{t.hero.btnDiscover}</span>
            </Link>

            <button
              type="button"
              onClick={() =>
                document
                  .getElementById('infos-pratiques')
                  ?.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth' })
              }
              className="neon-card inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-black/45 text-[#FF9F43] hover:bg-[#FF9F43] hover:text-[#1A1008] text-sm font-semibold backdrop-blur-xs transition-all whitespace-nowrap cursor-pointer"
            >
              <MapPin className="w-4 h-4" />
              <span>{t.hero.btnInfo}</span>
            </button>

            <Link
              to="/temoignages"
              className="neon-card inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-black/45 text-[#FFB870] hover:bg-[#FF9F43] hover:text-[#1A1008] text-sm font-semibold backdrop-blur-xs transition-all whitespace-nowrap"
            >
              <MessageSquareHeart className="w-4 h-4" />
              <span>{t.hero.btnEncourage}</span>
            </Link>

            <button
              type="button"
              onClick={toggleHeroVideo}
              aria-label={isVideoPlaying ? 'Mettre la vidéo en pause' : 'Lire la vidéo'}
              className="p-3 rounded-full bg-black/45 text-[#FF9F43] border border-[#FF9F43]/60 hover:border-[#FF9F43] hover:text-white transition-colors cursor-pointer"
              title={isVideoPlaying ? 'Pause vidéo' : 'Lecture vidéo'}
            >
              {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Bottom Hero Key Details Strip with Neon Hover Cards */}
        <div className="relative z-20 max-w-7xl mx-auto w-full px-4 sm:px-8 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="neon-card p-4 rounded-xl bg-black/45 backdrop-blur-xs">
              <p className="text-xs text-[#FF9F43] font-semibold mb-1">{t.practical.cardDate}</p>
              <p className="font-serif text-lg font-bold text-white capitalize">{formattedDate}</p>
              <p className="text-xs text-[#FFB870] mt-1">
                {settings.eventDate ? t.hero.statusUpcoming : t.hero.dateToConfirm}
              </p>
            </div>

            <div className="neon-card p-4 rounded-xl bg-black/45 backdrop-blur-xs">
              <p className="text-xs text-[#FF9F43] font-semibold mb-1">{t.practical.cardTime}</p>
              <p className="font-mono text-base font-bold text-white tabular-nums">
                {settings.startTime.replace(':', ' h ')} – {settings.endTime.replace(':', ' h ')}
              </p>
              <p className="text-xs text-[#FFB870] mt-1">{t.program.timezoneNote}</p>
            </div>

            <div className="neon-card p-4 rounded-xl bg-black/45 backdrop-blur-xs">
              <p className="text-xs text-[#FF9F43] font-semibold mb-1">
                {t.practical.cardInstitution}
              </p>
              <p className="text-sm font-bold text-white">{settings.institutionName}</p>
              <p className="text-xs text-[#FFB870] mt-1">{settings.institutionOfficialName}</p>
            </div>

            <div className="neon-card p-4 rounded-xl bg-black/45 backdrop-blur-xs">
              <p className="text-xs text-[#FF9F43] font-semibold mb-1">{t.practical.cardVenue}</p>
              <p className="text-sm font-bold text-white">
                {settings.amphitheatre} · {settings.room}
              </p>
              <p className="text-xs text-[#FFB870] mt-1">
                {settings.locationConfirmed && settings.sameSpaceConfirmed
                  ? t.hero.locationSameSpace
                  : t.hero.locationToConfirm}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 6: PRÉSENTATION DU MÉMOIRE ("Au cœur de mon mémoire")
          WITH NEON HOVER BORDER + JURY DEFENSE PHOTO
      ===================================================================== */}
      <section id="memoire" className="py-16 sm:py-20 px-4 sm:px-8">
        <div className="neon-section max-w-6xl mx-auto rounded-3xl bg-white p-6 sm:p-12">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <p className="text-xs font-bold text-[#E67E22] tracking-wider uppercase mb-2">
              {t.dissertation.sectionKicker}
            </p>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#1F1610] text-balance">
              {t.dissertation.sectionTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 cols: Dissertation Details */}
            <div className="lg:col-span-7 neon-card rounded-2xl bg-[#FFF9F3] p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B5B4E] mb-4">
                <span className="font-bold text-[#E67E22]">{t.dissertation.domainLabel}</span>
                <span aria-hidden="true">·</span>
                <span>{dissertationDomain}</span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1F1610] leading-snug mb-3 text-balance">
                {dissertationTitle || t.dissertation.upcomingTheme}
              </h3>

              {dissertationSubtitle && (
                <p className="font-serif italic text-lg text-[#E67E22] mb-5">
                  {dissertationSubtitle}
                </p>
              )}

              {dissertationProblematic && (
                <div className="neon-card my-5 p-5 rounded-xl bg-[#FFF2E2]">
                  <p className="text-xs font-bold text-[#9A4D06] mb-1.5">
                    {t.dissertation.problematicLabel}
                  </p>
                  <p className="font-serif italic text-lg text-[#1F1610] leading-relaxed">
                    « {dissertationProblematic} »
                  </p>
                </div>
              )}

              {dissertationSummary && (
                <div className="mb-5">
                  <h4 className="text-xs font-bold text-[#6B5B4E] mb-2">
                    {t.dissertation.summaryLabel}
                  </h4>
                  <p className="text-sm sm:text-base text-[#1F1610] leading-relaxed">
                    {dissertationSummary}
                  </p>
                </div>
              )}

              {dissertationKeywords && dissertationKeywords.length > 0 && (
                <div className="mb-5 pt-4 border-t border-[#FF9F43]/30">
                  <span className="text-xs font-bold text-[#9A4D06] mr-3">
                    {t.dissertation.keywordsLabel} :
                  </span>
                  <span className="text-xs text-[#1F1610] font-semibold">
                    {dissertationKeywords.join('  ·  ')}
                  </span>
                </div>
              )}

              <div className="pt-4 border-t border-[#FF9F43]/30 flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setDissertationExpanded((prev) => !prev)}
                  aria-expanded={dissertationExpanded}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#9A4D06] hover:text-[#E67E22] transition-colors cursor-pointer"
                >
                  <span>
                    {dissertationExpanded ? t.dissertation.readLess : t.dissertation.readMore}
                  </span>
                  {dissertationExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#FF9F43]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#FF9F43]" />
                  )}
                </button>

                <div className="flex flex-wrap items-center gap-3">
                  {settings.allowPdfDownload && settings.dissertationPdfUrl && (
                    <a
                      href={settings.dissertationPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#FF9F43] text-[#1A1008] text-xs font-bold hover:bg-[#FFB870] transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{t.dissertation.downloadPdf}</span>
                    </a>
                  )}
                  <Link
                    to="/memoire"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E67E22] hover:text-[#1F1610] underline underline-offset-4"
                  >
                    <span>{t.dissertation.viewFullPage}</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>

              <AnimatePresence>
                {dissertationExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-6 pt-6 border-t border-[#FF9F43]/30 space-y-4"
                  >
                    {dissertationObjectives.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-[#9A4D06] mb-2.5">
                          {t.dissertation.objectivesLabel}
                        </h4>
                        <ul className="space-y-2 text-sm text-[#1F1610]">
                          {dissertationObjectives.map((obj, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <span className="font-mono text-xs text-[#E67E22] font-bold mt-0.5">
                                0{i + 1}.
                              </span>
                              <span>{obj}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right 5 cols: Jury Defense Visual Card */}
            <div className="lg:col-span-5 space-y-5">
              <div className="neon-card rounded-2xl overflow-hidden bg-[#1A120B] text-white">
                <img
                  src={JURY_DEFENSE_PHOTO_URL}
                  alt="Roseline Nga Maniack — Soutenance devant le jury"
                  referrerPolicy="no-referrer"
                  className="w-full aspect-4/3 object-cover object-top"
                />
                <div className="p-5">
                  <p className="text-xs font-bold text-[#FF9F43] mb-1">
                    {locale === 'fr'
                      ? 'Présentation devant le jury académique'
                      : 'Presentation before the examination committee'}
                  </p>
                  <p className="font-serif italic text-base text-white/90 leading-relaxed">
                    « {t.dissertation.cardQuote} »
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 7: PARCOURS & REMERCIEMENTS + FAMILY PRIDE PORTRAIT
      ===================================================================== */}
      <section id="parcours" className="py-12 sm:py-16 px-4 sm:px-8">
        <div className="neon-section max-w-6xl mx-auto rounded-3xl bg-[#FFF4E8] p-6 sm:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left: Academic Path Timeline */}
            <div className="lg:col-span-6">
              <p className="text-xs font-bold text-[#E67E22] tracking-wider uppercase mb-2">
                {t.journey.sectionKicker}
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1F1610] mb-4">
                {t.journey.sectionTitle}
              </h2>
              <p className="text-sm sm:text-base text-[#5C4B3E] leading-relaxed mb-8">
                {t.journey.neutralIntro}
              </p>

              {settings.milestones && settings.milestones.length > 0 && (
                <div className="relative pl-6 border-l-2 border-[#FF9F43] space-y-6">
                  {settings.milestones.map((m, idx) => (
                    <div
                      key={m.id}
                      className="neon-card relative p-4 rounded-xl bg-white"
                    >
                      <span
                        className="absolute -left-[33px] top-5 w-4 h-4 rounded-full bg-[#FF9F43] border-2 border-white shadow-[0_0_10px_rgba(255,159,67,0.8)]"
                        aria-hidden="true"
                      />
                      <p className="font-mono text-xs text-[#E67E22] font-bold mb-1">
                        0{idx + 1} · {locale === 'fr' ? m.subtitleFr : m.subtitleEn || m.subtitleFr}
                      </p>
                      <h3 className="font-serif text-xl font-bold text-[#1F1610] mb-1">
                        {locale === 'fr' ? m.titleFr : m.titleEn || m.titleFr}
                      </h3>
                      <p className="text-sm text-[#3D2E22] leading-relaxed">
                        {locale === 'fr' ? m.descriptionFr : m.descriptionEn || m.descriptionFr}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Gratitude & Family Pride Portrait */}
            <div className="lg:col-span-6">
              <div className="neon-card rounded-2xl bg-[#1A120B] text-white overflow-hidden">
                <img
                  src={FAMILY_PRIDE_PHOTO_URL}
                  alt="Roseline Nga Maniack entourée de ses proches"
                  referrerPolicy="no-referrer"
                  className="w-full aspect-16/10 object-cover object-top border-b border-[#FF9F43]/40"
                />
                <div className="p-6 sm:p-8">
                  <p className="text-xs font-bold text-[#FF9F43] tracking-wider uppercase mb-2">
                    {t.journey.gratitudeKicker}
                  </p>
                  <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-white mb-4">
                    {t.journey.gratitudeTitle}
                  </h3>
                  <p className="text-sm sm:text-base text-white/90 leading-relaxed mb-6">
                    {locale === 'fr'
                      ? settings.acknowledgementsTextFr || t.journey.defaultGratitude
                      : settings.acknowledgementsTextEn ||
                        settings.acknowledgementsTextFr ||
                        t.journey.defaultGratitude}
                  </p>
                  <div className="pt-4 border-t border-[#FF9F43]/30 flex items-center justify-between">
                    <span className="font-serif italic text-lg text-[#FFB870]">
                      {settings.honoreeName}
                    </span>
                    <span className="text-xs text-[#FF9F43]">{t.meta.discipline}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 8: PROGRAMME ET HORAIRE (NEON BORDER ON HOVER)
      ===================================================================== */}
      <section id="programme" className="py-12 sm:py-16 px-4 sm:px-8">
        <div className="neon-section max-w-6xl mx-auto rounded-3xl bg-white p-6 sm:p-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-xs font-bold text-[#E67E22] tracking-wider uppercase mb-2">
                {t.program.sectionKicker}
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1F1610]">
                {t.program.sectionTitle}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="neon-card px-4 py-2.5 rounded-xl bg-[#FFF2E2]">
                <span className="text-xs text-[#9A4D06] font-semibold block">
                  {t.program.announcedSlotLabel}
                </span>
                <span className="font-mono text-base font-bold text-[#1F1610] tabular-nums">
                  {settings.startTime.replace(':', ' h ')} – {settings.endTime.replace(':', ' h ')}
                </span>
              </div>

              {settings.eventDate ? (
                <button
                  type="button"
                  onClick={() => {
                    if (downloadDefenseIcs(settings, locale)) {
                      onNotify(
                        locale === 'fr'
                          ? 'Fichier agenda (.ics) téléchargé.'
                          : 'Calendar (.ics) file downloaded.'
                      );
                    }
                  }}
                  className="neon-bubble inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#FF9F43] text-[#1A1008] text-xs font-bold hover:bg-[#FFB870] transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{t.program.exportIcs}</span>
                </button>
              ) : (
                <span className="text-xs text-[#6B5B4E] italic">{t.program.exportDisabled}</span>
              )}
            </div>
          </div>

          {settings.programSteps && settings.programSteps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {settings.programSteps.map((step, index) => (
                <div
                  key={step.id}
                  className="neon-card p-5 rounded-2xl bg-[#FFF9F3] flex items-start gap-4"
                >
                  <div className="w-9 h-9 rounded-full bg-[#FF9F43] text-[#1A1008] font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_12px_rgba(255,159,67,0.6)]">
                    0{index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <h3 className="font-serif text-lg font-bold text-[#1F1610]">
                        {locale === 'fr' ? step.titleFr : step.titleEn || step.titleFr}
                      </h3>
                      <span className="text-[11px] text-[#E67E22] font-semibold">
                        {step.confirmed
                          ? t.program.stepStatusConfirmed
                          : t.program.stepStatusToConfirm}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#5C4B3E] leading-relaxed">
                      {locale === 'fr'
                        ? step.descriptionFr
                        : step.descriptionEn || step.descriptionFr}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-[#FFF9F3] text-sm text-[#5C4B3E]">
              {t.program.unconfirmedNote}
            </div>
          )}

          <p className="text-xs text-[#6B5B4E] italic">{t.program.respectNote}</p>
        </div>
      </section>

      {/* =====================================================================
          SECTION 9: INFORMATIONS PRATIQUES (NEON CARDS ON HOVER)
      ===================================================================== */}
      <section id="infos-pratiques" className="py-12 sm:py-16 px-4 sm:px-8">
        <div className="neon-section max-w-6xl mx-auto rounded-3xl bg-[#FFF4E8] p-6 sm:p-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-bold text-[#E67E22] tracking-wider uppercase mb-2">
                {t.practical.sectionKicker}
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1F1610]">
                {t.practical.sectionTitle}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleCopyDirections}
                className="neon-card inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white text-xs font-bold text-[#1F1610] cursor-pointer"
              >
                {copiedDirections ? (
                  <Check className="w-4 h-4 text-[#E67E22]" />
                ) : (
                  <Copy className="w-4 h-4 text-[#E67E22]" />
                )}
                <span>
                  {copiedDirections ? t.practical.copiedDirections : t.practical.copyDirections}
                </span>
              </button>

              {settings.mapsUrl && (
                <a
                  href={settings.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neon-bubble inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#FF9F43] text-[#1A1008] text-xs font-bold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{t.practical.openMaps}</span>
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="neon-card p-6 rounded-2xl bg-white">
              <p className="text-xs font-bold text-[#E67E22] mb-2">
                {t.practical.cardInstitution} & {t.practical.cardVenue}
              </p>
              <h3 className="font-serif text-xl font-bold text-[#1F1610] mb-1">
                {settings.institutionName}
              </h3>
              <p className="text-xs font-semibold text-[#9A4D06] mb-4">
                {settings.institutionOfficialName || t.practical.cardOfficialName}
              </p>
              <div className="pt-3 border-t border-[#FF9F43]/30">
                <p className="text-sm font-bold text-[#1F1610]">
                  {settings.amphitheatre} · {settings.room}
                </p>
                <p className="text-xs text-[#5C4B3E] mt-1">
                  {settings.locationConfirmed && settings.sameSpaceConfirmed
                    ? t.practical.cardVenueConfirmedNote
                    : t.practical.cardVenueUnconfirmedNote}
                </p>
              </div>
            </div>

            <div className="neon-card p-6 rounded-2xl bg-white">
              <p className="text-xs font-bold text-[#E67E22] mb-2">
                {t.practical.cardDate} & {t.practical.cardAccess}
              </p>
              <h3 className="font-serif text-xl font-bold text-[#1F1610] capitalize mb-1">
                {formattedDate}
              </h3>
              <p className="font-mono text-xs font-bold text-[#9A4D06] mb-4 tabular-nums">
                {settings.startTime} – {settings.endTime} ({settings.timeZone})
              </p>
              <div className="pt-3 border-t border-[#FF9F43]/30">
                <p className="text-xs text-[#3D2E22] leading-relaxed">
                  {locale === 'fr'
                    ? settings.publicAccessInformation
                    : settings.publicAccessInformationEn || settings.publicAccessInformation}
                </p>
              </div>
            </div>

            <div className="neon-card p-6 rounded-2xl bg-white flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-[#E67E22] mb-2">
                  {t.practical.cardAddress} & {t.practical.cardContact}
                </p>
                <h3 className="font-serif text-xl font-bold text-[#1F1610] mb-2">
                  {settings.address || 'Campus de Ngoa-Ekellé — INSECK'}
                </h3>
                {settings.contactName && (
                  <p className="text-xs text-[#5C4B3E] mb-3">{settings.contactName}</p>
                )}
              </div>

              {settings.whatsappNumber && (
                <div className="pt-4 border-t border-[#FF9F43]/30">
                  <a
                    href={buildWhatsAppUrl(
                      settings.whatsappNumber,
                      locale === 'fr'
                        ? `Bonjour, je souhaite obtenir une information concernant la soutenance de ${settings.honoreeName} le 23 décembre 2026.`
                        : `Hello, I would like information regarding ${settings.honoreeName}'s dissertation defense on December 23, 2026.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neon-bubble inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full bg-[#FF9F43] text-[#1A1008] text-xs font-bold hover:bg-[#FFB870] transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {t.practical.whatsappDirect} ({settings.whatsappNumber})
                    </span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 10: CONFIRMATION DE PRÉSENCE (RSVP + WHATSAPP)
      ===================================================================== */}
      {settings.allowRsvp && (
        <section id="confirmation-presence" className="py-12 sm:py-16 px-4 sm:px-8">
          <div className="neon-section max-w-4xl mx-auto rounded-3xl bg-white p-6 sm:p-12">
            <div className="text-center mb-8">
              <p className="text-xs font-bold text-[#E67E22] tracking-wider uppercase mb-2">
                {t.rsvp.sectionKicker}
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1F1610] mb-3">
                {t.rsvp.sectionTitle}
              </h2>
              <p className="text-xs sm:text-sm text-[#5C4B3E]">{t.rsvp.disclaimer}</p>
            </div>

            <form
              onSubmit={handleRsvpDatabaseSubmit}
              className="neon-card rounded-2xl bg-[#FFF9F3] p-6 sm:p-8 space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="rsvp-firstname"
                    className="block text-xs font-bold text-[#1F1610] mb-1.5"
                  >
                    {t.rsvp.firstName}
                  </label>
                  <input
                    id="rsvp-firstname"
                    type="text"
                    required
                    maxLength={80}
                    value={rsvpFirstName}
                    onChange={(e) => setRsvpFirstName(e.target.value)}
                    placeholder={t.rsvp.firstNamePlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#FF9F43]/40 text-sm text-[#1F1610] focus:outline-none focus:border-[#FF9F43]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="rsvp-lastname"
                    className="block text-xs font-bold text-[#1F1610] mb-1.5"
                  >
                    {t.rsvp.lastName}
                  </label>
                  <input
                    id="rsvp-lastname"
                    type="text"
                    maxLength={80}
                    value={rsvpLastName}
                    onChange={(e) => setRsvpLastName(e.target.value)}
                    placeholder={t.rsvp.lastNamePlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#FF9F43]/40 text-sm text-[#1F1610] focus:outline-none focus:border-[#FF9F43]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="rsvp-attendance"
                    className="block text-xs font-bold text-[#1F1610] mb-1.5"
                  >
                    {t.rsvp.attendance}
                  </label>
                  <select
                    id="rsvp-attendance"
                    value={rsvpAttendance}
                    onChange={(e) =>
                      setRsvpAttendance(e.target.value as 'present' | 'absent' | 'maybe')
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#FF9F43]/40 text-sm text-[#1F1610] focus:outline-none focus:border-[#FF9F43]"
                  >
                    <option value="present">{t.rsvp.present}</option>
                    <option value="maybe">{t.rsvp.maybe}</option>
                    <option value="absent">{t.rsvp.absent}</option>
                  </select>
                </div>

                {settings.allowAcccompanyingGuests && rsvpAttendance === 'present' && (
                  <div>
                    <label
                      htmlFor="rsvp-guests"
                      className="block text-xs font-bold text-[#1F1610] mb-1.5"
                    >
                      {t.rsvp.guestsCount}
                    </label>
                    <select
                      id="rsvp-guests"
                      value={rsvpGuests}
                      onChange={(e) => setRsvpGuests(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#FF9F43]/40 text-sm text-[#1F1610] focus:outline-none focus:border-[#FF9F43]"
                    >
                      {[0, 1, 2, 3].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="rsvp-message"
                  className="block text-xs font-bold text-[#1F1610] mb-1.5"
                >
                  {t.rsvp.message}
                </label>
                <textarea
                  id="rsvp-message"
                  rows={2}
                  maxLength={500}
                  value={rsvpMessage}
                  onChange={(e) => setRsvpMessage(e.target.value)}
                  placeholder={t.rsvp.messagePlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#FF9F43]/40 text-sm text-[#1F1610] focus:outline-none focus:border-[#FF9F43]"
                />
              </div>

              {rsvpError && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-800">
                  {rsvpError}
                </div>
              )}

              {rsvpSaved && (
                <div className="p-3.5 rounded-md bg-[#FFF2E2] border border-[#FF9F43] text-xs font-bold text-[#9A4D06]">
                  {t.rsvp.successSaved}
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="submit"
                  disabled={rsvpSubmitting}
                  className="neon-bubble flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#FF9F43] text-[#1A1008] text-xs sm:text-sm font-bold hover:bg-[#FFB870] disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{rsvpSubmitting ? t.rsvp.submitting : t.rsvp.submitDatabase}</span>
                </button>

                {settings.whatsappNumber && whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neon-card inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#1A120B] text-[#FFB870] text-xs sm:text-sm font-bold hover:bg-[#FF9F43] hover:text-[#1A1008] transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>{t.rsvp.prepareWhatsapp}</span>
                  </a>
                )}
              </div>

              {settings.whatsappNumber && (
                <div className="pt-3 border-t border-[#FF9F43]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#5C4B3E]">
                  <span>{t.rsvp.whatsappNote}</span>
                  <button
                    type="button"
                    onClick={handleCopyWhatsappText}
                    className="text-[#E67E22] font-bold hover:underline shrink-0 text-left sm:text-right cursor-pointer"
                  >
                    {copiedWhatsappMsg ? t.rsvp.copiedMessage : t.rsvp.copyMessage}
                  </button>
                </div>
              )}
            </form>
          </div>
        </section>
      )}

      {/* =====================================================================
          PREVIEW: TÉMOIGNAGES & GALERIE + CARTE SOUVENIR & QR CODES
      ===================================================================== */}
      <section className="py-12 sm:py-16 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Approved Testimonials Preview */}
            <div className="neon-section p-6 sm:p-8 rounded-3xl bg-white flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-[#E67E22] uppercase tracking-wider mb-1">
                  {t.testimonials.sectionKicker}
                </p>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1F1610] mb-3">
                  {t.testimonials.sectionTitle}
                </h3>
                {testimonials.length > 0 ? (
                  <div className="space-y-4 my-4">
                    {testimonials.slice(0, 2).map((item) => (
                      <blockquote
                        key={item.id}
                        className="neon-card p-4 rounded-xl bg-[#FFF9F3]"
                      >
                        <p className="text-sm text-[#1F1610] leading-relaxed mb-2">
                          « {item.content} »
                        </p>
                        <footer className="text-xs text-[#6B5B4E]">
                          <strong className="text-[#9A4D06]">{item.authorName}</strong>
                          {item.relationship ? ` · ${item.relationship}` : ''}
                        </footer>
                      </blockquote>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#5C4B3E] my-4">{t.testimonials.emptyState}</p>
                )}
              </div>

              <div className="pt-4 border-t border-[#FF9F43]/30">
                <Link
                  to="/temoignages"
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#E67E22] hover:text-[#1F1610]"
                >
                  <MessageSquareHeart className="w-4 h-4 text-[#FF9F43]" />
                  <span>{t.hero.btnEncourage} →</span>
                </Link>
              </div>
            </div>

            {/* Participatory Photo Gallery Preview */}
            <div className="neon-section p-6 sm:p-8 rounded-3xl bg-white flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-[#E67E22] uppercase tracking-wider mb-1">
                  {t.gallery.sectionKicker}
                </p>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1F1610] mb-3">
                  {t.gallery.sectionTitle}
                </h3>
                <p className="text-sm text-[#5C4B3E] mb-4">
                  {photos.length > 0 && (settings.galleryVisibility === 'public' || galleryUnlocked)
                    ? `${photos.length} ${
                        locale === 'fr' ? 'souvenir(s) publié(s)' : 'published photo(s)'
                      }`
                    : t.gallery.emptyState}
                </p>

                {/* Mini Thumbnail Strip (Live Sanity & Gallery Photos) */}
                <div className="grid grid-cols-3 gap-3 my-4">
                  {(photos.length > 0
                    ? photos.slice(0, 6).map((p) => p.thumbnailUrl || p.imageUrl)
                    : [settings.portraitUrl, JURY_DEFENSE_PHOTO_URL, FAMILY_PRIDE_PHOTO_URL]
                  ).map((src, idx) => (
                    <Link
                      key={idx}
                      to="/souvenirs"
                      className="neon-card rounded-xl overflow-hidden aspect-4/3 block bg-[#1A120B]"
                    >
                      <img
                        src={src}
                        alt="Souvenir Roseline Nga Maniack"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top"
                      />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#FF9F43]/30 flex flex-wrap items-center gap-4">
                <Link
                  to="/souvenirs"
                  className="neon-bubble inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF9F43] text-[#1A1008] text-xs font-bold hover:bg-[#FFB870]"
                >
                  <span>{t.nav.memories}</span>
                </Link>
                {settings.allowPhotoContributions && (
                  <Link
                    to="/partager-des-photos"
                    className="neon-card inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#FFF9F3] text-xs font-bold text-[#1F1610]"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#E67E22]" />
                    <span>{t.nav.sharePhotos}</span>
                  </Link>
                )}
              </div>
            </div>
          </div>

          <OpenBookDivider />

          {/* Commemorative Souvenir Card & Share Block */}
          <div id="carte-souvenir" className="neon-section rounded-3xl bg-[#1A120B] text-white p-6 sm:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8">
                <p className="text-xs font-bold text-[#FF9F43] mb-2">
                  {t.souvenirCard.notOfficialDiploma}
                </p>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2">
                  {t.souvenirCard.title}
                </h3>
                <p className="text-sm text-white/80 mb-6 max-w-xl">{t.souvenirCard.subtitle}</p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => downloadSouvenirCardPng(settings, locale, formattedDate)}
                    className="neon-bubble inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF9F43] text-[#1A1008] text-xs font-bold hover:bg-[#FFB870] transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t.souvenirCard.downloadBtn}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareSite}
                    className="neon-card inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 text-white text-xs font-semibold hover:bg-[#FF9F43] hover:text-[#1A1008] transition-all cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-[#FF9F43]" />
                    <span>
                      {copiedLink ? t.souvenirCard.linkCopied : t.souvenirCard.shareBtn}
                    </span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-end gap-3">
                <div className="neon-card p-4 rounded-2xl bg-black/50 text-xs text-white/90 w-full sm:w-auto">
                  <div className="flex items-center gap-2 font-bold text-[#FF9F43] mb-1">
                    <QrCode className="w-4 h-4" />
                    <span>{t.souvenirCard.qrTitle}</span>
                  </div>
                  <p className="text-[11px] text-white/75 mb-2">
                    {locale === 'fr'
                      ? 'Accès direct vers l’invitation et l’album photo participatif :'
                      : 'Direct links to the invitation and photo contribution page:'}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] font-bold">
                    <Link to="/" className="text-[#FFB870] hover:underline">
                      {t.souvenirCard.qrInvitation}
                    </Link>
                    <span>·</span>
                    <Link to="/partager-des-photos" className="text-[#FFB870] hover:underline">
                      {t.souvenirCard.qrPhotos}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
