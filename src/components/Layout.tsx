import React, { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useReducedMotion } from 'motion/react';
import {
  Clock,
  MapPin,
  MessageSquareHeart,
  CheckCircle2,
  Camera,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { EventSettings } from '../types';
import { BubbleMenu, HeroBubbleMenu } from './BubbleMenu';

interface LayoutProps {
  settings: EventSettings;
  children: React.ReactNode;
  notification: string | null;
  onNotify: (msg: string) => void;
  onClearNotification: () => void;
}

export const MonogramRnm: React.FC<{ className?: string; light?: boolean }> = ({
  className = 'w-10 h-10',
  light = false,
}) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <circle cx="32" cy="32" r="30" stroke="#FF9F43" strokeWidth="1.5" />
    <circle cx="32" cy="32" r="26" stroke="#FFB870" strokeOpacity="0.4" strokeWidth="1" />
    <path
      d="M16 40C24 36 28 36 32 40C36 36 40 36 48 40"
      stroke="#FF9F43"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
    <text
      x="32"
      y="35"
      textAnchor="middle"
      fill={light ? '#FFFFFF' : '#1F1610'}
      fontFamily="'Cormorant Garamond', Georgia, serif"
      fontWeight="700"
      fontSize="17"
      letterSpacing="1.2"
    >
      RNM
    </text>
  </svg>
);

export const OpenBookDivider: React.FC = () => (
  <div className="flex items-center justify-center gap-4 my-10" aria-hidden="true">
    <div className="h-px w-20 sm:w-32 bg-[#FF9F43]/40" />
    <svg width="36" height="20" viewBox="0 0 36 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 16C8 13 14 14 18 18C22 14 28 13 34 16V4C28 1 22 2 18 6C14 2 8 1 2 4V16Z"
        stroke="#E67E22"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M18 6V18" stroke="#FF9F43" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
    <div className="h-px w-20 sm:w-32 bg-[#FF9F43]/40" />
  </div>
);

export const CelebrationCanvas: React.FC<{ active: boolean; onComplete: () => void }> = ({
  active,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!active || shouldReduceMotion) {
      if (active) onComplete();
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#FF9F43', '#FFB870', '#E67E22', '#FFF3E0'];
    const particles = Array.from({ length: 65 }).map(() => ({
      x: canvas.width * (0.2 + Math.random() * 0.6),
      y: canvas.height * 0.35,
      vx: (Math.random() - 0.5) * 9,
      vy: -Math.random() * 9 - 3,
      size: 5 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.14,
      opacity: 1,
    }));

    let frameId: number;
    const start = performance.now();
    const duration = 2600;

    const render = (now: number) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22;
        p.rotation += p.vRot;
        p.opacity = Math.max(0, 1 - elapsed / duration);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }

      if (elapsed < duration) {
        frameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onComplete();
      }
    };

    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, [active, shouldReduceMotion, onComplete]);

  if (!active || shouldReduceMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      aria-hidden="true"
    />
  );
};

export const Layout: React.FC<LayoutProps> = ({
  settings,
  children,
  notification,
  onNotify,
  onClearNotification,
}) => {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({
          behavior: shouldReduceMotion ? 'auto' : 'smooth',
        });
      }, 120);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: shouldReduceMotion ? 'auto' : 'smooth',
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F3] text-[#1F1610]">
      {/* Accessible Live Toast Notification */}
      {notification && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-4 z-50 max-w-md bg-[#1A120B] text-white border border-[#FF9F43] shadow-[0_0_24px_rgba(255,159,67,0.55)] px-4 py-3 rounded-xl flex items-center justify-between gap-4 text-sm"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#FF9F43] shrink-0" />
            <span>{notification}</span>
          </span>
          <button
            type="button"
            onClick={onClearNotification}
            className="text-[#FF9F43] hover:text-white text-xs font-medium px-2 py-0.5 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* On inner pages (/memoire, /souvenirs, etc.), display the Interactive Bubble Menu Bar at the top */}
      {location.pathname !== '/' && (
        <div className="pt-4 pb-2">
          <HeroBubbleMenu settings={settings} onNotify={onNotify} />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pb-16 md:pb-0">{children}</main>

      {/* Floating Bottom-Right Interactive Hover Bubble Menu (2nd device of the Double Bubble System) */}
      <BubbleMenu settings={settings} onNotify={onNotify} />

      {/* Mobile Quick Access Bar (Horaire · Lieu · Témoignage) */}
      <nav
        aria-label="Accès rapide mobile"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 h-12 bg-[#1A120B] text-white border-t border-[#FF9F43]/50 grid grid-cols-3 divide-x divide-[#FF9F43]/25"
      >
        <button
          type="button"
          onClick={() => scrollToSection('programme')}
          className="flex items-center justify-center gap-1.5 text-xs font-medium hover:bg-[#FF9F43]/15"
        >
          <Clock className="w-3.5 h-3.5 text-[#FF9F43]" />
          <span className="whitespace-nowrap">{t.nav.quickSchedule}</span>
        </button>
        <button
          type="button"
          onClick={() => scrollToSection('infos-pratiques')}
          className="flex items-center justify-center gap-1.5 text-xs font-medium hover:bg-[#FF9F43]/15"
        >
          <MapPin className="w-3.5 h-3.5 text-[#FF9F43]" />
          <span className="whitespace-nowrap">{t.nav.quickVenue}</span>
        </button>
        <Link
          to="/temoignages"
          className="flex items-center justify-center gap-1.5 text-xs font-medium hover:bg-[#FF9F43]/15"
        >
          <MessageSquareHeart className="w-3.5 h-3.5 text-[#FF9F43]" />
          <span className="whitespace-nowrap">{t.nav.quickMessage}</span>
        </Link>
      </nav>

      {/* Editorial Footer */}
      <footer className="bg-[#1A120B] text-white border-t border-[#FF9F43]/50 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start pb-8 border-b border-[#FF9F43]/20">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-9 h-9 rounded-full border border-[#FF9F43] bg-[#FF9F43]/15 flex items-center justify-center font-serif font-bold text-sm text-[#FF9F43]">
                  RNM
                </span>
                <span className="font-serif text-xl font-semibold text-white">
                  {settings.honoreeName}
                </span>
              </div>
              <p className="text-xs text-white/75 leading-relaxed max-w-sm">
                {t.footer.academicNote}
              </p>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/85">
              <Link to="/" className="hover:text-[#FF9F43] transition-colors">
                {t.nav.home}
              </Link>
              <Link to="/memoire" className="hover:text-[#FF9F43] transition-colors">
                {t.nav.dissertation}
              </Link>
              <Link to="/temoignages" className="hover:text-[#FF9F43] transition-colors">
                {t.nav.testimonials}
              </Link>
              <Link to="/souvenirs" className="hover:text-[#FF9F43] transition-colors">
                {t.nav.memories}
              </Link>
              <Link
                to="/partager-des-photos"
                className="hover:text-[#FF9F43] transition-colors inline-flex items-center gap-1"
              >
                <Camera className="w-3.5 h-3.5 text-[#FF9F43]" />
                <span>{t.nav.sharePhotos}</span>
              </Link>
            </div>

            <div className="flex flex-wrap md:justify-end gap-4 text-xs text-white/80">
              <Link
                to="/confidentialite"
                className="hover:text-[#FF9F43] transition-colors inline-flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#FF9F43]" />
                <span>{t.nav.privacy}</span>
              </Link>
              <Link
                to="/admin"
                className="hover:text-[#FF9F43] transition-colors inline-flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-[#FF9F43]" />
                <span>{t.nav.admin}</span>
              </Link>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
            <p>{t.footer.nonOfficialNote}</p>
            <p className="font-mono text-[11px] text-[#FFB870] tabular-nums">
              {settings.honoreeName} · {settings.eventDate || '2026'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
