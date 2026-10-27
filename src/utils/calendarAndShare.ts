import { EventSettings, Locale } from '../types';

/**
 * Generates and triggers download of an RFC 5545 compliant .ics calendar file
 * for the dissertation defense when eventDate is confirmed.
 */
export function downloadDefenseIcs(settings: EventSettings, locale: Locale): boolean {
  if (!settings.eventDate) return false;

  const [year, month, day] = settings.eventDate.split('-').map(Number);
  if (!year || !month || !day) return false;

  const [startH, startM] = (settings.startTime || '12:30').split(':').map(Number);
  const [endH, endM] = (settings.endTime || '15:40').split(':').map(Number);

  const pad = (n: number) => String(n).padStart(2, '0');
  const dtStartLocal = `${year}${pad(month)}${pad(day)}T${pad(startH)}${pad(startM)}00`;
  const dtEndLocal = `${year}${pad(month)}${pad(day)}T${pad(endH)}${pad(endM)}00`;
  const nowUtc = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const summary =
    locale === 'fr'
      ? `Soutenance de mémoire — ${settings.honoreeName} (${settings.fieldOfStudy})`
      : `Dissertation Defense — ${settings.honoreeName} (Business Law)`;

  const locationParts = [
    settings.institutionOfficialName || settings.institutionName,
    settings.sameSpaceConfirmed
      ? `${settings.amphitheatre} / ${settings.room} (même espace)`
      : `${settings.amphitheatre} · ${settings.room}`,
    settings.address,
  ].filter(Boolean);

  const descriptionLines = [
    locale === 'fr'
      ? `Soutenance de mémoire de ${settings.degreeLabel} en ${settings.fieldOfStudy} de ${settings.honoreeName}.`
      : `Undergraduate dissertation defense in Business Law by ${settings.honoreeName}.`,
    settings.dissertationTitle
      ? `${locale === 'fr' ? 'Thème' : 'Topic'} : ${
          locale === 'fr' ? settings.dissertationTitle : settings.dissertationTitleEn || settings.dissertationTitle
        }`
      : '',
    `${locale === 'fr' ? 'Créneau annoncé' : 'Time slot'} : ${settings.startTime} – ${settings.endTime} (${settings.timeZone})`,
  ].filter(Boolean);

  const escapeIcs = (str: string) =>
    str
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');

  const tzid = settings.timeZone || 'Africa/Douala';

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Roseline Nga Maniack//Soutenance Memoire//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    `TZID:${tzid}`,
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0100',
    'TZNAME:WAT',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:soutenance-rnm-${year}${pad(month)}${pad(day)}@roseline-nga-maniack.cm`,
    `DTSTAMP:${nowUtc}`,
    `DTSTART;TZID=${tzid}:${dtStartLocal}`,
    `DTEND;TZID=${tzid}:${dtEndLocal}`,
    `SUMMARY:${escapeIcs(summary)}`,
    `LOCATION:${escapeIcs(locationParts.join(', '))}`,
    `DESCRIPTION:${escapeIcs(descriptionLines.join('\n\n'))}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const icsContent = icsLines.join('\r\n');
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Soutenance_Roseline_Nga_Maniack_${settings.eventDate}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return true;
}

/**
 * Normalizes a Cameroon or international phone number for WhatsApp API.
 */
export function normalizeWhatsAppNumber(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return '';
  // If 9 digits starting with 6 or 2 (Cameroon local format like 692738430), prepend 237
  if (digits.length === 9 && (digits.startsWith('6') || digits.startsWith('2'))) {
    return `237${digits}`;
  }
  if (digits.startsWith('00')) {
    return digits.slice(2);
  }
  return digits;
}

export function buildWhatsAppRsvpText(
  params: {
    firstName: string;
    lastName?: string;
    attendance: 'present' | 'absent' | 'maybe';
    guestsCount: number;
    message?: string;
  },
  settings: EventSettings,
  locale: Locale
): string {
  const fullName = [params.firstName.trim(), params.lastName?.trim()].filter(Boolean).join(' ');
  const statusMapFr = {
    present: 'Je confirme ma présence',
    absent: 'Je ne pourrai pas être présent(e), mais je transmets tous mes encouragements',
    maybe: 'Ma présence reste à confirmer',
  };
  const statusMapEn = {
    present: 'I confirm my attendance',
    absent: 'I will not be able to attend, but I send my warmest wishes',
    maybe: 'My attendance is to be confirmed',
  };

  if (locale === 'fr') {
    const lines = [
      `Bonjour,`,
      `Concernant la soutenance de mémoire de ${settings.honoreeName} (23 décembre 2026 · ${settings.startTime}–${settings.endTime} · ${settings.amphitheatre} / ${settings.room}, INSECK Ngoa-Ekellé) :`,
      `• Nom : ${fullName}`,
      `• Réponse : ${statusMapFr[params.attendance]}`,
    ];
    if (params.attendance === 'present' && params.guestsCount > 0) {
      lines.push(`• Accompagnants : ${params.guestsCount}`);
    }
    if (params.message?.trim()) {
      lines.push(`• Message : ${params.message.trim()}`);
    }
    return lines.join('\n');
  } else {
    const lines = [
      `Hello,`,
      `Regarding the dissertation defense of ${settings.honoreeName} (December 23, 2026 · ${settings.startTime}–${settings.endTime} · ${settings.amphitheatre} / ${settings.room}, INSECK Ngoa-Ekellé):`,
      `• Name: ${fullName}`,
      `• Response: ${statusMapEn[params.attendance]}`,
    ];
    if (params.attendance === 'present' && params.guestsCount > 0) {
      lines.push(`• Accompanying guests: ${params.guestsCount}`);
    }
    if (params.message?.trim()) {
      lines.push(`• Note: ${params.message.trim()}`);
    }
    return lines.join('\n');
  }
}

export function buildWhatsAppUrl(phoneRaw: string, text: string): string {
  const normalized = normalizeWhatsAppNumber(phoneRaw);
  if (!normalized) return '';
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

/**
 * Inspects file magic bytes, strips EXIF/GPS metadata via canvas re-encoding,
 * constrains dimensions, and produces a main image + thumbnail.
 */
export async function processImageCleanExif(file: File): Promise<{
  imageDataUrl: string;
  thumbnailDataUrl: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  width: number;
  height: number;
  fileSize: number;
}> {
  const nameLower = file.name.toLowerCase();
  if (nameLower.endsWith('.heic') || nameLower.endsWith('.heif') || file.type === 'image/heic' || file.type === 'image/heif') {
    throw new Error('HEIC_NOT_SUPPORTED');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('FILE_TOO_LARGE');
  }

  // Verify real magic bytes
  const buffer = await file.slice(0, 16).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47;
  const isWebp =
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;

  if (!isJpeg && !isPng && !isWebp) {
    throw new Error('INVALID_IMAGE_FORMAT');
  }

  const outputMime: 'image/jpeg' | 'image/png' | 'image/webp' = isPng
    ? 'image/png'
    : isWebp
    ? 'image/webp'
    : 'image/jpeg';

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        URL.revokeObjectURL(objectUrl);
        const maxFull = 1920;
        const maxThumb = 560;

        let fullW = img.naturalWidth || img.width;
        let fullH = img.naturalHeight || img.height;
        if (fullW > maxFull || fullH > maxFull) {
          const ratio = Math.min(maxFull / fullW, maxFull / fullH);
          fullW = Math.round(fullW * ratio);
          fullH = Math.round(fullH * ratio);
        }

        // Drawing onto a fresh canvas strips all EXIF & GPS metadata
        const fullCanvas = document.createElement('canvas');
        fullCanvas.width = fullW;
        fullCanvas.height = fullH;
        const fullCtx = fullCanvas.getContext('2d');
        if (!fullCtx) throw new Error('CANVAS_ERROR');
        fullCtx.drawImage(img, 0, 0, fullW, fullH);
        const imageDataUrl = fullCanvas.toDataURL(outputMime, 0.88);

        let thumbW = fullW;
        let thumbH = fullH;
        if (thumbW > maxThumb || thumbH > maxThumb) {
          const ratio = Math.min(maxThumb / thumbW, maxThumb / thumbH);
          thumbW = Math.round(thumbW * ratio);
          thumbH = Math.round(thumbH * ratio);
        }
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = thumbW;
        thumbCanvas.height = thumbH;
        const thumbCtx = thumbCanvas.getContext('2d');
        if (!thumbCtx) throw new Error('CANVAS_ERROR');
        thumbCtx.drawImage(img, 0, 0, thumbW, thumbH);
        const thumbnailDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.82);

        const approxBytes = Math.round((imageDataUrl.length * 3) / 4);
        resolve({
          imageDataUrl,
          thumbnailDataUrl,
          mimeType: outputMime,
          width: fullW,
          height: fullH,
          fileSize: approxBytes,
        });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('IMAGE_LOAD_ERROR'));
    };
    img.src = objectUrl;
  });
}

/**
 * Generates and downloads a commemorative keepsake card PNG (explicitly marked as non-official).
 */
export async function downloadSouvenirCardPng(settings: EventSettings, locale: Locale, formattedDate: string): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background Ivory #FCFAF6
  ctx.fillStyle = '#FCFAF6';
  ctx.fillRect(0, 0, 1080, 1350);

  // Midnight Blue Header Band #14243B
  ctx.fillStyle = '#14243B';
  ctx.fillRect(48, 48, 984, 1254);

  // Inner Ivory Frame
  ctx.fillStyle = '#FCFAF6';
  ctx.fillRect(72, 72, 936, 1206);

  // Champagne hairline border #D9BE8A
  ctx.strokeStyle = '#D9BE8A';
  ctx.lineWidth = 2;
  ctx.strokeRect(92, 92, 896, 1166);

  // Monogram RNM at top
  ctx.fillStyle = '#8A642C';
  ctx.font = '600 28px "Cormorant Garamond", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('R · N · M', 540, 155);

  // Kicker
  ctx.fillStyle = '#647080';
  ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    locale === 'fr'
      ? 'SOUTENANCE DE MÉMOIRE DE LICENCE · DROIT DES AFFAIRES'
      : 'UNDERGRADUATE DISSERTATION DEFENSE · BUSINESS LAW',
    540,
    205
  );

  // Load portrait if available
  if (settings.portraitUrl) {
    try {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const targetW = 340;
          const targetH = 380;
          const x = 540 - targetW / 2;
          const y = 240;
          ctx.save();
          ctx.strokeStyle = '#D9BE8A';
          ctx.lineWidth = 3;
          ctx.strokeRect(x - 6, y - 6, targetW + 12, targetH + 12);

          // Center crop portrait
          const scale = Math.max(targetW / img.width, targetH / img.height);
          const sw = targetW / scale;
          const sh = targetH / scale;
          const sx = (img.width - sw) / 2;
          const sy = (img.height - sh) / 4;
          ctx.drawImage(img, sx, Math.max(0, sy), sw, sh, x, y, targetW, targetH);
          ctx.restore();
          resolve();
        };
        img.onerror = () => resolve();
        img.src = settings.portraitUrl;
      });
    } catch {
      // ignore image error
    }
  }

  // Candidate Name
  ctx.fillStyle = '#14243B';
  ctx.font = '700 54px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(settings.honoreeName, 540, 690);

  // Champagne divider
  ctx.strokeStyle = '#D9BE8A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(420, 720);
  ctx.lineTo(660, 720);
  ctx.stroke();

  // Dissertation Title wrapped
  const titleText =
    locale === 'fr'
      ? settings.dissertationTitle
      : settings.dissertationTitleEn || settings.dissertationTitle;

  ctx.fillStyle = '#1D2633';
  ctx.font = 'italic 600 28px "Cormorant Garamond", Georgia, serif';
  const words = titleText.split(' ');
  let line = '';
  let yPos = 775;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > 760) {
      ctx.fillText(line, 540, yPos);
      line = w;
      yPos += 38;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, 540, yPos);
    yPos += 55;
  }

  // Event Details Box
  ctx.fillStyle = '#EDF3F9';
  ctx.fillRect(150, 920, 780, 195);

  ctx.fillStyle = '#14243B';
  ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`${formattedDate}  ·  ${settings.startTime} – ${settings.endTime}`, 540, 972);

  ctx.fillStyle = '#1D2633';
  ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(settings.institutionOfficialName || settings.institutionName, 540, 1020);

  ctx.fillStyle = '#8A642C';
  ctx.font = '600 19px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    settings.sameSpaceConfirmed
      ? `${settings.amphitheatre} · ${settings.room} (même espace)`
      : `${settings.amphitheatre} · ${settings.room}`,
    540,
    1068
  );

  // Non-official disclaimer
  ctx.fillStyle = '#647080';
  ctx.font = '400 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    locale === 'fr'
      ? 'Souvenir commémoratif de soutenance — Ce visuel ne constitue pas un diplôme officiel.'
      : 'Commemorative defense keepsake — Not an official university diploma.',
    540,
    1215
  );

  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `Carte_Souvenir_${settings.honoreeName.replace(/\s+/g, '_')}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
