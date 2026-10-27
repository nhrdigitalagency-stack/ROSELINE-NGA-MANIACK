import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import {
  EventSettings,
  Announcement,
  RsvpSubmission,
  Testimonial,
  PhotoItem,
  ModerationStatus,
} from './src/types';

dotenv.config();

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

// Ensure data and uploads directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Sanity Configuration (Server-Side Only)
const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID || 'occg14cs';
const SANITY_ORG_ID = process.env.SANITY_ORGANIZATION_ID || 'oh314dkvd';
const SANITY_DATASET = process.env.SANITY_DATASET || 'production';
const SANITY_TOKEN = process.env.SANITY_API_TOKEN || '';

// Admin & Gallery Secrets (Server-Side Only)
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'roseline.admin@inseck.cm').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Roseline2026!Admin';
const GALLERY_ACCESS_CODE = (process.env.GALLERY_ACCESS_CODE || 'RNM2026').toUpperCase();

interface PersistentStore {
  settings: EventSettings;
  announcements: Announcement[];
  rsvps: RsvpSubmission[];
  testimonials: Testimonial[];
  photos: PhotoItem[];
  lastSanitySyncAt: string | null;
}

const INITIAL_SETTINGS: EventSettings = {
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
    'This undergraduate dissertation examines the contemporary tension shaping the liability regime of commercial company directors. On one hand, protecting shareholders, creditors, and economic public order requires rigorous oversight of management misconduct. On the other hand, economic vitality requires avoiding the paralysis of strategic decision-making caused by excessive fear of sanction.',
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
  siteUrl: process.env.APP_URL || '',
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

function loadStore(): PersistentStore {
  const defaultPhotos: PhotoItem[] = [
    {
      id: 'photo-official-portrait',
      contributorName: 'Roseline Nga Maniack',
      showContributorName: true,
      caption: 'Portrait officiel — Roseline Nga Maniack (Licence en droit des affaires)',
      category: 'official',
      imageUrl: '/assets/aistudio/Portrait_de_dipl_m_e_tenant_son_dipl_me_8614093b.png',
      thumbnailUrl: '/assets/aistudio/Portrait_de_dipl_m_e_tenant_son_dipl_me_8614093b.png',
      mimeType: 'image/png',
      fileSize: 420000,
      consentGiven: true,
      status: 'approved',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'photo-jury-defense',
      contributorName: 'Roseline Nga Maniack',
      showContributorName: true,
      caption: 'Soutenance et présentation des travaux devant les membres du jury',
      category: 'defense',
      imageUrl: '/assets/aistudio/Soutenance_devant_le_jury_24daadeb.png',
      thumbnailUrl: '/assets/aistudio/Soutenance_devant_le_jury_24daadeb.png',
      mimeType: 'image/png',
      fileSize: 510000,
      consentGiven: true,
      status: 'approved',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'photo-family-pride',
      contributorName: 'Roseline Nga Maniack',
      showContributorName: true,
      caption: 'Portrait familial de fierté et de partage autour de cette étape académique',
      category: 'group',
      imageUrl: '/assets/aistudio/Portrait_familial_de_fiert__et_de_r_ussite_02488a8f.png',
      thumbnailUrl: '/assets/aistudio/Portrait_familial_de_fiert__et_de_r_ussite_02488a8f.png',
      mimeType: 'image/png',
      fileSize: 540000,
      consentGiven: true,
      status: 'approved',
      createdAt: new Date().toISOString(),
    },
  ];

  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as PersistentStore;
      const existingIds = new Set((parsed.photos || []).map((p) => p.id));
      const mergedPhotos = [
        ...(parsed.photos || []),
        ...defaultPhotos.filter((dp) => !existingIds.has(dp.id)),
      ];
      const filteredAnnouncements = (parsed.announcements || []).filter(
        (a) => a.id !== 'ann-initial-location'
      );
      return {
        ...parsed,
        settings: { ...INITIAL_SETTINGS, ...parsed.settings },
        announcements: filteredAnnouncements,
        photos: mergedPhotos,
      };
    }
  } catch {
    // fallback to initial store
  }

  const initialStore: PersistentStore = {
    settings: INITIAL_SETTINGS,
    announcements: [],
    rsvps: [],
    testimonials: [],
    photos: defaultPhotos,
    lastSanitySyncAt: null,
  };

  saveStore(initialStore);
  return initialStore;
}

function saveStore(store: PersistentStore): void {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

let store = loadStore();

/**
 * Syncs store state with Sanity Content Lake (Project ID: occg14cs) using Sanity HTTP Mutations API.
 */
async function syncToSanity(currentStore: PersistentStore): Promise<boolean> {
  if (!SANITY_PROJECT_ID || !SANITY_TOKEN) return false;
  try {
    const endpoint = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2023-08-01/data/mutate/${SANITY_DATASET}`;
    const mutations = [
      {
        createOrReplace: {
          _id: 'rnm-event-settings',
          _type: 'eventSettings',
          honoreeName: currentStore.settings.honoreeName,
          degreeLabel: currentStore.settings.degreeLabel,
          fieldOfStudy: currentStore.settings.fieldOfStudy,
          institutionName: currentStore.settings.institutionName,
          institutionOfficialName: currentStore.settings.institutionOfficialName,
          institutionConfirmed: currentStore.settings.institutionConfirmed,
          eventDate: currentStore.settings.eventDate,
          startTime: currentStore.settings.startTime,
          endTime: currentStore.settings.endTime,
          timeZone: currentStore.settings.timeZone,
          amphitheatre: currentStore.settings.amphitheatre,
          room: currentStore.settings.room,
          sameSpaceConfirmed: currentStore.settings.sameSpaceConfirmed,
          locationConfirmed: currentStore.settings.locationConfirmed,
          whatsappNumber: currentStore.settings.whatsappNumber,
          eventStatus: currentStore.settings.eventStatus,
          resultStatus: currentStore.settings.resultStatus,
          resultPublicText: currentStore.settings.resultPublicText,
          allowRsvp: currentStore.settings.allowRsvp,
          allowTestimonials: currentStore.settings.allowTestimonials,
          allowPhotoContributions: currentStore.settings.allowPhotoContributions,
          galleryVisibility: currentStore.settings.galleryVisibility,
        },
      },
      {
        createOrReplace: {
          _id: 'rnm-dissertation-content',
          _type: 'dissertationContent',
          titleFr: currentStore.settings.dissertationTitle,
          titleEn: currentStore.settings.dissertationTitleEn,
          subtitleFr: currentStore.settings.dissertationSubtitle,
          subtitleEn: currentStore.settings.dissertationSubtitleEn,
          problematicFr: currentStore.settings.dissertationProblematic,
          problematicEn: currentStore.settings.dissertationProblematicEn,
          summaryFr: currentStore.settings.dissertationSummary,
          summaryEn: currentStore.settings.dissertationSummaryEn,
          supervisorName: currentStore.settings.supervisorName,
        },
      },
    ];

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SANITY_TOKEN}`,
      },
      body: JSON.stringify({ mutations }),
    });

    if (res.ok) {
      currentStore.lastSanitySyncAt = new Date().toISOString();
      saveStore(currentStore);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function pushDocumentToSanity(doc: Record<string, unknown>): Promise<void> {
  if (!SANITY_PROJECT_ID || !SANITY_TOKEN) return;
  try {
    const endpoint = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2023-08-01/data/mutate/${SANITY_DATASET}`;
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SANITY_TOKEN}`,
      },
      body: JSON.stringify({
        mutations: [{ createOrReplace: doc }],
      }),
    });
  } catch {
    // non-blocking
  }
}

/**
 * Uploads a binary image buffer to Sanity Assets API (Project ID: occg14cs)
 * and returns the Sanity CDN URL and asset document _id.
 */
async function uploadImageAssetToSanity(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<{ assetId: string; url: string } | null> {
  if (!SANITY_PROJECT_ID || !SANITY_TOKEN) return null;
  try {
    const endpoint = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2023-08-01/assets/images/${SANITY_DATASET}?filename=${encodeURIComponent(
      filename
    )}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': mimeType,
        Authorization: `Bearer ${SANITY_TOKEN}`,
      },
      body: new Uint8Array(buffer),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      document?: { _id?: string; url?: string };
    };
    if (data?.document?._id && data?.document?.url) {
      return {
        assetId: data.document._id,
        url: data.document.url,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Pulls photoItem documents from Sanity Content Lake on startup so any images
 * imported via Sanity or previous sessions remain available in the gallery.
 */
async function hydratePhotosFromSanity(currentStore: PersistentStore): Promise<void> {
  if (!SANITY_PROJECT_ID) return;
  try {
    const query = encodeURIComponent(
      '*[_type == "photoItem"] | order(createdAt desc) { _id, contributorName, showContributorName, caption, category, status, imageUrl, thumbnailUrl, "assetUrl": image.asset->url, createdAt }'
    );
    const endpoint = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2023-08-01/data/query/${SANITY_DATASET}?query=${query}`;
    const headers: Record<string, string> = {};
    if (SANITY_TOKEN) headers.Authorization = `Bearer ${SANITY_TOKEN}`;

    const res = await fetch(endpoint, { headers });
    if (!res.ok) return;
    const payload = (await res.json()) as {
      result?: Array<{
        _id: string;
        contributorName?: string;
        showContributorName?: boolean;
        caption?: string;
        category?: PhotoItem['category'];
        status?: ModerationStatus;
        imageUrl?: string;
        thumbnailUrl?: string;
        assetUrl?: string;
        createdAt?: string;
      }>;
    };

    if (!Array.isArray(payload.result) || payload.result.length === 0) return;

    const existingIds = new Set(currentStore.photos.map((p) => p.id));
    let changed = false;

    for (const doc of payload.result) {
      const resolvedUrl = doc.assetUrl || doc.imageUrl || '';
      if (!resolvedUrl) continue;
      // Skip local media paths if the local file doesn't exist and there's no Sanity CDN URL
      if (resolvedUrl.startsWith('/api/media/')) {
        const localFile = path.join(UPLOADS_DIR, path.basename(resolvedUrl));
        if (!fs.existsSync(localFile)) continue;
      }

      if (!existingIds.has(doc._id)) {
        currentStore.photos.push({
          id: doc._id,
          contributorName: doc.contributorName || 'Invité(e)',
          showContributorName: doc.showContributorName ?? true,
          caption: doc.caption || '',
          category: doc.category || 'ceremony',
          imageUrl: resolvedUrl,
          thumbnailUrl:
            doc.thumbnailUrl ||
            (doc.assetUrl ? `${doc.assetUrl}?w=600&auto=format` : resolvedUrl),
          mimeType: 'image/jpeg',
          fileSize: 0,
          consentGiven: true,
          status: doc.status || 'approved',
          createdAt: doc.createdAt || new Date().toISOString(),
        });
        existingIds.add(doc._id);
        changed = true;
      }
    }

    if (changed) {
      saveStore(currentStore);
    }
  } catch {
    // non-blocking
  }
}

// In-memory Admin Sessions & Rate Limiters
const activeAdminTokens = new Map<string, number>(); // token -> expiresAt timestamp
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count += 1;
  return true;
}

function sanitizePlainText(input: unknown, maxLen: number): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLen);
}

function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const expiresAt = activeAdminTokens.get(token);

  if (!token || !expiresAt || Date.now() > expiresAt) {
    if (token) activeAdminTokens.delete(token);
    res.status(401).json({ error: 'Non autorisé.' });
    return;
  }
  next();
}

async function startServer() {
  const app = express();

  // Support base64 photo uploads up to 15MB
  app.use(express.json({ limit: '16mb' }));

  // Initial background Sanity sync & photo hydration
  syncToSanity(store).catch(() => {});
  hydratePhotosFromSanity(store).catch(() => {});

  // Serve uploaded media files
  app.get('/api/media/:filename', (req: Request, res: Response) => {
    const filename = path.basename(String(req.params.filename || ''));
    const filePath = path.join(UPLOADS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      res.status(404).end();
      return;
    }
    res.sendFile(filePath);
  });

  // =========================================================================
  // PUBLIC API ROUTES
  // =========================================================================

  app.get('/api/public/site', (req: Request, res: Response) => {
    const guestCodeHeader = String(req.headers['x-gallery-code'] || '')
      .trim()
      .toUpperCase();
    const galleryUnlocked =
      store.settings.galleryVisibility === 'public' ||
      (guestCodeHeader.length > 0 && guestCodeHeader === GALLERY_ACCESS_CODE);

    const approvedTestimonials = store.testimonials.filter(
      (t) => t.status === 'approved' && !t.removalRequested
    );

    const approvedPhotos = galleryUnlocked
      ? store.photos.filter((p) => p.status === 'approved')
      : [];

    res.json({
      settings: store.settings,
      announcements: store.announcements.filter((a) => a.isActive),
      testimonials: approvedTestimonials,
      photos: approvedPhotos,
      galleryUnlocked,
      backendStatus: {
        sanityConnected: Boolean(SANITY_PROJECT_ID && SANITY_TOKEN),
        sanityProjectId: SANITY_PROJECT_ID,
        supabaseConfigured: Boolean(process.env.VITE_SUPABASE_URL),
        storageReady: true,
      },
    });
  });

  app.post('/api/public/gallery/verify-code', (req: Request, res: Response) => {
    const ip = req.ip || 'unknown';
    if (!checkRateLimit(`gallery-code:${ip}`, 15, 60_000)) {
      res.status(429).json({ error: 'Trop de tentatives. Veuillez patienter.' });
      return;
    }
    const code = sanitizePlainText(req.body?.code, 40).toUpperCase();
    if (code && code === GALLERY_ACCESS_CODE) {
      res.json({ ok: true });
    } else {
      res.status(403).json({ ok: false, error: 'Code invité invalide.' });
    }
  });

  app.post('/api/public/rsvp', async (req: Request, res: Response) => {
    const ip = req.ip || 'unknown';
    if (!checkRateLimit(`rsvp:${ip}`, 10, 60_000)) {
      res.status(429).json({ error: 'Trop de requêtes. Veuillez patienter.' });
      return;
    }
    if (!store.settings.allowRsvp) {
      res.status(403).json({ error: 'Les confirmations de présence sont fermées.' });
      return;
    }

    const firstName = sanitizePlainText(req.body?.firstName, 80);
    const lastName = sanitizePlainText(req.body?.lastName, 80);
    const attendanceRaw = req.body?.attendance;
    const attendance: 'present' | 'absent' | 'maybe' =
      attendanceRaw === 'absent' || attendanceRaw === 'maybe' ? attendanceRaw : 'present';
    const guestsCount = Math.max(0, Math.min(5, Number(req.body?.guestsCount) || 0));
    const message = sanitizePlainText(req.body?.message, 600);

    if (!firstName) {
      res.status(400).json({ error: 'Le prénom est requis.' });
      return;
    }

    const newRsvp: RsvpSubmission = {
      id: `rsvp-${crypto.randomUUID()}`,
      firstName,
      lastName,
      attendance,
      guestsCount: attendance === 'present' ? guestsCount : 0,
      message,
      channel: 'database',
      createdAt: new Date().toISOString(),
    };

    store.rsvps.unshift(newRsvp);
    saveStore(store);

    await pushDocumentToSanity({
      _id: newRsvp.id,
      _type: 'rsvpSubmission',
      ...newRsvp,
    });

    res.status(201).json({ ok: true, id: newRsvp.id });
  });

  app.post('/api/public/testimonials', async (req: Request, res: Response) => {
    const ip = req.ip || 'unknown';
    if (!checkRateLimit(`testimonial:${ip}`, 8, 60_000)) {
      res.status(429).json({ error: 'Limite atteinte. Veuillez patienter une minute.' });
      return;
    }
    if (!store.settings.allowTestimonials) {
      res.status(403).json({ error: 'Les témoignages sont fermés.' });
      return;
    }

    const authorName = sanitizePlainText(req.body?.authorName, 100);
    const relationship = sanitizePlainText(req.body?.relationship, 100);
    const categoryRaw = req.body?.category;
    const category: Testimonial['category'] =
      categoryRaw === 'testimonial' || categoryRaw === 'congratulations'
        ? categoryRaw
        : 'encouragement';
    const content = sanitizePlainText(req.body?.content, 1500);
    const consentGiven = Boolean(req.body?.consentGiven);

    if (!authorName || content.length < 3 || !consentGiven) {
      res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires et accepter la publication.' });
      return;
    }

    const newTestimonial: Testimonial = {
      id: `testi-${crypto.randomUUID()}`,
      authorName,
      relationship,
      category,
      content,
      consentGiven: true,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    store.testimonials.unshift(newTestimonial);
    saveStore(store);

    await pushDocumentToSanity({
      _id: newTestimonial.id,
      _type: 'testimonial',
      ...newTestimonial,
    });

    res.status(201).json({ ok: true, id: newTestimonial.id });
  });

  app.post('/api/public/testimonials/removal-request', (req: Request, res: Response) => {
    const testimonialId = sanitizePlainText(req.body?.testimonialId, 100);
    const reason = sanitizePlainText(req.body?.reason, 500);
    if (!reason) {
      res.status(400).json({ error: 'Motif requis.' });
      return;
    }

    if (testimonialId) {
      const target = store.testimonials.find((t) => t.id === testimonialId);
      if (target) {
        target.removalRequested = true;
        target.removalReason = reason;
        saveStore(store);
      }
    } else {
      // Create an admin alert testimonial entry if no specific ID was selected
      store.testimonials.unshift({
        id: `removal-${crypto.randomUUID()}`,
        authorName: 'Demande de retrait',
        relationship: 'Signalement',
        category: 'testimonial',
        content: reason,
        consentGiven: true,
        status: 'pending',
        removalRequested: true,
        removalReason: reason,
        createdAt: new Date().toISOString(),
      });
      saveStore(store);
    }

    res.json({ ok: true });
  });

  app.post('/api/public/photos', async (req: Request, res: Response) => {
    const ip = req.ip || 'unknown';
    if (!checkRateLimit(`photo-upload:${ip}`, 15, 60_000)) {
      res.status(429).json({ error: 'Trop de fichiers envoyés. Veuillez patienter.' });
      return;
    }
    if (!store.settings.allowPhotoContributions) {
      res.status(403).json({ error: "L'envoi de photos est fermé." });
      return;
    }

    const contributorName = sanitizePlainText(req.body?.contributorName, 100);
    const showContributorName = Boolean(req.body?.showContributorName);
    const caption = sanitizePlainText(req.body?.caption, 300);
    const categoryRaw = req.body?.category;
    const category: PhotoItem['category'] = [
      'official',
      'preparation',
      'defense',
      'group',
      'ceremony',
    ].includes(categoryRaw)
      ? categoryRaw
      : 'ceremony';
    const consentGiven = Boolean(req.body?.consentGiven);
    const imageDataUrl = String(req.body?.imageDataUrl || '');
    const thumbnailDataUrl = String(req.body?.thumbnailDataUrl || '');

    if (!contributorName || !consentGiven || !imageDataUrl.startsWith('data:image/')) {
      res.status(400).json({ error: 'Données image ou consentement manquants.' });
      return;
    }

    const match = imageDataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
    if (!match) {
      res.status(400).json({ error: 'Format image non autorisé (JPEG, PNG, WebP uniquement).' });
      return;
    }

    const mimeType = match[1];
    const base64Data = match[2];
    const imgBuffer = Buffer.from(base64Data, 'base64');

    if (imgBuffer.byteLength > 10 * 1024 * 1024) {
      res.status(400).json({ error: 'Le fichier dépasse la taille maximale de 10 Mo.' });
      return;
    }

    // Verify magic bytes on server
    const isJpeg = imgBuffer[0] === 0xff && imgBuffer[1] === 0xd8 && imgBuffer[2] === 0xff;
    const isPng =
      imgBuffer[0] === 0x89 &&
      imgBuffer[1] === 0x50 &&
      imgBuffer[2] === 0x4e &&
      imgBuffer[3] === 0x47;
    const isWebp =
      imgBuffer[0] === 0x52 &&
      imgBuffer[1] === 0x49 &&
      imgBuffer[2] === 0x46 &&
      imgBuffer[3] === 0x46;

    if (!isJpeg && !isPng && !isWebp) {
      res.status(400).json({ error: 'Signature binaire du fichier image invalide.' });
      return;
    }

    const ext = isPng ? 'png' : isWebp ? 'webp' : 'jpg';
    const randomId = crypto.randomUUID();
    const mainFilename = `photo_${randomId}.${ext}`;
    const thumbFilename = `thumb_${randomId}.jpg`;

    fs.writeFileSync(path.join(UPLOADS_DIR, mainFilename), imgBuffer);

    let thumbUrl = `/api/media/${mainFilename}`;
    const thumbMatch = thumbnailDataUrl.match(/^data:image\/jpeg;base64,(.+)$/);
    if (thumbMatch) {
      const thumbBuf = Buffer.from(thumbMatch[1], 'base64');
      fs.writeFileSync(path.join(UPLOADS_DIR, thumbFilename), thumbBuf);
      thumbUrl = `/api/media/${thumbFilename}`;
    }

    // Upload binary image directly to Sanity Assets CDN (if Sanity token is configured)
    const sanityAsset = await uploadImageAssetToSanity(imgBuffer, mimeType, mainFilename);
    const finalImageUrl = sanityAsset?.url || `/api/media/${mainFilename}`;
    const finalThumbUrl = sanityAsset?.url
      ? `${sanityAsset.url}?w=600&auto=format`
      : thumbUrl;

    const newPhoto: PhotoItem = {
      id: `photo-${randomId}`,
      contributorName,
      showContributorName,
      caption,
      category,
      imageUrl: finalImageUrl,
      thumbnailUrl: finalThumbUrl,
      mimeType,
      fileSize: imgBuffer.byteLength,
      width: Number(req.body?.width) || undefined,
      height: Number(req.body?.height) || undefined,
      consentGiven: true,
      status: 'approved',
      createdAt: new Date().toISOString(),
    };

    store.photos.unshift(newPhoto);
    saveStore(store);

    await pushDocumentToSanity({
      _id: newPhoto.id,
      _type: 'photoItem',
      contributorName: newPhoto.contributorName,
      showContributorName: newPhoto.showContributorName,
      caption: newPhoto.caption,
      category: newPhoto.category,
      status: newPhoto.status,
      imageUrl: newPhoto.imageUrl,
      thumbnailUrl: newPhoto.thumbnailUrl,
      ...(sanityAsset
        ? {
            image: {
              _type: 'image',
              asset: {
                _type: 'reference',
                _ref: sanityAsset.assetId,
              },
            },
          }
        : {}),
      createdAt: newPhoto.createdAt,
    });

    res.status(201).json({
      ok: true,
      id: newPhoto.id,
      imageUrl: newPhoto.imageUrl,
      sanityUploaded: Boolean(sanityAsset),
    });
  });

  // =========================================================================
  // ADMIN AUTHENTICATION & PROTECTED ROUTES
  // =========================================================================

  app.post('/api/admin/login', (req: Request, res: Response) => {
    const ip = req.ip || 'unknown';
    if (!checkRateLimit(`admin-login:${ip}`, 8, 60_000)) {
      res.status(429).json({ error: 'Trop de tentatives de connexion. Réessayez dans une minute.' });
      return;
    }

    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = crypto.randomBytes(32).toString('hex');
      activeAdminTokens.set(token, Date.now() + 8 * 60 * 60 * 1000); // 8 hours
      res.json({ token });
    } else {
      res.status(401).json({ error: 'Email ou mot de passe administrateur incorrect.' });
    }
  });

  app.post('/api/admin/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (token) activeAdminTokens.delete(token);
    res.json({ ok: true });
  });

  app.get('/api/admin/dashboard', requireAdminAuth, (_req: Request, res: Response) => {
    res.json({
      settings: store.settings,
      announcements: store.announcements,
      testimonials: store.testimonials,
      photos: store.photos,
      rsvps: store.rsvps,
      sanityStatus: {
        connected: Boolean(SANITY_PROJECT_ID && SANITY_TOKEN),
        projectId: SANITY_PROJECT_ID,
        organizationId: SANITY_ORG_ID,
        dataset: SANITY_DATASET,
        lastSyncAt: store.lastSanitySyncAt,
      },
    });
  });

  app.put('/api/admin/settings', requireAdminAuth, async (req: Request, res: Response) => {
    const incoming = req.body?.settings;
    if (!incoming || typeof incoming !== 'object') {
      res.status(400).json({ error: 'Paramètres invalides.' });
      return;
    }
    store.settings = {
      ...store.settings,
      ...incoming,
    };
    saveStore(store);
    await syncToSanity(store);
    res.json({ ok: true, settings: store.settings });
  });

  app.patch('/api/admin/testimonials/:id', requireAdminAuth, async (req: Request, res: Response) => {
    const status = req.body?.status as ModerationStatus;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Statut invalide.' });
      return;
    }
    const item = store.testimonials.find((t) => t.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Témoignage introuvable.' });
      return;
    }
    item.status = status;
    item.moderatedAt = new Date().toISOString();
    saveStore(store);

    await pushDocumentToSanity({
      _id: item.id,
      _type: 'testimonial',
      ...item,
    });

    res.json({ ok: true });
  });

  app.delete('/api/admin/testimonials/:id', requireAdminAuth, (req: Request, res: Response) => {
    store.testimonials = store.testimonials.filter((t) => t.id !== req.params.id);
    saveStore(store);
    res.json({ ok: true });
  });

  app.patch('/api/admin/photos/:id', requireAdminAuth, async (req: Request, res: Response) => {
    const status = req.body?.status as ModerationStatus;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Statut invalide.' });
      return;
    }
    const photo = store.photos.find((p) => p.id === req.params.id);
    if (!photo) {
      res.status(404).json({ error: 'Photo introuvable.' });
      return;
    }
    photo.status = status;
    photo.moderatedAt = new Date().toISOString();
    saveStore(store);

    await pushDocumentToSanity({
      _id: photo.id,
      _type: 'photoItem',
      contributorName: photo.contributorName,
      caption: photo.caption,
      category: photo.category,
      status: photo.status,
      imageUrl: photo.imageUrl,
      createdAt: photo.createdAt,
    });

    res.json({ ok: true });
  });

  app.delete('/api/admin/photos/:id', requireAdminAuth, (req: Request, res: Response) => {
    const target = store.photos.find((p) => p.id === req.params.id);
    if (target) {
      // Clean up local uploaded files if stored in /api/media/
      for (const url of [target.imageUrl, target.thumbnailUrl]) {
        if (url && url.startsWith('/api/media/')) {
          const fname = path.basename(url);
          const fpath = path.join(UPLOADS_DIR, fname);
          if (fs.existsSync(fpath)) {
            try {
              fs.unlinkSync(fpath);
            } catch {
              // ignore unlink error
            }
          }
        }
      }
    }
    store.photos = store.photos.filter((p) => p.id !== req.params.id);
    saveStore(store);
    res.json({ ok: true });
  });

  app.delete('/api/admin/rsvps/:id', requireAdminAuth, (req: Request, res: Response) => {
    store.rsvps = store.rsvps.filter((r) => r.id !== req.params.id);
    saveStore(store);
    res.json({ ok: true });
  });

  app.post('/api/admin/announcements', requireAdminAuth, (req: Request, res: Response) => {
    const titleFr = sanitizePlainText(req.body?.titleFr, 140);
    const titleEn = sanitizePlainText(req.body?.titleEn, 140) || titleFr;
    const messageFr = sanitizePlainText(req.body?.messageFr, 600);
    const messageEn = sanitizePlainText(req.body?.messageEn, 600) || messageFr;
    const typeRaw = req.body?.type;
    const type: Announcement['type'] = [
      'room_change',
      'access_detail',
      'schedule_update',
      'general',
    ].includes(typeRaw)
      ? typeRaw
      : 'general';

    if (!titleFr || !messageFr) {
      res.status(400).json({ error: 'Titre et message requis.' });
      return;
    }

    const ann: Announcement = {
      id: `ann-${crypto.randomUUID()}`,
      type,
      titleFr,
      titleEn,
      messageFr,
      messageEn,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    store.announcements.unshift(ann);
    saveStore(store);
    res.status(201).json({ ok: true, announcement: ann });
  });

  app.patch('/api/admin/announcements/:id', requireAdminAuth, (req: Request, res: Response) => {
    const ann = store.announcements.find((a) => a.id === req.params.id);
    if (!ann) {
      res.status(404).json({ error: 'Annonce introuvable.' });
      return;
    }
    ann.isActive = Boolean(req.body?.isActive);
    saveStore(store);
    res.json({ ok: true });
  });

  app.delete('/api/admin/announcements/:id', requireAdminAuth, (req: Request, res: Response) => {
    store.announcements = store.announcements.filter((a) => a.id !== req.params.id);
    saveStore(store);
    res.json({ ok: true });
  });

  app.post('/api/admin/sanity-sync', requireAdminAuth, async (_req: Request, res: Response) => {
    const ok = await syncToSanity(store);
    res.json({ ok, lastSyncAt: store.lastSanitySyncAt });
  });

  // =========================================================================
  // VITE MIDDLEWARE (DEV) OR STATIC ASSETS (PROD)
  // =========================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
