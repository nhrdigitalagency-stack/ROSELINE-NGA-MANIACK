import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowLeft, FileText, Calendar, MapPin } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { EventSettings } from '../types';
import { OpenBookDivider } from '../components/Layout';

interface DissertationPageProps {
  settings: EventSettings;
}

export const DissertationPage: React.FC<DissertationPageProps> = ({ settings }) => {
  const { locale, t, formatDate } = useI18n();

  const title =
    locale === 'fr'
      ? settings.dissertationTitle
      : settings.dissertationTitleEn || settings.dissertationTitle;
  const subtitle =
    locale === 'fr'
      ? settings.dissertationSubtitle
      : settings.dissertationSubtitleEn || settings.dissertationSubtitle;
  const domain =
    locale === 'fr'
      ? settings.dissertationDomain
      : settings.dissertationDomainEn || settings.dissertationDomain;
  const problematic =
    locale === 'fr'
      ? settings.dissertationProblematic
      : settings.dissertationProblematicEn || settings.dissertationProblematic;
  const summary =
    locale === 'fr'
      ? settings.dissertationSummary
      : settings.dissertationSummaryEn || settings.dissertationSummary;
  const objectives =
    locale === 'fr'
      ? settings.dissertationObjectives
      : settings.dissertationObjectivesEn?.length
      ? settings.dissertationObjectivesEn
      : settings.dissertationObjectives;
  const keywords =
    locale === 'fr'
      ? settings.dissertationKeywords
      : settings.dissertationKeywordsEn?.length
      ? settings.dissertationKeywordsEn
      : settings.dissertationKeywords;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#E67E22] hover:text-[#1F1610] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.nav.home}</span>
        </Link>
      </div>

      <article className="neon-section rounded-3xl bg-white p-6 sm:p-12">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B5B4E] mb-4">
          <span className="font-bold text-[#E67E22]">{t.dissertation.sectionKicker}</span>
          <span>·</span>
          <span>{settings.honoreeName}</span>
          <span>·</span>
          <span>{t.meta.degreeLabel}</span>
        </div>

        <h1
          className="font-serif text-3xl sm:text-5xl font-bold text-[#1F1610] leading-tight mb-4"
          style={{ textWrap: 'balance' }}
        >
          {title || t.dissertation.upcomingTheme}
        </h1>

        {subtitle && (
          <p className="font-serif italic text-xl sm:text-2xl text-[#E67E22] mb-8">{subtitle}</p>
        )}

        {/* Defense Context Bar */}
        <div className="neon-card p-4 rounded-xl bg-[#FFF9F3] flex flex-wrap items-center justify-between gap-4 text-xs text-[#1F1610] mb-8">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#E67E22]" />
            <span className="capitalize font-semibold">{formatDate(settings.eventDate)}</span>
            <span>·</span>
            <span className="font-mono tabular-nums">
              {settings.startTime} – {settings.endTime}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#E67E22]" />
            <span>
              {settings.institutionOfficialName || settings.institutionName} · {settings.amphitheatre} ({settings.room})
            </span>
          </div>
        </div>

        {/* Visual Presentation before Jury */}
        <div className="neon-card rounded-2xl overflow-hidden mb-8 bg-[#1A120B]">
          <img
            src="/assets/aistudio/Soutenance_devant_le_jury_24daadeb.png"
            alt="Roseline Nga Maniack — Soutenance devant le jury"
            referrerPolicy="no-referrer"
            className="w-full max-h-[420px] object-cover object-top"
          />
        </div>

        {/* Domain */}
        {domain && (
          <div className="mb-8">
            <h2 className="text-xs font-bold text-[#E67E22] tracking-wider uppercase mb-1.5">
              {t.dissertation.domainLabel}
            </h2>
            <p className="text-base font-semibold text-[#1F1610]">{domain}</p>
          </div>
        )}

        {/* Problematic */}
        {problematic && (
          <div className="neon-card my-8 p-6 sm:p-8 rounded-2xl bg-[#1A120B] text-white">
            <h2 className="text-xs font-bold text-[#FF9F43] tracking-wider uppercase mb-2">
              {t.dissertation.problematicLabel}
            </h2>
            <p className="font-serif italic text-xl sm:text-2xl leading-relaxed text-white">
              « {problematic} »
            </p>
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className="mb-8">
            <h2 className="font-serif text-2xl font-bold text-[#1F1610] mb-3">
              {t.dissertation.summaryLabel}
            </h2>
            <p className="text-base text-[#1F1610] leading-relaxed whitespace-pre-line">
              {summary}
            </p>
          </div>
        )}

        {/* Objectives */}
        {objectives && objectives.length > 0 && (
          <div className="mb-8 pt-6 border-t border-[#FF9F43]/30">
            <h2 className="font-serif text-2xl font-bold text-[#1F1610] mb-4">
              {t.dissertation.objectivesLabel}
            </h2>
            <div className="space-y-3">
              {objectives.map((obj, idx) => (
                <div
                  key={idx}
                  className="neon-card p-4 rounded-xl bg-[#FFF9F3] flex items-start gap-3"
                >
                  <span className="font-mono text-xs font-bold text-[#E67E22] mt-0.5">
                    0{idx + 1}.
                  </span>
                  <p className="text-sm sm:text-base text-[#1F1610] leading-relaxed">{obj}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Keywords */}
        {keywords && keywords.length > 0 && (
          <div className="mb-8 pt-6 border-t border-[#FF9F43]/30">
            <h2 className="text-xs font-bold text-[#9A4D06] mb-2">
              {t.dissertation.keywordsLabel}
            </h2>
            <p className="text-sm font-semibold text-[#1F1610]">{keywords.join('  ·  ')}</p>
          </div>
        )}

        <OpenBookDivider />

        {/* Authorized Document Download or Confidentiality Notice */}
        <div className="neon-card p-5 rounded-xl bg-[#FFF2E2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-[#E67E22] shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-[#1F1610] leading-relaxed">
              {t.dissertation.noDownloadNotice}
            </p>
          </div>

          {settings.allowPdfDownload && settings.dissertationPdfUrl && (
            <a
              href={settings.dissertationPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="neon-bubble inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#FF9F43] text-[#1A1008] text-xs font-bold shrink-0"
            >
              <FileText className="w-4 h-4" />
              <span>{t.dissertation.downloadPdf}</span>
            </a>
          )}
        </div>
      </article>
    </div>
  );
};
