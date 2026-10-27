import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { EventSettings } from '../types';

interface PrivacyPageProps {
  settings: EventSettings;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ settings }) => {
  const { locale, t } = useI18n();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#E67E22] hover:text-[#1F1610]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.nav.home}</span>
        </Link>
      </div>

      <article className="neon-section rounded-3xl bg-white p-6 sm:p-10 space-y-6">
        <div className="flex items-center gap-2.5 text-[#E67E22]">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">{t.nav.privacy}</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1F1610]">
          {t.privacy.title}
        </h1>

        <p className="text-sm sm:text-base text-[#1F1610] leading-relaxed">{t.privacy.intro}</p>

        <div className="space-y-5 pt-4 border-t border-[#FF9F43]/30">
          <section className="neon-card p-4 rounded-xl bg-[#FFF9F3]">
            <h2 className="font-serif text-xl font-bold text-[#1F1610] mb-1.5">
              {t.privacy.collectedTitle}
            </h2>
            <p className="text-sm text-[#3D2E22] leading-relaxed">{t.privacy.collectedText}</p>
          </section>

          <section className="neon-card p-4 rounded-xl bg-[#FFF9F3]">
            <h2 className="font-serif text-xl font-bold text-[#1F1610] mb-1.5">
              {t.privacy.usageTitle}
            </h2>
            <p className="text-sm text-[#3D2E22] leading-relaxed">{t.privacy.usageText}</p>
          </section>

          <section className="neon-card p-4 rounded-xl bg-[#FFF9F3]">
            <h2 className="font-serif text-xl font-bold text-[#1F1610] mb-1.5">
              {t.privacy.exifTitle}
            </h2>
            <p className="text-sm text-[#3D2E22] leading-relaxed">{t.privacy.exifText}</p>
          </section>

          <section className="neon-card p-4 rounded-xl bg-[#FFF9F3]">
            <h2 className="font-serif text-xl font-bold text-[#1F1610] mb-1.5">
              {t.privacy.moderationTitle}
            </h2>
            <p className="text-sm text-[#3D2E22] leading-relaxed">{t.privacy.moderationText}</p>
          </section>

          <section className="neon-card p-4 rounded-xl bg-[#FFF9F3]">
            <h2 className="font-serif text-xl font-bold text-[#1F1610] mb-1.5">
              {t.privacy.removalTitle}
            </h2>
            <p className="text-sm text-[#3D2E22] leading-relaxed">
              {t.privacy.removalText}{' '}
              <strong className="font-mono text-[#E67E22]">
                {settings.retentionMonths} {locale === 'fr' ? 'mois' : 'months'}
              </strong>
              .
            </p>
          </section>
        </div>

        <div className="pt-6 border-t border-[#FF9F43]/30 flex flex-wrap items-center justify-between gap-4 text-xs text-[#6B5B4E]">
          <span>
            {settings.honoreeName} · {settings.institutionOfficialName || settings.institutionName}
          </span>
          <Link to="/temoignages" className="text-[#E67E22] font-bold hover:underline">
            {t.testimonials.requestRemoval} →
          </Link>
        </div>
      </article>
    </div>
  );
};
