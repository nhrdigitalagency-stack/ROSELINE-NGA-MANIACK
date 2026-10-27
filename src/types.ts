export type EventStatus = 'upcoming' | 'event_day' | 'completed';
export type ResultStatus = 'not_announced' | 'confirmed_success';
export type ModerationStatus = 'pending' | 'approved' | 'rejected';
export type GalleryVisibility = 'private' | 'public';
export type Locale = 'fr' | 'en';

export interface ProgramStep {
  id: string;
  order: number;
  titleFr: string;
  titleEn: string;
  descriptionFr: string;
  descriptionEn: string;
  timeIndication: string;
  confirmed: boolean;
}

export interface AcademicMilestone {
  id: string;
  order: number;
  category: 'formation' | 'recherche' | 'preparation';
  titleFr: string;
  titleEn: string;
  subtitleFr: string;
  subtitleEn: string;
  descriptionFr: string;
  descriptionEn: string;
}

export interface EventSettings {
  honoreeName: string;
  degreeLabel: string;
  fieldOfStudy: string;
  institutionName: string;
  institutionOfficialName: string;
  institutionConfirmed: boolean;
  eventDate: string | null; // YYYY-MM-DD or null
  startTime: string; // "12:30"
  endTime: string; // "15:40"
  timeZone: string; // "Africa/Douala"
  amphitheatre: string; // "Amphi 250"
  room: string; // "Salle SA B2"
  sameSpaceConfirmed: boolean;
  locationConfirmed: boolean;
  address: string;
  mapsUrl: string;
  venuePhotoUrl: string;
  portraitUrl: string;
  dissertationTitle: string;
  dissertationTitleEn: string;
  dissertationSubtitle: string;
  dissertationSubtitleEn: string;
  dissertationDomain: string;
  dissertationDomainEn: string;
  dissertationProblematic: string;
  dissertationProblematicEn: string;
  dissertationSummary: string;
  dissertationSummaryEn: string;
  dissertationObjectives: string[];
  dissertationObjectivesEn: string[];
  dissertationKeywords: string[];
  dissertationKeywordsEn: string[];
  supervisorName: string;
  juryMembers: string[];
  dissertationCoverUrl: string;
  dissertationPdfUrl: string;
  allowPdfDownload: boolean;
  publicAccessInformation: string;
  publicAccessInformationEn: string;
  acknowledgementsTextFr: string;
  acknowledgementsTextEn: string;
  contactName: string;
  whatsappNumber: string;
  eventStatus: EventStatus;
  resultStatus: ResultStatus;
  resultPublicText: string;
  resultPublicTextEn: string;
  laureateTitleConfirmed: boolean;
  allowRsvp: boolean;
  allowAcccompanyingGuests: boolean;
  allowTestimonials: boolean;
  allowPhotoContributions: boolean;
  galleryVisibility: GalleryVisibility;
  defaultLocale: Locale;
  supportedLocales: Locale[];
  siteUrl: string;
  retentionMonths: number;
  programSteps: ProgramStep[];
  milestones: AcademicMilestone[];
}

export interface Announcement {
  id: string;
  type: 'room_change' | 'access_detail' | 'schedule_update' | 'general';
  titleFr: string;
  titleEn: string;
  messageFr: string;
  messageEn: string;
  isActive: boolean;
  createdAt: string;
}

export interface RsvpSubmission {
  id: string;
  firstName: string;
  lastName?: string;
  attendance: 'present' | 'absent' | 'maybe';
  guestsCount: number;
  message?: string;
  channel: 'database' | 'whatsapp';
  createdAt: string;
}

export interface Testimonial {
  id: string;
  authorName: string;
  relationship?: string;
  category: 'encouragement' | 'testimonial' | 'congratulations';
  content: string;
  consentGiven: boolean;
  status: ModerationStatus;
  removalRequested?: boolean;
  removalReason?: string;
  createdAt: string;
  moderatedAt?: string;
}

export interface PhotoItem {
  id: string;
  contributorName: string;
  showContributorName: boolean;
  caption?: string;
  category: 'official' | 'preparation' | 'defense' | 'group' | 'ceremony';
  imageUrl: string;
  thumbnailUrl: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  consentGiven: boolean;
  status: ModerationStatus;
  createdAt: string;
  moderatedAt?: string;
}

export interface PublicSitePayload {
  settings: EventSettings;
  announcements: Announcement[];
  testimonials: Testimonial[];
  photos: PhotoItem[];
  galleryUnlocked: boolean;
  backendStatus: {
    sanityConnected: boolean;
    sanityProjectId: string;
    supabaseConfigured: boolean;
    storageReady: boolean;
  };
}
