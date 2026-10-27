import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from './i18n/I18nContext';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { DissertationPage } from './pages/DissertationPage';
import { TestimonialsPage } from './pages/TestimonialsPage';
import { GalleryPage } from './pages/GalleryPage';
import { UploadPhotosPage } from './pages/UploadPhotosPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { AdminPage } from './pages/AdminPage';
import {
  EventSettings,
  Announcement,
  Testimonial,
  PhotoItem,
  PublicSitePayload,
} from './types';

const DEFAULT_SETTINGS: EventSettings = {
  honoreeName: 'Roseline Nga Maniack',
  degreeLabel: 'Licence',
  fieldOfStudy: 'Droit des affaires',
  institutionName: 'Université de Ngoakele',
  institutionOfficialName: 'Université de Ngoa-Ekellé — Précisément INSECK',
  institutionConfirmed: true,
  eventDate: '2026-12-23',
  startTime: '12:30',
  endTime: '15:40',
  timeZone: 'Africa/Douala',
  amphitheatre: 'Amphi 250',
  room: 'Salle SA B2',
  sameSpaceConfirmed: true,
  locationConfirmed: true,
  address: 'Campus de Ngoa-Ekellé, INSECK, Yaoundé',
  mapsUrl: '',
  venuePhotoUrl: '',
  portraitUrl: '/assets/aistudio/Portrait_de_dipl_m_e_tenant_son_dipl_me_8614093b.png',
  dissertationTitle:
    'La responsabilité des dirigeants de sociétés commerciales : Entre renforcement des contrôles et incitation à la prise de risque',
  dissertationTitleEn:
    "Corporate Directors' Liability in Commercial Companies: Between Strengthened Oversight and Risk-Taking Incentives",
  dissertationSubtitle:
    "Étude des mécanismes d'équilibre juridique en droit des sociétés commerciales",
  dissertationSubtitleEn:
    'A study of legal balancing mechanisms in commercial corporate law',
  dissertationDomain:
    "Droit des affaires · Droit des sociétés commerciales et gouvernance d'entreprise",
  dissertationDomainEn:
    'Business Law · Commercial Corporate Law & Corporate Governance',
  dissertationProblematic:
    "Comment concilier l'exigence croissante de contrôle et de transparence imposée aux dirigeants sociaux avec la nécessité de préserver leur liberté d'initiative et la prise de risque inhérente à la vie des affaires ?",
  dissertationProblematicEn:
    'How can the growing demand for oversight and transparency imposed on corporate directors be reconciled with the need to preserve entrepreneurial initiative and the risk-taking inherent in business life?',
  dissertationSummary:
    "Ce mémoire de licence analyse la tension contemporaine qui traverse le régime de responsabilité des dirigeants de sociétés commerciales. D'une part, la protection des associés, des créanciers et de l'ordre public économique conduit à un encadrement rigoureux des fautes de gestion. D'autre part, l'efficacité économique suppose de ne pas paralyser la décision stratégique par une crainte excessive de la sanction.",
  dissertationSummaryEn:
    'This undergraduate dissertation examines the contemporary tension shaping the liability regime of commercial company directors. On one hand, protecting shareholders, creditors, and economic public order requires rigorous oversight of management misconduct. On one hand, economic vitality requires avoiding the paralysis of strategic decision-making caused by excessive fear of sanction.',
  dissertationObjectives: [
    'Analyser les fondements civils, pénaux et statutaires de la responsabilité des dirigeants de sociétés commerciales',
    "Évaluer l'impact du renforcement des mécanismes de contrôle interne et externe sur la gouvernance sociétaire",
    "Identifier les garde-fous juridiques protégeant l'aléa normal et la prise de risque entrepreneuriale légitime",
  ],
  dissertationObjectivesEn: [
    "Analyze the civil, criminal, and statutory foundations of corporate directors' liability",
    'Evaluate the impact of strengthened internal and external oversight mechanisms on corporate governance',
    'Identify legal safeguards protecting normal business risk and legitimate entrepreneurial initiative',
  ],
  dissertationKeywords: [
    'Droit des affaires',
    'Sociétés commerciales',
    'Responsabilité des dirigeants',
    'Contrôle sociétaire',
    'Prise de risque',
    'Gouvernance',
  ],
  dissertationKeywordsEn: [
    'Business Law',
    'Commercial Companies',
    "Directors' Liability",
    'Corporate Oversight',
    'Risk-Taking',
    'Governance',
  ],
  supervisorName: '',
  juryMembers: [],
  dissertationCoverUrl: '',
  dissertationPdfUrl: '',
  allowPdfDownload: false,
  publicAccessInformation:
    "L'accès à l'Amphi 250 (Salle SA B2) au sein de l'INSECK (Université de Ngoa-Ekellé) s'effectue dans le respect du protocole académique. Il est recommandé de s'installer 15 minutes avant le début du créneau annoncé (12 h 30).",
  publicAccessInformationEn:
    'Access to Amphi 250 (Room SA B2) at INSECK (Université de Ngoa-Ekellé) follows academic protocol. Guests are kindly advised to be seated 15 minutes prior to the announced 12:30 PM time slot.',
  acknowledgementsTextFr:
    "Chaque étape de ce travail de recherche a été nourrie par la rigueur de l'enseignement reçu, la patience de l'accompagnement académique et la bienveillance constante de mes proches. Votre soutien discret ou exprimé donne tout son sens à cette soutenance.",
  acknowledgementsTextEn:
    'Every stage of this research has been shaped by rigorous academic instruction, thoughtful supervision, and the unwavering kindness of my family and friends. Your support—whether quiet or spoken—gives true meaning to this milestone.',
  contactName: 'Organisation Soutenance — Roseline Nga Maniack',
  whatsappNumber: '+237692738430',
  eventStatus: 'upcoming',
  resultStatus: 'not_announced',
  resultPublicText: '',
  resultPublicTextEn: '',
  laureateTitleConfirmed: false,
  allowRsvp: true,
  allowAcccompanyingGuests: true,
  allowTestimonials: true,
  allowPhotoContributions: true,
  galleryVisibility: 'public',
  defaultLocale: 'fr',
  supportedLocales: ['fr', 'en'],
  siteUrl: '',
  retentionMonths: 24,
  programSteps: [
    {
      id: 'step-1',
      order: 1,
      titleFr: 'Accueil et installation',
      titleEn: 'Guest Reception & Seating',
      descriptionFr:
        "Arrivée et installation des invités à l'Amphi 250 / Salle SA B2 (INSECK Ngoa-Ekellé) dans le respect des consignes de la salle.",
      descriptionEn:
        'Arrival and seating of guests at Amphi 250 / Room SA B2 (INSECK Ngoa-Ekellé) in accordance with auditorium guidelines.',
      timeIndication: '12:30',
      confirmed: true,
    },
    {
      id: 'step-2',
      order: 2,
      titleFr: 'Présentation du mémoire',
      titleEn: 'Dissertation Presentation',
      descriptionFr:
        'Exposé oral des travaux de recherche sur la responsabilité des dirigeants de sociétés commerciales devant les membres du jury.',
      descriptionEn:
        "Oral presentation of the research on corporate directors' liability before the examination committee.",
      timeIndication: '',
      confirmed: true,
    },
    {
      id: 'step-3',
      order: 3,
      titleFr: 'Échanges avec le jury',
      titleEn: 'Discussion with the Committee',
      descriptionFr:
        'Séance de questions, observations méthodologiques et débat scientifique avec le jury académique.',
      descriptionEn:
        'Questions, methodological observations, and academic discussion with the committee.',
      timeIndication: '',
      confirmed: true,
    },
    {
      id: 'step-4',
      order: 4,
      titleFr: 'Clôture et photos souvenirs',
      titleEn: 'Closing & Commemorative Photos',
      descriptionFr:
        'Clôture de la séance dans le créneau 12 h 30 – 15 h 40, suivie des photos souvenirs si autorisées.',
      descriptionEn:
        'Session closing within the 12:30 PM – 3:40 PM slot, followed by commemorative photos as permitted.',
      timeIndication: '15:40',
      confirmed: true,
    },
  ],
  milestones: [
    {
      id: 'm-1',
      order: 1,
      category: 'formation',
      titleFr: 'Formation universitaire en Droit des affaires',
      titleEn: 'Academic Training in Business Law',
      subtitleFr: 'Licence en droit des affaires · Université de Ngoa-Ekellé (INSECK)',
      subtitleEn: 'Bachelor of Business Law · Université de Ngoa-Ekellé (INSECK)',
      descriptionFr:
        'Acquisition des fondamentaux du droit privé, du droit commercial général et du droit des sociétés commerciales.',
      descriptionEn:
        'Core studies in private law, general commercial law, and corporate law.',
    },
    {
      id: 'm-2',
      order: 2,
      category: 'recherche',
      titleFr: 'Recherche et rédaction du mémoire',
      titleEn: 'Dissertation Research & Drafting',
      subtitleFr: 'Responsabilité des dirigeants de sociétés commerciales',
      subtitleEn: "Corporate Directors' Liability in Commercial Companies",
      descriptionFr:
        "Étude approfondie de l'équilibre entre le renforcement des mécanismes de contrôle et la préservation de l'incitation à la prise de risque.",
      descriptionEn:
        'In-depth analysis of the balance between strengthened corporate oversight and entrepreneurial risk-taking.',
    },
    {
      id: 'm-3',
      order: 3,
      category: 'preparation',
      titleFr: 'Soutenance de mémoire de licence',
      titleEn: 'Undergraduate Dissertation Defense',
      subtitleFr: '23 décembre 2026 · 12 h 30 – 15 h 40 · Amphi 250 (Salle SA B2)',
      subtitleEn: 'December 23, 2026 · 12:30 PM – 3:40 PM · Amphi 250 (Room SA B2)',
      descriptionFr:
        'Présentation publique des travaux et échanges académiques à l’INSECK (Université de Ngoa-Ekellé).',
      descriptionEn:
        'Oral defense and academic exchange at INSECK (Université de Ngoa-Ekellé).',
    },
  ],
};

const GUEST_CODE_STORAGE_KEY = 'rnm_gallery_guest_code';

export default function App() {
  const [settings, setSettings] = useState<EventSettings>(DEFAULT_SETTINGS);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [galleryUnlocked, setGalleryUnlocked] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const notify = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((prev) => (prev === msg ? null : prev));
    }, 4500);
  }, []);

  const fetchPublicSiteData = useCallback(async () => {
    try {
      const savedGuestCode = sessionStorage.getItem(GUEST_CODE_STORAGE_KEY) || '';
      const res = await fetch('/api/public/site', {
        headers: savedGuestCode ? { 'x-gallery-code': savedGuestCode } : {},
      });
      if (res.ok) {
        const data: PublicSitePayload = await res.json();
        setSettings(data.settings);
        setAnnouncements(data.announcements);
        setTestimonials(data.testimonials);
        setPhotos(data.photos);
        setGalleryUnlocked(data.galleryUnlocked);
      }
    } catch {
      // Fallback to default settings if offline
    }
  }, []);

  useEffect(() => {
    fetchPublicSiteData();
  }, [fetchPublicSiteData]);

  const handleSubmitRsvp = async (payload: {
    firstName: string;
    lastName?: string;
    attendance: 'present' | 'absent' | 'maybe';
    guestsCount: number;
    message?: string;
    channel: 'database' | 'whatsapp';
  }): Promise<boolean> => {
    try {
      const res = await fetch('/api/public/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const handleSubmitTestimonial = async (payload: {
    authorName: string;
    relationship?: string;
    category: 'encouragement' | 'testimonial' | 'congratulations';
    content: string;
    consentGiven: boolean;
  }): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/public/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return { ok: res.ok, error: data.error };
    } catch {
      return { ok: false };
    }
  };

  const handleRequestRemoval = async (payload: {
    testimonialId?: string;
    reason: string;
  }): Promise<boolean> => {
    try {
      const res = await fetch('/api/public/testimonials/removal-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const handleUnlockGallery = async (code: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/public/gallery/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        sessionStorage.setItem(GUEST_CODE_STORAGE_KEY, code);
        setGalleryUnlocked(true);
        await fetchPublicSiteData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleUploadSinglePhoto = async (payload: {
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
  }): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/public/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchPublicSiteData();
      }
      return { ok: res.ok, error: data.error };
    } catch {
      return { ok: false };
    }
  };

  return (
    <I18nProvider>
      <BrowserRouter>
        <Layout
          settings={settings}
          notification={notification}
          onNotify={notify}
          onClearNotification={() => setNotification(null)}
        >
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  settings={settings}
                  announcements={announcements}
                  testimonials={testimonials}
                  photos={photos}
                  galleryUnlocked={galleryUnlocked}
                  onNotify={notify}
                  onSubmitRsvp={handleSubmitRsvp}
                />
              }
            />
            <Route path="/memoire" element={<DissertationPage settings={settings} />} />
            <Route
              path="/temoignages"
              element={
                <TestimonialsPage
                  settings={settings}
                  testimonials={testimonials}
                  onSubmitTestimonial={handleSubmitTestimonial}
                  onRequestRemoval={handleRequestRemoval}
                  onNotify={notify}
                />
              }
            />
            <Route
              path="/souvenirs"
              element={
                <GalleryPage
                  settings={settings}
                  photos={photos}
                  galleryUnlocked={galleryUnlocked}
                  onUnlockGallery={handleUnlockGallery}
                  onUploadSinglePhoto={handleUploadSinglePhoto}
                  onNotify={notify}
                />
              }
            />
            <Route
              path="/partager-des-photos"
              element={
                <UploadPhotosPage
                  settings={settings}
                  onUploadSinglePhoto={handleUploadSinglePhoto}
                  onNotify={notify}
                />
              }
            />
            <Route path="/confidentialite" element={<PrivacyPage settings={settings} />} />
            <Route
              path="/admin"
              element={
                <AdminPage
                  onPublicDataRefresh={fetchPublicSiteData}
                  onNotify={notify}
                />
              }
            />
          </Routes>
        </Layout>
      </BrowserRouter>
    </I18nProvider>
  );
}
