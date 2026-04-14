/**
 * Registration emails via Mailtrap Email Sandbox.
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export function getAppBaseUrl(): string {
  const raw =
    process.env.APP_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL?.trim()
      ? `https://${process.env.VERCEL_URL.trim()}`
      : '');
  if (raw) {
    return raw.replace(/\/+$/, '');
  }
  return 'http://localhost:3000';
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function mailtrapSandboxInboxId(): string | undefined {
  return process.env.MAILTRAP_SANDBOX_INBOX_ID?.trim() || undefined;
}

/** Mailtrap sandbox rejects bursts; space sequential sends on registration submit. */
const MAILTRAP_REGISTRATION_SEND_GAP_MS = 11_000;

async function paceBeforeNextMailtrapSendIfConfigured(): Promise<void> {
  if (!mailtrapSandboxInboxId()) return;

  await new Promise<void>((resolve) => {
    setTimeout(resolve, MAILTRAP_REGISTRATION_SEND_GAP_MS);
  });
}

/** Mailtrap uses header `Api-Token`. */
function mailtrapApiToken(): string | undefined {
  return process.env.MAILTRAP_API_TOKEN?.trim() || undefined;
}

/** Parse `Name <email@domain>` or plain `email@domain` for Mailtrap JSON `from`. */
function parseFromAddress(from: string): { email: string; name?: string } {
  const trimmed = from.trim();
  const m = trimmed.match(/^(.+?)\s*<([^>]+)>$/);
  if (m) {
    const name = m[1].replace(/^"|"$/g, '').trim();
    const email = m[2].trim();
    if (name) return { email, name };
    return { email };
  }
  return { email: trimmed };
}

async function sendViaMailtrapSandbox(
  inboxId: string,
  apiToken: string,
  options: EmailOptions
): Promise<void> {
  const fromRaw = process.env.EMAIL_FROM?.trim();
  if (!fromRaw) {
    throw new Error('EMAIL_FROM is required when using Mailtrap sandbox');
  }

  const url = `https://sandbox.api.mailtrap.io/api/send/${encodeURIComponent(inboxId)}`;
  const payload: Record<string, unknown> = {
    from: parseFromAddress(fromRaw),
    to: [{ email: options.to.trim() }],
    subject: options.subject,
    html: options.html,
  };
  if (options.text) {
    payload.text = options.text;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Token': apiToken,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Mailtrap sandbox error ${res.status}: ${errBody}`);
  }
}

/**
 * Deliver one email via Mailtrap sandbox.
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const inboxId = mailtrapSandboxInboxId();
  if (!inboxId) {
    throw new Error(
      'MAILTRAP_SANDBOX_INBOX_ID is required to send emails. Configure Mailtrap Email Sandbox in environment variables.'
    );
  }

  const token = mailtrapApiToken();
  if (!token) {
    throw new Error(
      'MAILTRAP_API_TOKEN is required when MAILTRAP_SANDBOX_INBOX_ID is set.'
    );
  }

  await sendViaMailtrapSandbox(inboxId, token, options);
}

export interface RegistrationDogDetail {
  name: string;
  breed: string;
  age: number | null;
  sex: string | null;
  isRescue: boolean;
  activityFunShow: boolean;
  activitySplashPool: boolean;
  activityAgility: boolean;
  classes: { name: string; fee: number }[];
  otherActivities: string[];
}

interface RegistrationEmailData {
  ownerName: string;
  ownerEmail: string;
  retrievalToken: string | null;
  dogs: {
    name: string;
    breed: string;
    classes: { name: string; fee: number | string }[];
    otherActivities: string[];
  }[];
  totalFee: number | string;
}

function toCurrencyNumber(value: number | string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number | string): string {
  return toCurrencyNumber(value).toFixed(2);
}

function dogEmailSectionText(
  dog: RegistrationEmailData['dogs'][number]
): string {
  const lines: string[] = [`    🐕 ${dog.name} (${dog.breed})`];
  if (dog.classes.length > 0) {
    lines.push(
      ...dog.classes.map((c) => `      - ${c.name} (£${formatCurrency(c.fee)})`)
    );
  }
  if (dog.otherActivities.length > 0) {
    lines.push(...dog.otherActivities.map((a) => `      - ${a}`));
  }
  if (dog.classes.length === 0 && dog.otherActivities.length === 0) {
    lines.push('      - (see your online registration for details)');
  }
  return lines.join('\n');
}

const REGISTRANT_SUBJECT =
  "Essex Therapy Dog's volunteer day dog registration";

export async function sendRegistrationConfirmation(
  data: RegistrationEmailData
): Promise<void> {
  const baseUrl = getAppBaseUrl();
  const retrievalPath = data.retrievalToken
    ? `${baseUrl}/register/retrieve?token=${encodeURIComponent(data.retrievalToken)}`
    : '';

  const dogsList = data.dogs.map(dogEmailSectionText).join('\n\n');

  const ownerSafe = escapeHtml(data.ownerName);
  const emailSafe = escapeHtml(data.ownerEmail);

  const htmlDogs = data.dogs
    .map((dog) => {
      const nameSafe = escapeHtml(dog.name);
      const breedSafe = escapeHtml(dog.breed);
      const classesBlock =
        dog.classes.length > 0
          ? `<p style="margin: 0 0 6px 0; font-size: 13px; color: #4b5563;">Show classes</p>
      <ul style="margin: 0 0 10px 0; padding-left: 20px;">
        ${dog.classes
          .map(
            (c) =>
              `<li>${escapeHtml(c.name)} - £${formatCurrency(c.fee)}</li>`
          )
          .join('')}
      </ul>`
          : '';
      const activitiesBlock =
        dog.otherActivities.length > 0
          ? `<p style="margin: 0 0 6px 0; font-size: 13px; color: #4b5563;">Other activities</p>
      <ul style="margin: 0; padding-left: 20px;">
        ${dog.otherActivities.map((a) => `<li>${escapeHtml(a)}</li>`).join('')}
      </ul>`
          : '';
      const emptyNote =
        dog.classes.length === 0 && dog.otherActivities.length === 0
          ? '<p style="margin:0; color:#6b7280; font-size: 14px;">See your online registration for full details.</p>'
          : '';
      return `
    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 10px 0;">
      <h3 style="margin: 0 0 10px 0;">🐕 ${nameSafe} (${breedSafe})</h3>
      ${classesBlock}
      ${activitiesBlock}
      ${emptyNote}
    </div>`;
    })
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Registration confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #2563eb;">Registration confirmed</h1>

  <p>Dear ${ownerSafe},</p>

  <p>Thank you for registering for the <strong>Essex Therapy Dogs volunteer day</strong>.</p>

  <h2>Your registration details</h2>

  ${htmlDogs}

  <p style="font-size: 18px; font-weight: bold;">
    Total to pay on the day: £${formatCurrency(data.totalFee)}
  </p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">

  <h3>Retrieve your registration</h3>
  ${
    data.retrievalToken
      ? `<p>You can view or update your registration using this link:</p>
  <p><a href="${escapeHtml(retrievalPath)}" style="color: #2563eb;">View my registration</a></p>
  `
      : ''
  }
  <p>Or enter the email address you used (${emailSafe}) on our website.</p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">

  <p style="color: #6b7280; font-size: 12px;">
    This is an automated email from Essex Therapy Dogs (volunteer day dog registration).
    Please do not reply to this email.
  </p>
</body>
</html>
  `;

  const text = `
Registration confirmed

Dear ${data.ownerName},

Thank you for registering for the Essex Therapy Dogs volunteer day.

Your registration details:
${dogsList}

Total to pay on the day: £${formatCurrency(data.totalFee)}

---

Retrieve your registration:
${
  data.retrievalToken
    ? `Open this link in your browser:
${retrievalPath}

`
    : ''
}Or enter the email address you used (${data.ownerEmail}) on our website.
  `;

  await sendEmail({
    to: data.ownerEmail,
    subject: REGISTRANT_SUBJECT,
    html,
    text,
  });
}

export interface AdminRegistrationEmailData {
  ownerName: string;
  ownerEmail: string;
  waiverJustAccepted: boolean;
  dogs: RegistrationDogDetail[];
  totalFee: number;
  retrievalToken: string | null;
}

const ADMIN_SUBJECT = 'New volunteer day dog registration';

export async function sendAdminRegistrationNotification(
  data: AdminRegistrationEmailData
): Promise<void> {
  const adminTo = process.env.ADMIN_REGISTRATION_EMAIL?.trim();
  if (!adminTo) {
    console.warn(
      '[email] ADMIN_REGISTRATION_EMAIL is not set; skipping admin notification'
    );
    return;
  }

  await paceBeforeNextMailtrapSendIfConfigured();

  const baseUrl = getAppBaseUrl();
  const adminLoginUrl = `${baseUrl}/admin/login`;
  const retrievalPath = data.retrievalToken
    ? `${baseUrl}/register/retrieve?token=${encodeURIComponent(data.retrievalToken)}`
    : '';

  const ownerRows = `
    <tr><td style="padding:8px;border:1px solid #ccc;"><strong>Name</strong></td><td style="padding:8px;border:1px solid #ccc;">${escapeHtml(data.ownerName)}</td></tr>
    <tr><td style="padding:8px;border:1px solid #ccc;"><strong>Email</strong></td><td style="padding:8px;border:1px solid #ccc;">${escapeHtml(data.ownerEmail)}</td></tr>
    <tr><td style="padding:8px;border:1px solid #ccc;"><strong>Activity waiver</strong></td><td style="padding:8px;border:1px solid #ccc;">${data.waiverJustAccepted ? 'Accepted this session (splash pool and/or agility)' : 'Not required or already on file'}</td></tr>
    ${retrievalPath ? `<tr><td style="padding:8px;border:1px solid #ccc;"><strong>Retrieval link</strong></td><td style="padding:8px;border:1px solid #ccc;"><a href="${escapeHtml(retrievalPath)}">${escapeHtml(retrievalPath)}</a></td></tr>` : ''}
  `;

  const dogSections = data.dogs
    .map((dog, i) => {
      const actFun = dog.activityFunShow ? 'Yes' : 'No';
      const actSplash = dog.activitySplashPool ? 'Yes' : 'No';
      const actAgility = dog.activityAgility ? 'Yes' : 'No';
      const classesRows =
        dog.classes.length > 0
          ? dog.classes
              .map(
                (c) =>
                  `<tr><td style="padding:6px;border:1px solid #ddd;">${escapeHtml(c.name)}</td><td style="padding:6px;border:1px solid #ddd;">£${formatCurrency(c.fee)}</td></tr>`
              )
              .join('')
          : `<tr><td colspan="2" style="padding:6px;border:1px solid #ddd;color:#666;">No show classes</td></tr>`;
      const other =
        dog.otherActivities.length > 0
          ? escapeHtml(dog.otherActivities.join(', '))
          : '—';

      return `
    <h3 style="margin-top:24px;">Dog ${i + 1}: ${escapeHtml(dog.name)}</h3>
    <table style="border-collapse:collapse;width:100%;max-width:640px;margin-bottom:8px;">
      <tr><td style="padding:8px;border:1px solid #ccc;"><strong>Breed</strong></td><td style="padding:8px;border:1px solid #ccc;">${escapeHtml(dog.breed)}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ccc;"><strong>Age</strong></td><td style="padding:8px;border:1px solid #ccc;">${dog.age !== null && dog.age !== undefined ? escapeHtml(String(dog.age)) : '—'}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ccc;"><strong>Sex</strong></td><td style="padding:8px;border:1px solid #ccc;">${dog.sex ? escapeHtml(dog.sex) : '—'}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ccc;"><strong>Rescue</strong></td><td style="padding:8px;border:1px solid #ccc;">${dog.isRescue ? 'Yes' : 'No'}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ccc;"><strong>Fun dog show</strong></td><td style="padding:8px;border:1px solid #ccc;">${actFun}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ccc;"><strong>Splash pool</strong></td><td style="padding:8px;border:1px solid #ccc;">${actSplash}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ccc;"><strong>Agility</strong></td><td style="padding:8px;border:1px solid #ccc;">${actAgility}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ccc;"><strong>Other activities</strong></td><td style="padding:8px;border:1px solid #ccc;">${other}</td></tr>
    </table>
    <p style="margin:8px 0 4px 0;"><strong>Classes</strong></p>
    <table style="border-collapse:collapse;width:100%;max-width:640px;">
      <tr style="background:#f3f4f6;"><th style="padding:8px;border:1px solid #ccc;text-align:left;">Class</th><th style="padding:8px;border:1px solid #ccc;text-align:left;">Fee</th></tr>
      ${classesRows}
    </table>`;
    })
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${ADMIN_SUBJECT}</title></head>
<body style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 20px;">
  <h1 style="font-size:18px;">${ADMIN_SUBJECT}</h1>
  <p>A new volunteer day dog registration has been submitted.</p>
  <h2 style="font-size:16px;margin-top:20px;">Admin portal</h2>
  <p><a href="${escapeHtml(adminLoginUrl)}">Log in to the admin portal</a></p>
  <h2 style="font-size:16px;margin-top:20px;">Owner</h2>
  <table style="border-collapse:collapse;width:100%;max-width:640px;">${ownerRows}</table>
  <h2 style="font-size:16px;margin-top:20px;">Dogs and entries</h2>
  ${dogSections}
  <p style="margin-top:24px;font-size:16px;"><strong>Total fees (show classes): £${formatCurrency(data.totalFee)}</strong></p>
</body>
</html>
  `;

  const textLines: string[] = [
    ADMIN_SUBJECT,
    '',
    `Owner: ${data.ownerName} <${data.ownerEmail}>`,
    `Activity waiver: ${data.waiverJustAccepted ? 'Accepted this session' : 'Not required or already on file'}`,
  ];
  if (retrievalPath) {
    textLines.push(`Retrieval: ${retrievalPath}`);
  }
  textLines.push(`Admin portal (login): ${adminLoginUrl}`);
  textLines.push('');
  data.dogs.forEach((dog, i) => {
    textLines.push(`Dog ${i + 1}: ${dog.name}`);
    textLines.push(`  Breed: ${dog.breed}  Age: ${dog.age ?? '—'}  Sex: ${dog.sex ?? '—'}  Rescue: ${dog.isRescue ? 'Yes' : 'No'}`);
    textLines.push(
      `  Activities: fun show ${dog.activityFunShow ? 'Yes' : 'No'}, splash ${dog.activitySplashPool ? 'Yes' : 'No'}, agility ${dog.activityAgility ? 'Yes' : 'No'}`
    );
    dog.classes.forEach((c) => {
      textLines.push(`  Class: ${c.name}  £${formatCurrency(c.fee)}`);
    });
    if (dog.otherActivities.length) {
      textLines.push(`  Other: ${dog.otherActivities.join(', ')}`);
    }
    textLines.push('');
  });
  textLines.push(`Total fees: £${formatCurrency(data.totalFee)}`);

  await sendEmail({
    to: adminTo,
    subject: ADMIN_SUBJECT,
    html,
    text: textLines.join('\n'),
  });
}
