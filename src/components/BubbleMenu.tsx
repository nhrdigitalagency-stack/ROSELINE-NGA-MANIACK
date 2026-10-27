import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  BookOpen,
  CalendarPlus,
  MapPin,
  MessageSquareHeart,
  Camera,
  Images,
  CheckCircle2,
  Globe,
  Sparkles,
  ChevronRight,
  Home,
  Clock,
  GraduationCap,
  Menu,
  X,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { EventSettings } from '../types';
import { downloadDefenseIcs, buildWhatsAppUrl } from '../utils/calendarAndShare';

interface SubOption {
  label: string;
  onClick: () => void;
}

interface BubbleOption {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  action: () => void;
  subOptions: SubOption[];
}

interface BubbleMenuProps {
  settings: EventSettings;
  onNotify: (msg: string) => void;
}

/**
 * Top Sticky/Fixed Single-Line Interactive Bubble Header (`HeroBubbleMenu`).
 * - Desktop (`lg:flex`): Fits strictly on a single horizontal line (`flex-nowrap`).
 *   Each circular/pill bubble represents a section (Accueil, Mémoire, Parcours, Programme,
 *   Infos & Lieu, Témoignages, Souvenirs, Présence) and expands smoothly with a neon orange
 *   glow (#FF9F43) and interactive sub-options on mouse hover.
 * - Mobile / Phone (`< lg`): Fits strictly on a single line with the RNM monogram on the left
 *   and a 3-horizontal-line hamburger button (`Menu`) on the right that smoothly unrolls
 *   the full bubble navigation menu when clicked.
 */
export const HeroBubbleMenu: React.FC<BubbleMenuProps> = ({ settings, onNotify }) => {
  const { locale, toggleLocale, t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMobileSectionId, setExpandedMobileSectionId] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const openBubble = (id: string) => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setHoveredId(id);
  };

  const closeBubble = () => {
    timeoutRef.current = window.setTimeout(() => {
      setHoveredId(null);
    }, 170);
  };

  useEffect(() => {
    setMobileMenuOpen(false);
    setExpandedMobileSectionId(null);
  }, [location.pathname]);

  const goTo = (path: string, sectionId?: string) => {
    setHoveredId(null);
    setMobileMenuOpen(false);
    if (sectionId) {
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          document
            .getElementById(sectionId)
            ?.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth' });
        }, 120);
      } else {
        document
          .getElementById(sectionId)
          ?.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth' });
      }
    } else {
      navigate(path);
      window.scrollTo({ top: 0, behavior: shouldReduceMotion ? 'auto' : 'smooth' });
    }
  };

  const heroBubbles: BubbleOption[] = [
    {
      id: 'hb-home',
      label: t.nav.home,
      sublabel: locale === 'fr' ? 'Invitation & Accueil' : 'Invitation & Home',
      icon: <Home className="w-3.5 h-3.5" />,
      action: () => goTo('/'),
      subOptions: [
        {
          label: locale === 'fr' ? 'Haut de page (Invitation)' : 'Top of page (Invitation)',
          onClick: () => goTo('/'),
        },
        {
          label: locale === 'fr' ? 'Le parcours universitaire' : 'Academic Path',
          onClick: () => goTo('/', 'parcours'),
        },
      ],
    },
    {
      id: 'hb-memoire',
      label: locale === 'fr' ? 'Mémoire' : 'Dissertation',
      sublabel:
        locale === 'fr'
          ? 'Responsabilité des dirigeants & prise de risque'
          : 'Directors’ liability & risk-taking',
      icon: <BookOpen className="w-3.5 h-3.5" />,
      action: () => goTo('/memoire'),
      subOptions: [
        {
          label: locale === 'fr' ? 'Aperçu du mémoire (Accueil)' : 'Abstract on Home Page',
          onClick: () => goTo('/', 'memoire'),
        },
        {
          label: locale === 'fr' ? 'Présentation détaillée (/memoire)' : 'Full Dissertation (/memoire)',
          onClick: () => goTo('/memoire'),
        },
      ],
    },
    {
      id: 'hb-parcours',
      label: locale === 'fr' ? 'Parcours' : 'Journey',
      sublabel: locale === 'fr' ? 'Formation & Remerciements' : 'Academic Path & Gratitude',
      icon: <GraduationCap className="w-3.5 h-3.5" />,
      action: () => goTo('/', 'parcours'),
      subOptions: [
        {
          label: locale === 'fr' ? 'Étapes du parcours en Droit' : 'Business Law Milestones',
          onClick: () => goTo('/', 'parcours'),
        },
        {
          label: locale === 'fr' ? 'Mot de gratitude aux proches' : 'Gratitude & Acknowledgments',
          onClick: () => goTo('/', 'parcours'),
        },
      ],
    },
    {
      id: 'hb-programme',
      label: locale === 'fr' ? 'Programme' : 'Schedule',
      sublabel: '23 Déc. 2026 · 12h30 – 15h40',
      icon: <Clock className="w-3.5 h-3.5" />,
      action: () => goTo('/', 'programme'),
      subOptions: [
        {
          label: locale === 'fr' ? 'Déroulement (12h30 – 15h40)' : 'Session Timeline (12:30 – 3:40 PM)',
          onClick: () => goTo('/', 'programme'),
        },
        {
          label: locale === 'fr' ? 'Télécharger l’agenda (.ics)' : 'Download Calendar (.ics)',
          onClick: () => {
            if (downloadDefenseIcs(settings, locale)) {
              onNotify(
                locale === 'fr'
                  ? 'Fichier agenda (.ics) téléchargé.'
                  : 'Calendar (.ics) downloaded.'
              );
            }
            setHoveredId(null);
            setMobileMenuOpen(false);
          },
        },
      ],
    },
    {
      id: 'hb-lieu',
      label: locale === 'fr' ? 'Lieu & Infos' : 'Venue & Info',
      sublabel: 'Université de Ngoa-Ekellé (INSECK) · Amphi 250 / SA B2',
      icon: <MapPin className="w-3.5 h-3.5" />,
      action: () => goTo('/', 'infos-pratiques'),
      subOptions: [
        {
          label: 'Amphi 250 · Salle SA B2 (INSECK)',
          onClick: () => goTo('/', 'infos-pratiques'),
        },
        {
          label: locale === 'fr' ? 'Carte Souvenir & QR Codes' : 'Keepsake Card & QR Codes',
          onClick: () => goTo('/', 'carte-souvenir'),
        },
      ],
    },
    {
      id: 'hb-temoignages',
      label: locale === 'fr' ? 'Témoignages' : 'Guestbook',
      sublabel: locale === 'fr' ? 'Livre d’or & encouragements' : 'Encouragements & tributes',
      icon: <MessageSquareHeart className="w-3.5 h-3.5" />,
      action: () => goTo('/temoignages'),
      subOptions: [
        {
          label: locale === 'fr' ? 'Écrire un encouragement' : 'Write an encouragement',
          onClick: () => goTo('/temoignages'),
        },
        {
          label: locale === 'fr' ? 'Lire le livre d’or' : 'Read guestbook messages',
          onClick: () => goTo('/temoignages'),
        },
      ],
    },
    {
      id: 'hb-souvenirs',
      label: locale === 'fr' ? 'Souvenirs' : 'Gallery',
      sublabel: locale === 'fr' ? 'Galerie & partage de photos' : 'Photo gallery & upload',
      icon: <Images className="w-3.5 h-3.5" />,
      action: () => goTo('/souvenirs'),
      subOptions: [
        {
          label: locale === 'fr' ? 'Explorer la galerie photos' : 'Explore photo gallery',
          onClick: () => goTo('/souvenirs'),
        },
        {
          label: locale === 'fr' ? 'Partager mes photos' : 'Upload defense photos',
          onClick: () => goTo('/partager-des-photos'),
        },
      ],
    },
    {
      id: 'hb-rsvp',
      label: locale === 'fr' ? 'Présence' : 'RSVP',
      sublabel: locale === 'fr' ? 'Confirmer en ligne ou WhatsApp' : 'Confirm online or via WhatsApp',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      action: () => goTo('/', 'confirmation-presence'),
      subOptions: [
        {
          label: locale === 'fr' ? 'Formulaire de présence (RSVP)' : 'Online RSVP Form',
          onClick: () => goTo('/', 'confirmation-presence'),
        },
        ...(settings.whatsappNumber
          ? [
              {
                label: `WhatsApp (${settings.whatsappNumber})`,
                onClick: () => {
                  const url = buildWhatsAppUrl(
                    settings.whatsappNumber,
                    locale === 'fr'
                      ? `Bonjour, je confirme ma présence à la soutenance de ${settings.honoreeName} le 23 décembre 2026.`
                      : `Hello, I confirm my attendance at ${settings.honoreeName}'s defense on December 23, 2026.`
                  );
                  if (url) window.open(url, '_blank', 'noopener,noreferrer');
                  setHoveredId(null);
                  setMobileMenuOpen(false);
                },
              },
            ]
          : []),
      ],
    },
  ];

  return (
    <header className="sticky top-3 z-50 w-full px-3 sm:px-6">
      {/* Single-line Floating Bubble Header Bar with White Transparent Background */}
      <nav
        aria-label={t.bubbleMenu.triggerLabel}
        className="max-w-7xl mx-auto flex items-center justify-between gap-2 px-3 sm:px-4 py-2 rounded-full bg-white/75 backdrop-blur-xl border border-[#FF9F43] shadow-[0_8px_32px_rgba(255,159,67,0.35)] flex-nowrap"
      >
        {/* Left: Brand Monogram Bubble + Name on 1 Line */}
        <Link
          to="/"
          className="neon-bubble flex items-center gap-2.5 pl-1.5 pr-3.5 py-1 rounded-full bg-white/85 text-[#1F1610] hover:bg-[#FF9F43] hover:text-[#1A1008] transition-all shrink-0 group"
        >
          <span className="w-8 h-8 rounded-full bg-[#FF9F43] text-[#1A1008] group-hover:bg-[#1A1008] group-hover:text-[#FF9F43] flex items-center justify-center font-serif font-bold text-xs tracking-wider shadow-[0_0_12px_rgba(255,159,67,0.8)] transition-colors">
            RNM
          </span>
          <div className="flex flex-col text-left leading-tight">
            <span className="font-serif font-bold text-sm sm:text-base text-[#1F1610] group-hover:text-[#1A1008] whitespace-nowrap">
              {settings.honoreeName}
            </span>
            <span className="text-[10px] text-[#9A4D06] group-hover:text-[#1A1008]/85 hidden sm:inline whitespace-nowrap font-medium">
              {t.meta.degreeLabel}
            </span>
          </div>
        </Link>

        {/* Center: Desktop Single-Line Interactive Hover Bubbles (`hidden lg:flex flex-nowrap`) */}
        <div className="hidden lg:flex items-center justify-center gap-1.5 flex-nowrap">
          {heroBubbles.map((b) => {
            const isOpen = hoveredId === b.id;
            return (
              <div
                key={b.id}
                className="relative shrink-0"
                onMouseEnter={() => openBubble(b.id)}
                onMouseLeave={closeBubble}
              >
                <motion.button
                  type="button"
                  onClick={b.action}
                  onFocus={() => openBubble(b.id)}
                  aria-expanded={isOpen}
                  whileHover={shouldReduceMotion ? {} : { scale: 1.06 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className={`neon-bubble flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all duration-200 ${
                    isOpen
                      ? 'bg-[#FF9F43] text-[#1A1008] shadow-[0_0_22px_rgba(255,159,67,0.9)]'
                      : 'bg-white/85 text-[#1F1610] hover:bg-[#FF9F43] hover:text-[#1A1008]'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      isOpen
                        ? 'bg-[#1A1008] text-[#FF9F43]'
                        : 'bg-[#FF9F43]/20 text-[#E67E22]'
                    }`}
                  >
                    {b.icon}
                  </span>
                  <span className="whitespace-nowrap">{b.label}</span>
                </motion.button>

                {/* Dropdown Bubble Sub-options revealed smoothly on mouse hover */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={
                        shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.94 }
                      }
                      animate={
                        shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }
                      }
                      exit={
                        shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.95 }
                      }
                      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute left-1/2 -translate-x-1/2 top-full mt-2.5 w-64 rounded-2xl bg-white/95 backdrop-blur-xl p-3 text-left z-50 border border-[#FF9F43] shadow-[0_8px_32px_rgba(255,159,67,0.55)]"
                    >
                      <p className="text-[11px] font-bold text-[#E67E22] px-2.5 pb-2 mb-1.5 border-b border-[#FF9F43]/30">
                        {b.sublabel}
                      </p>
                      <div className="space-y-1">
                        {b.subOptions.map((sub, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={sub.onClick}
                            className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#1F1610] hover:bg-[#FF9F43] hover:text-[#1A1008] transition-colors cursor-pointer text-left"
                          >
                            <span>{sub.label}</span>
                            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-[#E67E22]" />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Right: Language Bubble + Mobile 3-Horizontal-Lines Hamburger Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleLocale}
            aria-label={t.bubbleMenu.switchLanguage}
            className="neon-bubble flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/85 text-[#1F1610] hover:bg-[#FF9F43] hover:text-[#1A1008] text-xs font-bold whitespace-nowrap cursor-pointer transition-all"
          >
            <Globe className="w-3.5 h-3.5 text-[#E67E22]" />
            <span>{locale === 'fr' ? 'FR / EN' : 'EN / FR'}</span>
          </button>

          {/* Mobile Hamburger Button (3 horizontal lines) — Unrolls the Bubble Menu on Click */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu de navigation'}
            className="lg:hidden neon-bubble w-10 h-10 rounded-full bg-[#FF9F43] text-[#1A1008] hover:bg-[#FFB870] flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-[0_0_16px_rgba(255,159,67,0.85)]"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <Menu className="w-5 h-5 stroke-[2.5]" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown Menu (Unrolls smoothly when clicking the 3 horizontal lines) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, height: 0 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, height: 'auto' }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden overflow-hidden max-w-7xl mx-auto mt-2"
          >
            <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-[#FF9F43] shadow-[0_8px_32px_rgba(255,159,67,0.5)] p-4 space-y-2">
              <div className="flex items-center justify-between px-2 pb-2 border-b border-[#FF9F43]/30">
                <span className="text-xs font-bold uppercase tracking-wider text-[#E67E22]">
                  {locale === 'fr' ? 'Navigation & Sections' : 'Navigation & Sections'}
                </span>
                <span className="text-[11px] text-[#9A4D06] font-mono font-bold">
                  23 Déc. 2026 · 12h30
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {heroBubbles.map((b) => {
                  const isExpanded = expandedMobileSectionId === b.id;
                  return (
                    <div
                      key={b.id}
                      className="rounded-2xl bg-white/95 border border-[#FF9F43]/50 hover:border-[#FF9F43] overflow-hidden transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={b.action}
                          className="flex-1 flex items-center gap-3 px-3.5 py-2.5 text-left text-[#1F1610] hover:text-[#E67E22] transition-colors cursor-pointer"
                        >
                          <span className="w-8 h-8 rounded-full bg-[#FF9F43] text-[#1A1008] flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(255,159,67,0.6)]">
                            {b.icon}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-[#1F1610]">{b.label}</div>
                            <div className="text-[10px] text-[#9A4D06] line-clamp-1">
                              {b.sublabel}
                            </div>
                          </div>
                        </button>

                        {b.subOptions.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedMobileSectionId(isExpanded ? null : b.id)
                            }
                            aria-label="Afficher les sous-options"
                            className="px-3 py-2.5 text-[#E67E22] hover:text-[#1F1610] cursor-pointer"
                          >
                            <ChevronRight
                              className={`w-4 h-4 transition-transform duration-200 ${
                                isExpanded ? 'rotate-90' : ''
                              }`}
                            />
                          </button>
                        )}
                      </div>

                      <AnimatePresence>
                        {isExpanded && b.subOptions.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="px-3 pb-2.5 pt-1 border-t border-[#FF9F43]/25 space-y-1 bg-[#FFF9F3]"
                          >
                            {b.subOptions.map((sub, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={sub.onClick}
                                className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-[#1F1610] hover:bg-[#FF9F43] hover:text-[#1A1008] transition-colors cursor-pointer text-left"
                              >
                                <span>{sub.label}</span>
                                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

/**
 * Floating Global Circular Bubble Menu (Bottom-Right) that expands smoothly on mouse hover.
 * Each circular bubble represents a key section (Accueil, Mémoire, Programme, Lieu, Témoignages,
 * Souvenirs, Présence) and expands horizontally on hover with neon orange borders (#FF9F43).
 */
export const BubbleMenu: React.FC<BubbleMenuProps> = ({ settings, onNotify }) => {
  const { locale, toggleLocale, t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  const [isOpen, setIsOpen] = useState(false);
  const [hoveredBubbleId, setHoveredBubbleId] = useState<string | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  const handleMouseEnterContainer = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeaveContainer = () => {
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
      setHoveredBubbleId(null);
    }, 220);
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) window.clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const navigateOrScroll = (path: string, hashId?: string) => {
    setIsOpen(false);
    setHoveredBubbleId(null);
    if (hashId) {
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          document
            .getElementById(hashId)
            ?.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth' });
        }, 120);
      } else {
        document
          .getElementById(hashId)
          ?.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth' });
      }
    } else {
      navigate(path);
      window.scrollTo({ top: 0, behavior: shouldReduceMotion ? 'auto' : 'smooth' });
    }
  };

  const options: BubbleOption[] = [
    {
      id: 'home',
      label: t.nav.home,
      sublabel: locale === 'fr' ? 'Retour en haut de page' : 'Back to top of page',
      icon: <Home className="w-4 h-4" />,
      action: () => navigateOrScroll('/'),
      subOptions: [
        {
          label: locale === 'fr' ? 'Invitation & Vidéo Héro' : 'Invitation & Hero Video',
          onClick: () => navigateOrScroll('/'),
        },
        {
          label: locale === 'fr' ? 'Le parcours universitaire' : 'Academic Path',
          onClick: () => navigateOrScroll('/', 'parcours'),
        },
      ],
    },
    {
      id: 'dissertation',
      label: t.bubbleMenu.exploreDissertation,
      sublabel: t.bubbleMenu.exploreDissertationSub,
      icon: <BookOpen className="w-4 h-4" />,
      action: () => navigateOrScroll('/memoire'),
      subOptions: [
        {
          label: locale === 'fr' ? 'Présentation complète (/memoire)' : 'Full Dissertation (/memoire)',
          onClick: () => navigateOrScroll('/memoire'),
        },
        {
          label: locale === 'fr' ? 'Aperçu rapide (Accueil)' : 'Quick Abstract (Home)',
          onClick: () => navigateOrScroll('/', 'memoire'),
        },
      ],
    },
    {
      id: 'venue',
      label: t.bubbleMenu.practicalVenue,
      sublabel: t.bubbleMenu.practicalVenueSub,
      icon: <MapPin className="w-4 h-4" />,
      action: () => navigateOrScroll('/', 'infos-pratiques'),
      subOptions: [
        {
          label: 'Amphi 250 / Salle SA B2 (INSECK)',
          onClick: () => navigateOrScroll('/', 'infos-pratiques'),
        },
        {
          label: locale === 'fr' ? 'Programme 12h30 – 15h40' : 'Schedule 12:30 – 3:40 PM',
          onClick: () => navigateOrScroll('/', 'programme'),
        },
      ],
    },
    ...(settings.eventDate
      ? [
          {
            id: 'calendar',
            label: t.bubbleMenu.addCalendar,
            sublabel: t.bubbleMenu.addCalendarSub,
            icon: <CalendarPlus className="w-4 h-4" />,
            action: () => {
              const ok = downloadDefenseIcs(settings, locale);
              if (ok) {
                onNotify(
                  locale === 'fr'
                    ? 'Fichier agenda (.ics) téléchargé pour le 23 décembre 2026.'
                    : 'Calendar file (.ics) downloaded for December 23, 2026.'
                );
              }
              setIsOpen(false);
            },
            subOptions: [
              {
                label: locale === 'fr' ? 'Télécharger le fichier .ics' : 'Download .ics file',
                onClick: () => {
                  downloadDefenseIcs(settings, locale);
                  setIsOpen(false);
                },
              },
            ],
          },
        ]
      : []),
    ...(settings.allowRsvp
      ? [
          {
            id: 'rsvp',
            label: t.bubbleMenu.rsvpWhatsapp,
            sublabel: t.bubbleMenu.rsvpWhatsappSub,
            icon: <CheckCircle2 className="w-4 h-4" />,
            action: () => navigateOrScroll('/', 'confirmation-presence'),
            subOptions: [
              {
                label: locale === 'fr' ? 'Formulaire en ligne' : 'Online RSVP Form',
                onClick: () => navigateOrScroll('/', 'confirmation-presence'),
              },
              ...(settings.whatsappNumber
                ? [
                    {
                      label: `WhatsApp direct (${settings.whatsappNumber})`,
                      onClick: () => {
                        const url = buildWhatsAppUrl(
                          settings.whatsappNumber,
                          locale === 'fr'
                            ? `Bonjour, je confirme ma présence à la soutenance de ${settings.honoreeName} le 23 décembre 2026.`
                            : `Hello, I confirm my attendance at ${settings.honoreeName}'s defense on December 23, 2026.`
                        );
                        if (url) window.open(url, '_blank', 'noopener,noreferrer');
                        setIsOpen(false);
                      },
                    },
                  ]
                : []),
            ],
          },
        ]
      : []),
    {
      id: 'testimonials',
      label: t.bubbleMenu.leaveEncouragement,
      sublabel: t.bubbleMenu.leaveEncouragementSub,
      icon: <MessageSquareHeart className="w-4 h-4" />,
      action: () => navigateOrScroll('/temoignages'),
      subOptions: [
        {
          label: locale === 'fr' ? 'Écrire un message' : 'Write a message',
          onClick: () => navigateOrScroll('/temoignages'),
        },
      ],
    },
    {
      id: 'share-photos',
      label: t.bubbleMenu.sharePhotos,
      sublabel: t.bubbleMenu.sharePhotosSub,
      icon: <Camera className="w-4 h-4" />,
      action: () => navigateOrScroll('/partager-des-photos'),
      subOptions: [
        {
          label: locale === 'fr' ? 'Envoyer mes photos' : 'Upload my photos',
          onClick: () => navigateOrScroll('/partager-des-photos'),
        },
        {
          label: locale === 'fr' ? 'Voir la galerie souvenirs' : 'View photo gallery',
          onClick: () => navigateOrScroll('/souvenirs'),
        },
      ],
    },
    {
      id: 'language',
      label: t.bubbleMenu.switchLanguage,
      sublabel: locale === 'fr' ? 'Switch interface to English' : 'Passer l’interface en français',
      icon: <Globe className="w-4 h-4" />,
      action: () => toggleLocale(),
      subOptions: [
        {
          label: locale === 'fr' ? 'English (EN)' : 'Français (FR)',
          onClick: () => toggleLocale(),
        },
      ],
    },
  ];

  return (
    <div
      className="fixed bottom-16 md:bottom-7 right-5 z-50 flex flex-col items-end select-none"
      onMouseEnter={handleMouseEnterContainer}
      onMouseLeave={handleMouseLeaveContainer}
      aria-label={t.bubbleMenu.triggerLabel}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.95 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="mb-3 flex flex-col items-end gap-2.5 pr-0.5"
          >
            {options.map((opt, idx) => {
              const isHovered = hoveredBubbleId === opt.id;
              return (
                <div
                  key={opt.id}
                  className="relative flex items-center justify-end"
                  onMouseEnter={() => setHoveredBubbleId(opt.id)}
                >
                  {/* Sub-options bubble card appearing to the left on hover */}
                  <AnimatePresence>
                    {isHovered && opt.subOptions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.14 }}
                        className="hidden sm:flex flex-col gap-1 mr-3 p-2.5 rounded-2xl bg-[#120C07]/95 text-white border border-[#FF9F43] shadow-[0_0_24px_rgba(255,159,67,0.65)] min-w-[215px]"
                      >
                        <span className="text-[10px] font-semibold text-[#FF9F43] px-2 pb-1 border-b border-[#FF9F43]/25">
                          {opt.sublabel}
                        </span>
                        {opt.subOptions.map((sub, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={sub.onClick}
                            className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-white hover:bg-[#FF9F43] hover:text-[#1A1008] transition-colors cursor-pointer text-left"
                          >
                            <span className="whitespace-nowrap">{sub.label}</span>
                            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Circular Bubble that expands smoothly on mouse hover */}
                  <motion.button
                    type="button"
                    initial={
                      shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14, scale: 0.85 }
                    }
                    animate={
                      shouldReduceMotion
                        ? { opacity: 1 }
                        : { opacity: 1, y: 0, scale: isHovered ? 1.05 : 1 }
                    }
                    exit={
                      shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.9 }
                    }
                    transition={{
                      duration: 0.18,
                      delay: shouldReduceMotion ? 0 : (options.length - 1 - idx) * 0.025,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    onFocus={() => setHoveredBubbleId(opt.id)}
                    onClick={opt.action}
                    className={`neon-bubble group relative flex items-center gap-2.5 rounded-full pl-4 pr-1.5 py-1.5 backdrop-blur-md cursor-pointer transition-all duration-200 ${
                      isHovered
                        ? 'bg-[#FF9F43] text-[#1A1008] shadow-[0_0_24px_rgba(255,159,67,0.9)]'
                        : 'bg-[#120C07]/95 text-white hover:bg-[#FF9F43] hover:text-[#1A1008]'
                    }`}
                  >
                    <span className="text-xs font-bold whitespace-nowrap pr-1">
                      {opt.label}
                    </span>

                    <span
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform duration-150 ${
                        isHovered
                          ? 'bg-[#1A1008] text-[#FF9F43]'
                          : 'bg-[#FF9F43] text-[#1A1008]'
                      }`}
                    >
                      {opt.icon}
                    </span>
                  </motion.button>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Circular Trigger Bubble (Neon Orange #FF9F43) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={t.bubbleMenu.triggerLabel}
        className="neon-bubble group relative w-14 h-14 rounded-full bg-[#120C07] text-white flex items-center justify-center cursor-pointer shadow-[0_0_24px_rgba(255,159,67,0.75)]"
      >
        <span className="w-11 h-11 rounded-full bg-[#FF9F43] text-[#1A1008] flex items-center justify-center font-serif font-bold text-xs tracking-tighter shadow-[0_0_16px_rgba(255,159,67,0.85)] transition-transform duration-200 group-hover:scale-105">
          {isOpen ? <Sparkles className="w-4 h-4" /> : 'RNM'}
        </span>
      </button>
    </div>
  );
};
