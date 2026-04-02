/**
 * Email utility module
 * Currently logs emails to console - implement actual email sending later
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email (currently just logs to console)
 * In production, integrate with a service like Resend, SendGrid, or Nodemailer
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  console.log('\n========================================');
  console.log('📧 EMAIL SENT (Console Mode)');
  console.log('========================================');
  console.log(`To: ${options.to}`);
  console.log(`Subject: ${options.subject}`);
  console.log('----------------------------------------');
  console.log('HTML Content:');
  console.log(options.html);
  if (options.text) {
    console.log('----------------------------------------');
    console.log('Plain Text:');
    console.log(options.text);
  }
  console.log('========================================\n');
  
  return true;
}

interface RegistrationEmailData {
  ownerName: string;
  ownerEmail: string;
  retrievalToken: string | null;
  dogs: {
    name: string;
    breed: string;
    classes: { name: string; fee: number | string }[];
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

/**
 * Send registration confirmation email
 */
export async function sendRegistrationConfirmation(data: RegistrationEmailData): Promise<boolean> {
  const dogsList = data.dogs.map(dog => {
    const classesList = dog.classes.map(c => `      - ${c.name} (£${formatCurrency(c.fee)})`).join('\n');
    return `    🐕 ${dog.name} (${dog.breed})\n${classesList}`;
  }).join('\n\n');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Registration Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #2563eb;">Registration Confirmed! 🎉</h1>
  
  <p>Dear ${data.ownerName},</p>
  
  <p>Thank you for registering for the <strong>Essex Therapy Dogs Fun Dog Show</strong>!</p>
  
  <h2>Your Registration Details</h2>
  
  ${data.dogs.map(dog => `
    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 10px 0;">
      <h3 style="margin: 0 0 10px 0;">🐕 ${dog.name} (${dog.breed})</h3>
      <ul style="margin: 0; padding-left: 20px;">
        ${dog.classes.map(c => `<li>${c.name} - £${formatCurrency(c.fee)}</li>`).join('')}
      </ul>
    </div>
  `).join('')}
  
  <p style="font-size: 18px; font-weight: bold;">
    Total to pay on the day: £${formatCurrency(data.totalFee)}
  </p>
  
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
  
  <h3>Retrieve Your Registration</h3>
  ${
    data.retrievalToken
      ? `<p>You can view or modify your registration at any time by visiting:</p>
  <p><a href="http://localhost:3000/register/retrieve?token=${data.retrievalToken}" style="color: #2563eb;">
    View My Registration
  </a></p>
  `
      : ''
  }
  <p>Or enter your email address (${data.ownerEmail}) on our website.</p>
  
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
  
  <p style="color: #6b7280; font-size: 12px;">
    This is an automated email from Essex Therapy Dogs Fun Dog Show.
    Please do not reply to this email.
  </p>
</body>
</html>
  `;

  const text = `
Registration Confirmed!

Dear ${data.ownerName},

Thank you for registering for the Essex Therapy Dogs Fun Dog Show!

Your Registration Details:
${dogsList}

Total to pay on the day: £${formatCurrency(data.totalFee)}

---

Retrieve Your Registration:
${
    data.retrievalToken
      ? `You can view your registration at any time by visiting:
http://localhost:3000/register/retrieve?token=${data.retrievalToken}

`
      : ''
  }Or enter your email address (${data.ownerEmail}) on our website.
  `;

  return sendEmail({
    to: data.ownerEmail,
    subject: 'Registration Confirmed - Essex Therapy Dogs Fun Dog Show',
    html,
    text,
  });
}
