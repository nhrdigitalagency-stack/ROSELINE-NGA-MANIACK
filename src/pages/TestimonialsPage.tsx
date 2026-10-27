import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageSquareHeart, Send, Flag, X, Check } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { EventSettings, Testimonial } from '../types';

interface TestimonialsPageProps {
  settings: EventSettings;
  testimonials: Testimonial[];
  onSubmitTestimonial: (payload: {
    authorName: string;
    relationship?: string;
    category: 'encouragement' | 'testimonial' | 'congratulations';
    content: string;
    consentGiven: boolean;
  }) => Promise<{ ok: boolean; error?: string }>;
  onRequestRemoval: (payload: { testimonialId?: string; reason: string }) => Promise<boolean>;
  onNotify: (msg: string) => void;
}

export const TestimonialsPage: React.FC<TestimonialsPageProps> = ({
  settings,
  testimonials,
  onSubmitTestimonial,
  onRequestRemoval,
  onNotify,
}) => {
  const { locale, t } = useI18n();

  const [filter, setFilter] = useState<'all' | 'encouragement' | 'testimonial' | 'congratulations'>(
    'all'
  );
  const [authorName, setAuthorName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [category, setCategory] = useState<'encouragement' | 'testimonial' | 'congratulations'>(
    settings.resultStatus === 'confirmed_success' ? 'congratulations' : 'encouragement'
  );
  const [content, setContent] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [removalModalOpen, setRemovalModalOpen] = useState(false);
  const [removalTargetId, setRemovalTargetId] = useState<string | undefined>(undefined);
  const [removalReason, setRemovalReason] = useState('');
  const [removalSent, setRemovalSent] = useState(false);

  const filteredList = testimonials.filter((item) =>
    filter === 'all' ? true : item.category === filter
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !content.trim() || !consentGiven) return;

    setSubmitting(true);
    setSubmitError(null);
    setSubmittedSuccess(false);

    try {
      const res = await onSubmitTestimonial({
        authorName: authorName.trim(),
        relationship: relationship.trim(),
        category,
        content: content.trim(),
        consentGiven,
      });

      if (res.ok) {
        setSubmittedSuccess(true);
        setAuthorName('');
        setRelationship('');
        setContent('');
        setConsentGiven(false);
        onNotify(t.testimonials.successPending);
      } else {
        setSubmitError(
          res.error ||
            (locale === 'fr'
              ? "L'envoi n'a pas pu aboutir. Veuillez vérifier votre message."
              : 'Submission could not be completed.')
        );
      }
    } catch {
      setSubmitError(
        locale === 'fr' ? 'Erreur de communication avec le serveur.' : 'Server communication error.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendRemoval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!removalReason.trim()) return;
    const ok = await onRequestRemoval({
      testimonialId: removalTargetId,
      reason: removalReason.trim(),
    });
    if (ok) {
      setRemovalSent(true);
      onNotify(t.testimonials.removalSuccess);
      setTimeout(() => {
        setRemovalModalOpen(false);
        setRemovalSent(false);
        setRemovalReason('');
        setRemovalTargetId(undefined);
      }, 1500);
    }
  };

  const getCategoryLabel = (cat: Testimonial['category']) => {
    if (cat === 'encouragement') return t.testimonials.filterEncouragement;
    if (cat === 'congratulations') return t.testimonials.filterCongratulations;
    return t.testimonials.filterTestimonial;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#E67E22] hover:text-[#1F1610]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.nav.home}</span>
        </Link>
      </div>

      <div className="mb-10 max-w-3xl">
        <p className="text-xs font-bold text-[#E67E22] tracking-wider uppercase mb-2">
          {t.testimonials.sectionKicker}
        </p>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#1F1610] mb-3">
          {t.testimonials.sectionTitle}
        </h1>
        <p className="text-sm sm:text-base text-[#5C4B3E] leading-relaxed">
          {t.testimonials.sectionIntro}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Approved Messages List */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#FFF2E2] rounded-xl border border-[#FF9F43]/30">
            {(
              [
                { id: 'all', label: t.testimonials.filterAll },
                { id: 'encouragement', label: t.testimonials.filterEncouragement },
                { id: 'testimonial', label: t.testimonials.filterTestimonial },
                ...(settings.resultStatus === 'confirmed_success'
                  ? [{ id: 'congratulations', label: t.testimonials.filterCongratulations }]
                  : []),
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id as typeof filter)}
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

          {filteredList.length > 0 ? (
            <div className="space-y-4">
              {filteredList.map((item) => (
                <article
                  key={item.id}
                  className="neon-card p-6 rounded-2xl bg-white"
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-[#6B5B4E] mb-3">
                    <div>
                      <span className="font-bold text-[#1F1610]">{item.authorName}</span>
                      {item.relationship && (
                        <>
                          <span className="mx-1.5">·</span>
                          <span>{item.relationship}</span>
                        </>
                      )}
                      <span className="mx-1.5">·</span>
                      <span className="text-[#E67E22] font-semibold">
                        {getCategoryLabel(item.category)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRemovalTargetId(item.id);
                        setRemovalReason(
                          `${locale === 'fr' ? 'Message de' : 'Message by'} ${item.authorName} : `
                        );
                        setRemovalModalOpen(true);
                      }}
                      title={t.testimonials.requestRemoval}
                      className="text-[#6B5B4E] hover:text-[#E67E22] p-1"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-sm sm:text-base text-[#1F1610] leading-relaxed whitespace-pre-line">
                    {item.content}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="neon-section p-8 rounded-3xl bg-white text-center">
              <MessageSquareHeart className="w-8 h-8 text-[#FF9F43] mx-auto mb-3" />
              <p className="text-sm text-[#5C4B3E]">{t.testimonials.emptyState}</p>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setRemovalTargetId(undefined);
                setRemovalModalOpen(true);
              }}
              className="text-xs text-[#6B5B4E] hover:text-[#E67E22] underline underline-offset-4 cursor-pointer"
            >
              {t.testimonials.requestRemoval}
            </button>
          </div>
        </div>

        {/* Right Column: Submission Form */}
        <div className="lg:col-span-5">
          {settings.allowTestimonials ? (
            <form
              onSubmit={handleSubmit}
              className="neon-section rounded-3xl bg-white p-6 sm:p-8 space-y-4"
            >
              <h2 className="font-serif text-2xl font-bold text-[#1F1610] mb-2">
                {t.testimonials.formTitle}
              </h2>

              <div>
                <label
                  htmlFor="testi-author"
                  className="block text-xs font-bold text-[#1F1610] mb-1"
                >
                  {t.testimonials.authorName}
                </label>
                <input
                  id="testi-author"
                  type="text"
                  required
                  maxLength={100}
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder={t.testimonials.authorPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#FFF9F3] border border-[#FF9F43]/40 text-sm text-[#1F1610] focus:outline-none focus:border-[#FF9F43]"
                />
              </div>

              <div>
                <label
                  htmlFor="testi-relation"
                  className="block text-xs font-bold text-[#1F1610] mb-1"
                >
                  {t.testimonials.relationship}
                </label>
                <input
                  id="testi-relation"
                  type="text"
                  maxLength={100}
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder={t.testimonials.relationshipPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#FFF9F3] border border-[#FF9F43]/40 text-sm text-[#1F1610] focus:outline-none focus:border-[#FF9F43]"
                />
              </div>

              <div>
                <label
                  htmlFor="testi-category"
                  className="block text-xs font-bold text-[#1F1610] mb-1"
                >
                  {t.testimonials.category}
                </label>
                <select
                  id="testi-category"
                  value={category}
                  onChange={(e) =>
                    setCategory(
                      e.target.value as 'encouragement' | 'testimonial' | 'congratulations'
                    )
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#FFF9F3] border border-[#FF9F43]/40 text-sm text-[#1F1610] focus:outline-none focus:border-[#FF9F43]"
                >
                  <option value="encouragement">{t.testimonials.catEncouragement}</option>
                  <option value="testimonial">{t.testimonials.catTestimonial}</option>
                  {settings.resultStatus === 'confirmed_success' && (
                    <option value="congratulations">{t.testimonials.catCongratulations}</option>
                  )}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="testi-content"
                    className="block text-xs font-bold text-[#1F1610]"
                  >
                    {t.testimonials.content}
                  </label>
                  <span className="font-mono text-[11px] text-[#6B5B4E] tabular-nums">
                    {content.length} / 1500 {t.testimonials.charCount}
                  </span>
                </div>
                <textarea
                  id="testi-content"
                  required
                  rows={5}
                  maxLength={1500}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t.testimonials.contentPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#FFF9F3] border border-[#FF9F43]/40 text-sm text-[#1F1610] focus:outline-none focus:border-[#FF9F43]"
                />
              </div>

              <label className="flex items-start gap-2.5 text-xs text-[#1F1610] cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-0.5 rounded border-[#FF9F43]"
                />
                <span>{t.testimonials.consent}</span>
              </label>

              {submitError && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-800">
                  {submitError}
                </div>
              )}

              {submittedSuccess && (
                <div className="p-3.5 rounded-md bg-[#FFF2E2] border border-[#FF9F43] text-xs font-bold text-[#9A4D06] flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#E67E22] shrink-0" />
                  <span>{t.testimonials.successPending}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !consentGiven}
                className="neon-bubble w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#FF9F43] text-[#1A1008] text-xs sm:text-sm font-bold hover:bg-[#FFB870] disabled:opacity-50 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? t.testimonials.submitting : t.testimonials.submit}</span>
              </button>
            </form>
          ) : (
            <div className="neon-section p-6 rounded-2xl bg-white text-sm text-[#5C4B3E]">
              {locale === 'fr'
                ? "L'envoi de nouveaux messages est momentanément fermé."
                : 'Submitting new messages is currently closed.'}
            </div>
          )}
        </div>
      </div>

      {removalModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="removal-modal-title"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="neon-section bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 id="removal-modal-title" className="font-serif text-xl font-bold text-[#1F1610]">
                {t.testimonials.removalModalTitle}
              </h2>
              <button
                type="button"
                onClick={() => setRemovalModalOpen(false)}
                className="p-1 text-[#6B5B4E] hover:text-[#1F1610]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {removalSent ? (
              <p className="text-sm text-[#9A4D06] font-bold py-4">
                {t.testimonials.removalSuccess}
              </p>
            ) : (
              <form onSubmit={handleSendRemoval} className="space-y-4">
                <div>
                  <label
                    htmlFor="removal-reason"
                    className="block text-xs font-bold text-[#1F1610] mb-1.5"
                  >
                    {t.testimonials.removalReason}
                  </label>
                  <textarea
                    id="removal-reason"
                    required
                    rows={3}
                    value={removalReason}
                    onChange={(e) => setRemovalReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-[#FF9F43]/40 text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRemovalModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-[#6B5B4E]"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-full bg-[#FF9F43] text-[#1A1008] text-xs font-bold"
                  >
                    {t.testimonials.removalSubmit}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
