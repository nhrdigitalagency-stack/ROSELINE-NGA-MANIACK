-- =============================================================================
-- SUPABASE POSTGRESQL SCHEMA, RLS POLICIES, BUCKETS & SERVER FUNCTIONS
-- Soutenance de mémoire de Licence en Droit des affaires — Roseline Nga Maniack
-- =============================================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- 1. EVENT SETTINGS TABLE
create table if not exists public.event_settings (
  id uuid primary key default gen_random_uuid(),
  honoree_name text not null default 'Roseline Nga Maniack',
  degree_label text not null default 'Licence',
  field_of_study text not null default 'Droit des affaires',
  institution_name text not null default 'Université de Ngoa-Ekellé — Institut Supérieur d''Enseignement Commercial et de Gestion (INSECK)',
  institution_confirmed boolean not null default true,
  event_date date default '2026-12-23',
  start_time text not null default '12:30',
  end_time text not null default '15:40',
  time_zone text not null default 'Africa/Douala',
  amphitheatre text not null default 'Amphi 250',
  room text not null default 'Salle SA B2',
  same_space_confirmed boolean not null default true,
  location_confirmed boolean not null default true,
  address text not null default 'Campus universitaire de Ngoa-Ekellé, INSECK, Yaoundé, Cameroun',
  maps_url text not null default '',
  portrait_url text not null default '/assets/aistudio/Portrait_de_dipl_m_e_tenant_son_dipl_me_8614093b.png',
  supervisor_name text not null default '',
  public_access_information text not null default 'Accès sur présentation de l''invitation et dans le respect du règlement académique de l''amphithéâtre (Amphi 250 / Salle SA B2). Arrivée recommandée 15 minutes avant le début du créneau.',
  contact_name text not null default 'Secrétariat d''organisation — Soutenance Roseline Nga Maniack',
  whatsapp_number text not null default '+237692738430',
  event_status text not null default 'upcoming' check (event_status in ('upcoming', 'event_day', 'completed')),
  result_status text not null default 'not_announced' check (result_status in ('not_announced', 'confirmed_success')),
  result_public_text text not null default '',
  laureate_badge_enabled boolean not null default false,
  allow_rsvp boolean not null default true,
  allow_testimonials boolean not null default true,
  allow_photo_contributions boolean not null default true,
  gallery_visibility text not null default 'private' check (gallery_visibility in ('private', 'public')),
  retention_months integer not null default 24,
  updated_at timestamptz not null default now()
);

-- 2. DISSERTATION CONTENT TABLE
create table if not exists public.dissertation_content (
  id uuid primary key default gen_random_uuid(),
  title_fr text not null default 'La responsabilité des dirigeants de sociétés commerciales : Entre renforcement des contrôles et incitation à la prise de risque',
  title_en text not null default 'Corporate Directors'' Liability in Commercial Companies: Between Strengthened Oversight and Risk-Taking Incentives',
  subtitle_fr text not null default 'Étude des mécanismes d''équilibre juridique en droit des sociétés commerciales',
  subtitle_en text not null default 'A study of legal balancing mechanisms in commercial corporate law',
  domain_fr text not null default 'Droit des affaires · Droit des sociétés commerciales et gouvernance d''entreprise',
  domain_en text not null default 'Business Law · Commercial Corporate Law & Corporate Governance',
  problematic_fr text not null default 'Comment concilier l''exigence croissante de contrôle et de transparence imposée aux dirigeants sociaux avec la nécessité de préserver leur liberté d''initiative et la prise de risque inhérente à la vie des affaires ?',
  problematic_en text not null default 'How can the growing demand for oversight and transparency imposed on corporate directors be reconciled with the need to preserve entrepreneurial initiative and the risk-taking inherent in business life?',
  summary_fr text not null default 'Ce mémoire de licence analyse la tension contemporaine qui traverse le régime de responsabilité des dirigeants de sociétés commerciales. D''une part, la protection des associés, des créanciers et de l''ordre public économique conduit à un encadrement rigoureux des fautes de gestion. D''autre part, l''efficacité économique suppose de ne pas paralyser la décision stratégique par une crainte excessive de la sanction.',
  summary_en text not null default 'This undergraduate dissertation examines the contemporary tension shaping the liability regime of commercial company directors. On one hand, protecting shareholders, creditors, and economic public order requires rigorous oversight of management misconduct. On the other hand, economic vitality requires avoiding the paralysis of strategic decision-making caused by excessive fear of sanction.',
  objectives_fr jsonb not null default '["Analyser les fondements civils, pénaux et statutaires de la responsabilité des dirigeants sociaux", "Évaluer l''impact du renforcement des mécanismes de contrôle interne et externe sur la gouvernance", "Identifier les garde-fous juridiques protégeant l''aléa normal de la décision entrepreneuriale"]'::jsonb,
  objectives_en jsonb not null default '["Analyze the civil, criminal, and statutory foundations of corporate directors'' liability", "Evaluate the impact of strengthened internal and external control mechanisms on governance", "Identify legal safeguards protecting the normal business risk of entrepreneurial decision-making"]'::jsonb,
  keywords_fr jsonb not null default '["Droit des affaires", "Sociétés commerciales", "Responsabilité des dirigeants", "Faute de gestion", "Gouvernance d''entreprise", "Prise de risque"]'::jsonb,
  keywords_en jsonb not null default '["Business Law", "Commercial Companies", "Directors'' Liability", "Management Misconduct", "Corporate Governance", "Risk-Taking"]'::jsonb,
  supervisor_name text not null default '',
  jury_members jsonb not null default '[]'::jsonb,
  cover_image_url text not null default '',
  document_url text not null default '',
  allow_download boolean not null default false,
  updated_at timestamptz not null default now()
);

-- 3. ANNOUNCEMENTS TABLE
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'access_detail' check (type in ('room_change', 'access_detail', 'schedule_update', 'general')),
  title_fr text not null,
  title_en text not null,
  message_fr text not null,
  message_en text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 4. RSVP SUBMISSIONS TABLE
create table if not exists public.rsvp_submissions (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text default '',
  attendance text not null check (attendance in ('present', 'absent', 'maybe')),
  guests_count integer not null default 0 check (guests_count between 0 and 5),
  message text default '' check (char_length(message) <= 600),
  channel text not null default 'database' check (channel in ('database', 'whatsapp')),
  created_at timestamptz not null default now()
);

-- 5. TESTIMONIALS TABLE (Moderation required before publication)
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null check (char_length(author_name) between 1 and 100),
  relationship text default '' check (char_length(relationship) <= 100),
  category text not null default 'encouragement' check (category in ('encouragement', 'testimonial', 'congratulations')),
  content text not null check (char_length(content) between 3 and 1500),
  consent_given boolean not null default true check (consent_given = true),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  removal_requested boolean not null default false,
  removal_reason text default '',
  created_at timestamptz not null default now(),
  moderated_at timestamptz
);

-- 6. PHOTO SUBMISSIONS & PHOTOS TABLES
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  contributor_name text not null check (char_length(contributor_name) between 1 and 100),
  show_contributor_name boolean not null default true,
  caption text default '' check (char_length(caption) <= 300),
  category text not null default 'ceremony' check (category in ('official', 'preparation', 'defense', 'group', 'ceremony')),
  storage_path text not null,
  thumbnail_path text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  file_size integer not null check (file_size <= 10485760),
  width integer,
  height integer,
  consent_given boolean not null default true check (consent_given = true),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  moderated_at timestamptz
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
alter table public.event_settings enable row level security;
alter table public.dissertation_content enable row level security;
alter table public.announcements enable row level security;
alter table public.rsvp_submissions enable row level security;
alter table public.testimonials enable row level security;
alter table public.photos enable row level security;

-- Public read access ONLY for settings, dissertation, active announcements, and APPROVED testimonials
create policy "Public read event_settings" on public.event_settings
  for select using (true);

create policy "Public read dissertation_content" on public.dissertation_content
  for select using (true);

create policy "Public read active announcements" on public.announcements
  for select using (is_active = true);

create policy "Public read approved testimonials only" on public.testimonials
  for select using (status = 'approved' and removal_requested = false);

-- Public insert for RSVP and pending Testimonials (validated server-side as well)
create policy "Public insert rsvp" on public.rsvp_submissions
  for insert with check (true);

create policy "Public insert pending testimonial" on public.testimonials
  for insert with check (status = 'pending' and consent_given = true);

-- Photos: only approved photos visible when gallery is public; otherwise served via signed server URLs
create policy "Public read approved photos when gallery public" on public.photos
  for select using (
    status = 'approved' and exists (
      select 1 from public.event_settings where gallery_visibility = 'public'
    )
  );

-- Admin full access (authenticated admin role)
create policy "Admin full access event_settings" on public.event_settings
  for all to authenticated using (true) with check (true);

create policy "Admin full access dissertation_content" on public.dissertation_content
  for all to authenticated using (true) with check (true);

create policy "Admin full access announcements" on public.announcements
  for all to authenticated using (true) with check (true);

create policy "Admin full access rsvp_submissions" on public.rsvp_submissions
  for all to authenticated using (true) with check (true);

create policy "Admin full access testimonials" on public.testimonials
  for all to authenticated using (true) with check (true);

create policy "Admin full access photos" on public.photos
  for all to authenticated using (true) with check (true);

-- =============================================================================
-- STORAGE BUCKETS (Private by default)
-- =============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('pending-uploads', 'pending-uploads', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('private-gallery', 'private-gallery', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
