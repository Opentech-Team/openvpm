import { Resend } from "resend";
import {
  openvpmBrand,
  renderWelcomeEmail,
  renderSetupRecoveryEmail,
  renderTrialEndingEmail,
  renderPaymentReceiptEmail,
  renderPaymentFailedEmail,
  renderFirstClinicWinEmail,
} from "@openpims/email";
import {
  createEmailPreferenceLinks,
  emailPreferenceRecipientHash,
} from "@/lib/email-preferences";
import { billingEnforced } from "@/lib/billing/plans";
import { htmlLang, tx } from "@/lib/i18n";
import {
  defaultEmailFrom,
  emailDemoMode,
  emailEnv,
  nonBlankEmailValue,
} from "@/lib/email-env";

// ---------------------------------------------------------------------------
// Resend client – initialised lazily so the module can be imported even when
// RESEND_API_KEY is not set (local dev / CI).
// ---------------------------------------------------------------------------
let resend: Resend | null = null;

function getResend(): Resend | null {
  if (resend) return resend;
  const apiKey = emailEnv("RESEND_API_KEY");
  if (!apiKey) return null;
  resend = new Resend(apiKey);
  return resend;
}

export const EMAIL_SEND_TIMEOUT_MS = 10_000;

type ResendEmailSendOptions = NonNullable<
  Parameters<Resend["emails"]["send"]>[1]
> & {
  signal?: AbortSignal;
};

export type EmailProviderOutcome =
  | "accepted"
  | "definite_failure"
  | "outcome_unknown";
export type EmailProvider = "resend" | "console";

export interface EmailProviderEvidence {
  success: boolean;
  provider: EmailProvider;
  id?: string;
  error?: string;
  outcome: EmailProviderOutcome;
  failureCode?:
    | "provider_not_configured"
    | "provider_rejected"
    | "send_timeout"
    | "provider_exception"
    | "missing_provider_id";
}

function emailSendTimeoutMessage(): string {
  return `Email send timed out after ${EMAIL_SEND_TIMEOUT_MS}ms`;
}

// ---------------------------------------------------------------------------
// Shared layout helpers
// ---------------------------------------------------------------------------

function emailLayout(
  practiceName: string,
  body: string,
  footer?: string,
): string {
  return `<!DOCTYPE html>
<html lang="${htmlLang()}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${practiceName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#0d9488;padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:600;letter-spacing:-0.01em;">${practiceName}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
              ${footer || `<p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">${tx("This email was sent by {practiceName}. If you received this in error, please disregard it.", { practiceName })}</p>`}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function practiceFooter(opts: {
  practiceName: string;
  practicePhone?: string;
  practiceAddress?: string;
}): string {
  const lines: string[] = [];
  lines.push(opts.practiceName);
  if (opts.practicePhone) lines.push(opts.practicePhone);
  if (opts.practiceAddress) lines.push(opts.practiceAddress);
  return `<p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">${lines.join("<br/>")}</p>`;
}

/** Bold a dynamic value inside a translated sentence. */
function strong(value: string): string {
  return `<strong>${value}</strong>`;
}

function ctaButton(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background-color:#0d9488;border-radius:6px;">
      <a href="${url}" target="_blank" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">${label}</a>
    </td>
  </tr>
</table>`;
}

// ---------------------------------------------------------------------------
// Core send function
// ---------------------------------------------------------------------------

interface EmailDispatchOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  tags?: Array<{ name: string; value: string }>;
  idempotencyKey?: string;
  redactRecipientInLogs?: boolean;
}

async function dispatchEmail(
  options: EmailDispatchOptions,
): Promise<EmailProviderEvidence> {
  const demoMode = emailDemoMode();
  // Demo/QA environments must remain non-delivering even when Preview inherits
  // a real provider key from the hosted project configuration.
  const client = demoMode ? null : getResend();
  const provider: EmailProvider =
    client || (billingEnforced() && !demoMode) ? "resend" : "console";
  const from = defaultEmailFrom(options.from);
  const replyTo = nonBlankEmailValue(options.replyTo);

  if (!client) {
    if (billingEnforced() && !demoMode) {
      return {
        success: false,
        provider,
        error: "Email provider is not configured for hosted sending.",
        outcome: "definite_failure",
        failureCode: "provider_not_configured",
      };
    }

    // Development fallback – log to console instead of sending
    console.log("──────────────────────────────────────────");
    console.log(
      "[Email] No RESEND_API_KEY configured – logging email to console",
    );
    console.log(
      `  To:      ${options.redactRecipientInLogs ? "[redacted auth recipient]" : options.to}`,
    );
    console.log(`  From:    ${from}`);
    console.log(`  Subject: ${options.subject}`);
    console.log("  HTML:    (omitted – check server logs for full content)");
    console.log("──────────────────────────────────────────");
    return {
      success: true,
      provider,
      id: options.idempotencyKey
        ? `dev-console:${options.idempotencyKey}`.slice(0, 128)
        : "dev-console",
      outcome: "accepted",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EMAIL_SEND_TIMEOUT_MS);

  try {
    const sendOptions: ResendEmailSendOptions = {
      signal: controller.signal,
    };
    const { data, error } = await client.emails.send(
      {
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        ...(replyTo ? { replyTo } : {}),
        ...(options.headers ? { headers: options.headers } : {}),
        ...(options.tags ? { tags: options.tags } : {}),
      },
      {
        ...sendOptions,
        ...(options.idempotencyKey
          ? { idempotencyKey: options.idempotencyKey }
          : {}),
      },
    );

    if (error) {
      console.error(
        "[Email] Resend error:",
        options.redactRecipientInLogs
          ? "auth verification provider rejection"
          : error,
      );
      const timedOut = controller.signal.aborted;
      return {
        success: false,
        provider,
        error: timedOut ? emailSendTimeoutMessage() : error.message,
        outcome: timedOut ? "outcome_unknown" : "definite_failure",
        failureCode: timedOut ? "send_timeout" : "provider_rejected",
      };
    }

    if (!data?.id) {
      return {
        success: false,
        provider,
        error: "Email provider response did not include a message id.",
        outcome: "outcome_unknown",
        failureCode: "missing_provider_id",
      };
    }

    return { success: true, provider, id: data.id, outcome: "accepted" };
  } catch (err) {
    const message = controller.signal.aborted
      ? emailSendTimeoutMessage()
      : err instanceof Error
        ? err.message
        : "Unknown email error";
    console.error(
      "[Email] Exception:",
      options.redactRecipientInLogs
        ? "auth verification provider exception"
        : message,
    );
    return {
      success: false,
      provider,
      error: message,
      outcome: "outcome_unknown",
      failureCode: controller.signal.aborted
        ? "send_timeout"
        : "provider_exception",
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Resolve the durable provider identity before reserving a tracked attempt.
 * Hosted mode without credentials still models Resend (as a definite
 * configuration failure); only the explicit local/demo fallback is console.
 */
export function verificationEmailProvider(): EmailProvider {
  if (emailDemoMode()) return "console";
  if (getResend()) return "resend";
  return billingEnforced() ? "resend" : "console";
}

export async function sendEmail(
  options: EmailDispatchOptions,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const { success, id, error } = await dispatchEmail(options);
  return {
    success,
    ...(id ? { id } : {}),
    ...(error ? { error } : {}),
  };
}

// ---------------------------------------------------------------------------
// Appointment reminder
// ---------------------------------------------------------------------------

export async function sendAppointmentReminder(data: {
  to: string;
  clientName: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  practiceName: string;
  practicePhone?: string;
  practiceAddress?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const body = `
    <p style="margin:0 0 16px;color:#111827;font-size:15px;line-height:1.6;">${tx("Hi {name},", { name: data.clientName })}</p>
    <p style="margin:0 0 24px;color:#111827;font-size:15px;line-height:1.6;">${tx("This is a friendly reminder about an upcoming appointment for {patient}.", { patient: strong(data.patientName) })}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background-color:#f0fdfa;border:1px solid #ccfbf1;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">${tx("Date")}</p>
          <p style="margin:0 0 16px;color:#0f172a;font-size:18px;font-weight:600;">${data.appointmentDate}</p>
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">${tx("Time")}</p>
          <p style="margin:0;color:#0f172a;font-size:18px;font-weight:600;">${data.appointmentTime}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;color:#111827;font-size:15px;line-height:1.6;">${data.practicePhone ? tx("If you need to cancel or reschedule, please call us at {phone} as soon as possible.", { phone: strong(data.practicePhone) }) : tx("If you need to cancel or reschedule, please call us as soon as possible.")}</p>
    <p style="margin:24px 0 0;color:#111827;font-size:15px;line-height:1.6;">${tx("We look forward to seeing you and {patient}!", { patient: data.patientName })}</p>
  `;

  const footer = practiceFooter({
    practiceName: data.practiceName,
    practicePhone: data.practicePhone,
    practiceAddress: data.practiceAddress,
  });

  const html = emailLayout(data.practiceName, body, footer);

  const result = await sendEmail({
    to: data.to,
    subject: tx("Appointment Reminder for {patientName} – {appointmentDate}", {
      patientName: data.patientName,
      appointmentDate: data.appointmentDate,
    }),
    html,
  });

  return { success: result.success, id: result.id, error: result.error };
}

// ---------------------------------------------------------------------------
// Vaccination reminder
// ---------------------------------------------------------------------------

export async function sendVaccinationReminder(data: {
  to: string;
  clientName: string;
  patientName: string;
  vaccineName: string;
  dueDate: string;
  practiceName: string;
  practicePhone?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const body = `
    <p style="margin:0 0 16px;color:#111827;font-size:15px;line-height:1.6;">${tx("Hi {name},", { name: data.clientName })}</p>
    <p style="margin:0 0 24px;color:#111827;font-size:15px;line-height:1.6;">${tx("It's time to schedule {patient}'s {vaccine} vaccination.", { patient: strong(data.patientName), vaccine: strong(data.vaccineName) })}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background-color:#fffbeb;border:1px solid #fef3c7;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">${tx("Vaccine")}</p>
          <p style="margin:0 0 16px;color:#0f172a;font-size:18px;font-weight:600;">${data.vaccineName}</p>
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">${tx("Due Date")}</p>
          <p style="margin:0;color:#0f172a;font-size:18px;font-weight:600;">${data.dueDate}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 16px;color:#111827;font-size:15px;line-height:1.6;">${data.practicePhone ? tx("Please contact us at {phone} to schedule an appointment for {patient}.", { phone: strong(data.practicePhone), patient: data.patientName }) : tx("Please contact us to schedule an appointment for {patient}.", { patient: data.patientName })}</p>
    ${ctaButton(tx("Schedule Your Pet's Appointment"), `tel:${data.practicePhone || ""}`)}
    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">${tx("Keeping vaccinations up to date is important for your pet's health and safety.")}</p>
  `;

  const footer = practiceFooter({
    practiceName: data.practiceName,
    practicePhone: data.practicePhone,
  });

  const html = emailLayout(data.practiceName, body, footer);

  const result = await sendEmail({
    to: data.to,
    subject: tx("Vaccination Reminder: {vaccineName} for {patientName}", {
      vaccineName: data.vaccineName,
      patientName: data.patientName,
    }),
    html,
  });

  return { success: result.success, id: result.id, error: result.error };
}

// ---------------------------------------------------------------------------
// Care reminder
// ---------------------------------------------------------------------------

export async function sendCareReminder(data: {
  to: string;
  clientName: string;
  patientName: string;
  reminderTitle: string;
  dueDate: string;
  practiceName: string;
  practicePhone?: string;
  practiceAddress?: string;
  idempotencyKey: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const body = `
    <p style="margin:0 0 16px;color:#111827;font-size:15px;line-height:1.6;">${tx("Hi {name},", { name: data.clientName })}</p>
    <p style="margin:0 0 24px;color:#111827;font-size:15px;line-height:1.6;">${tx("This is a reminder from our veterinary team about {patient}.", { patient: strong(data.patientName) })}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background-color:#f0fdfa;border:1px solid #ccfbf1;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">${tx("Reminder")}</p>
          <p style="margin:0 0 16px;color:#0f172a;font-size:18px;font-weight:600;">${data.reminderTitle}</p>
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">${tx("Reminder Date")}</p>
          <p style="margin:0;color:#0f172a;font-size:18px;font-weight:600;">${data.dueDate}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#111827;font-size:15px;line-height:1.6;">${data.practicePhone ? tx("Please contact us at {phone} if you have questions or would like to schedule.", { phone: strong(data.practicePhone) }) : tx("Please contact us if you have questions or would like to schedule.")}</p>
  `;

  const html = emailLayout(
    data.practiceName,
    body,
    practiceFooter({
      practiceName: data.practiceName,
      practicePhone: data.practicePhone,
      practiceAddress: data.practiceAddress,
    }),
  );
  const result = await sendEmail({
    to: data.to,
    subject: tx("Care Reminder for {patientName}", {
      patientName: data.patientName,
    }),
    html,
    idempotencyKey: data.idempotencyKey,
  });
  return { success: result.success, id: result.id, error: result.error };
}

// ---------------------------------------------------------------------------
// Invoice email
// ---------------------------------------------------------------------------

export async function sendInvoiceEmail(data: {
  to: string;
  clientName: string;
  patientName?: string;
  invoiceTotal: string;
  dueDate?: string;
  portalUrl?: string;
  practiceName: string;
  practicePhone?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const dueDateBlock = data.dueDate
    ? `<p style="margin:0 0 4px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">${tx("Due Date")}</p>
       <p style="margin:0;color:#0f172a;font-size:16px;font-weight:600;">${data.dueDate}</p>`
    : "";

  const body = `
    <p style="margin:0 0 16px;color:#111827;font-size:15px;line-height:1.6;">${tx("Hi {name},", { name: data.clientName })}</p>
    <p style="margin:0 0 24px;color:#111827;font-size:15px;line-height:1.6;">${data.patientName ? tx("Here is your invoice for {patient} from {practiceName}.", { patient: strong(data.patientName), practiceName: data.practiceName }) : tx("Here is your invoice from {practiceName}.", { practiceName: data.practiceName })}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background-color:#f0fdf4;border:1px solid #dcfce7;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">${tx("Amount Due")}</p>
          <p style="margin:0${data.dueDate ? " 0 16px" : ""};color:#0f172a;font-size:28px;font-weight:700;">${data.invoiceTotal}</p>
          ${dueDateBlock}
        </td>
      </tr>
    </table>
    ${data.portalUrl ? ctaButton(tx("View in Portal"), data.portalUrl) : ""}
    <p style="margin:0;color:#111827;font-size:15px;line-height:1.6;">${data.practicePhone ? tx("If you have any questions about this invoice, please contact us at {phone}.", { phone: strong(data.practicePhone) }) : tx("If you have any questions about this invoice, please contact us.")}</p>
  `;

  const footer = practiceFooter({
    practiceName: data.practiceName,
    practicePhone: data.practicePhone,
  });

  const html = emailLayout(data.practiceName, body, footer);

  const result = await sendEmail({
    to: data.to,
    subject: tx("Invoice from {practiceName} – {invoiceTotal}", {
      practiceName: data.practiceName,
      invoiceTotal: data.invoiceTotal,
    }),
    html,
  });

  return { success: result.success, id: result.id, error: result.error };
}

// ---------------------------------------------------------------------------
// Client payment receipt (practice-branded, sent to the pet owner)
// ---------------------------------------------------------------------------

export async function sendClientPaymentReceiptEmail(data: {
  to: string;
  clientName: string;
  patientName?: string;
  amountPaid: string;
  balanceRemaining: string;
  fullyPaid: boolean;
  practiceName: string;
  practicePhone?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const balanceBlock = data.fullyPaid
    ? `<p style="margin:0;color:#0f172a;font-size:14px;font-weight:600;">${tx("This invoice is paid in full.")}</p>`
    : `<p style="margin:0 0 4px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">${tx("Remaining Balance")}</p>
       <p style="margin:0;color:#0f172a;font-size:16px;font-weight:600;">${data.balanceRemaining}</p>`;

  const body = `
    <p style="margin:0 0 16px;color:#111827;font-size:15px;line-height:1.6;">${tx("Hi {name},", { name: data.clientName })}</p>
    <p style="margin:0 0 24px;color:#111827;font-size:15px;line-height:1.6;">${data.patientName ? tx("We got your payment for {patient}. Thank you!", { patient: strong(data.patientName) }) : tx("We got your payment. Thank you!")}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background-color:#f0fdf4;border:1px solid #dcfce7;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">${tx("Amount Paid")}</p>
          <p style="margin:0 0 16px;color:#0f172a;font-size:28px;font-weight:700;">${data.amountPaid}</p>
          ${balanceBlock}
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#111827;font-size:15px;line-height:1.6;">${data.practicePhone ? tx("Keep this email for your records. If anything looks wrong, please contact us at {phone}.", { phone: strong(data.practicePhone) }) : tx("Keep this email for your records. If anything looks wrong, please contact us.")}</p>
  `;

  const footer = practiceFooter({
    practiceName: data.practiceName,
    practicePhone: data.practicePhone,
  });

  const html = emailLayout(data.practiceName, body, footer);

  const result = await sendEmail({
    to: data.to,
    subject: tx("Payment received – {practiceName}", {
      practiceName: data.practiceName,
    }),
    html,
  });

  return { success: result.success, id: result.id, error: result.error };
}

// ---------------------------------------------------------------------------
// Account: email verification + password reset (hosted auth)
// ---------------------------------------------------------------------------

interface VerificationEmailData {
  to: string;
  name: string;
  verifyUrl: string;
}

function verificationEmailContent(data: VerificationEmailData) {
  const body = `
    <p style="margin:0 0 16px;color:#111827;font-size:15px;line-height:1.6;">${tx("Hi {name},", { name: data.name })}</p>
    <p style="margin:0 0 8px;color:#111827;font-size:15px;line-height:1.6;">${tx("Welcome to OpenVPM! Please confirm your email address to secure your workspace and keep important account messages deliverable.")}</p>
    ${ctaButton(tx("Confirm email"), data.verifyUrl)}
    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">${tx("This link expires in 24 hours. If you didn't create an OpenVPM account, you can ignore this email.")}</p>
  `;
  const html = emailLayout("OpenVPM", body);
  return { subject: tx("Verify your OpenVPM email"), html };
}

export async function sendVerificationEmail(
  data: VerificationEmailData,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const content = verificationEmailContent(data);
  return sendEmail({
    to: data.to,
    ...content,
  });
}

/** Provider-evidence variant used only by the durable auth-email dispatcher. */
export async function sendVerificationEmailWithProviderEvidence(
  data: VerificationEmailData & {
    attemptId: string;
    idempotencyKey: string;
  },
): Promise<EmailProviderEvidence> {
  const content = verificationEmailContent(data);
  return dispatchEmail({
    to: data.to,
    ...content,
    idempotencyKey: data.idempotencyKey,
    redactRecipientInLogs: true,
    tags: [
      { name: "openvpm_attempt_id", value: data.attemptId },
      { name: "openvpm_email_kind", value: "auth_verification" },
    ],
  });
}

export async function sendPasswordResetEmail(data: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<{ success: boolean }> {
  const body = `
    <p style="margin:0 0 16px;color:#111827;font-size:15px;line-height:1.6;">${tx("Hi {name},", { name: data.name })}</p>
    <p style="margin:0 0 8px;color:#111827;font-size:15px;line-height:1.6;">${tx("We received a request to reset your OpenVPM password. Click below to choose a new one.")}</p>
    ${ctaButton(tx("Reset my password"), data.resetUrl)}
    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">${tx("This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password won't change.")}</p>
  `;
  const html = emailLayout("OpenVPM", body);
  const result = await sendEmail({
    to: data.to,
    subject: tx("Reset your OpenVPM password"),
    html,
  });
  return { success: result.success };
}

export async function sendStaffInviteEmail(data: {
  to: string;
  inviterName: string;
  practiceName: string;
  inviteUrl: string;
  idempotencyKey?: string;
}): Promise<{ success: boolean }> {
  const body = `
    <p style="margin:0 0 8px;color:#111827;font-size:15px;line-height:1.6;">${tx("{inviter} has invited you to join {practiceName} on OpenVPM.", { inviter: strong(data.inviterName), practiceName: strong(data.practiceName) })}</p>
    <p style="margin:0 0 8px;color:#111827;font-size:15px;line-height:1.6;">${tx("Accept the invite below to set your password and activate your account.")}</p>
    ${ctaButton(tx("Accept invite"), data.inviteUrl)}
    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">${tx("This link expires in 72 hours. If you weren't expecting this invitation, you can safely ignore this email.")}</p>
  `;
  const html = emailLayout(data.practiceName, body);
  const result = await sendEmail({
    to: data.to,
    subject: tx("You're invited to join {practiceName} on OpenVPM", {
      practiceName: data.practiceName,
    }),
    html,
    idempotencyKey: data.idempotencyKey,
  });
  return { success: result.success };
}

// ---------------------------------------------------------------------------
// Lifecycle emails (branded via @openpims/email — React Email)
// ---------------------------------------------------------------------------

/** Welcome email sent when a practice signs up (hosted trial). */
export async function sendWelcomeEmail(data: {
  to: string;
  practiceName: string;
  trialDays?: number;
  billingRequired?: boolean;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const brand = openvpmBrand();
  const recipientHash = emailPreferenceRecipientHash(data.to);
  if (!recipientHash) {
    return {
      success: false,
      error: "Email preference signing is not configured.",
    };
  }
  const preferenceLinks = createEmailPreferenceLinks({
    kind: "recipient",
    id: recipientHash,
  });
  if (!preferenceLinks) {
    return {
      success: false,
      error: "Email preference signing is not configured.",
    };
  }
  const { subject, html } = await renderWelcomeEmail({
    brand,
    t: tx,
    practiceName: data.practiceName,
    trialDays: data.trialDays ?? 14,
    billingRequired: data.billingRequired,
    unsubscribeUrl: preferenceLinks.preferencesUrl,
  });
  return sendEmail({
    to: data.to,
    subject,
    html,
    replyTo: brand.supportEmail,
    headers: {
      "List-Unsubscribe": `<${preferenceLinks.oneClickUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
}

/** Stage-specific setup recovery. Optional platform email with a hard send cap. */
export async function sendSetupRecoveryEmail(data: {
  to: string;
  practiceName: string;
  stepTitle: string;
  nextAction: string;
  attemptNumber: 1 | 2;
  resumeUrl?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const brand = openvpmBrand();
  const recipientHash = emailPreferenceRecipientHash(data.to);
  if (!recipientHash) {
    return {
      success: false,
      error: "Email preference signing is not configured.",
    };
  }
  const preferenceLinks = createEmailPreferenceLinks({
    kind: "recipient",
    id: recipientHash,
  });
  if (!preferenceLinks) {
    return {
      success: false,
      error: "Email preference signing is not configured.",
    };
  }
  const { subject, html } = await renderSetupRecoveryEmail({
    brand,
    t: tx,
    practiceName: data.practiceName,
    stepTitle: data.stepTitle,
    nextAction: data.nextAction,
    attemptNumber: data.attemptNumber,
    resumeUrl: data.resumeUrl ?? `${brand.appUrl}/?setup=resume`,
    unsubscribeUrl: preferenceLinks.preferencesUrl,
  });
  return sendEmail({
    to: data.to,
    subject,
    html,
    replyTo: brand.supportEmail,
    headers: {
      "List-Unsubscribe": `<${preferenceLinks.oneClickUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
}

/** Trial-ending nudge (T-7 / T-3 / T-1). Promotional → carries unsubscribe. */
export async function sendTrialEndingEmail(data: {
  to: string;
  practiceName: string;
  daysLeft: number;
  trialEndDate: string;
  monthlyPrice?: string;
  billingUrl?: string;
  billingConnected?: boolean;
  idempotencyKey?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const brand = openvpmBrand();
  const billingUrl = data.billingUrl ?? `${brand.appUrl}/settings?tab=billing`;
  const recipientHash = emailPreferenceRecipientHash(data.to);
  if (!recipientHash) {
    return {
      success: false,
      error: "Email preference signing is not configured.",
    };
  }
  const preferenceLinks = createEmailPreferenceLinks({
    kind: "recipient",
    id: recipientHash,
  });
  if (!preferenceLinks) {
    return {
      success: false,
      error: "Email preference signing is not configured.",
    };
  }
  const { subject, html } = await renderTrialEndingEmail({
    brand,
    t: tx,
    practiceName: data.practiceName,
    daysLeft: data.daysLeft,
    trialEndDate: data.trialEndDate,
    monthlyPrice: data.monthlyPrice ?? "$79",
    billingUrl,
    billingConnected: data.billingConnected,
    unsubscribeUrl: preferenceLinks.preferencesUrl,
  });
  return sendEmail({
    to: data.to,
    subject,
    html,
    replyTo: brand.supportEmail,
    headers: {
      "List-Unsubscribe": `<${preferenceLinks.oneClickUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
    idempotencyKey: data.idempotencyKey,
  });
}

/** First-real-visit celebration and optional billing handoff. */
export async function sendFirstClinicWinEmail(data: {
  to: string;
  practiceName: string;
  trialEndDate: string;
  billingUrl?: string;
  idempotencyKey: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const brand = openvpmBrand();
  const billingUrl = data.billingUrl ?? `${brand.appUrl}/settings?tab=billing`;
  const recipientHash = emailPreferenceRecipientHash(data.to);
  if (!recipientHash) {
    return {
      success: false,
      error: "Email preference signing is not configured.",
    };
  }
  const preferenceLinks = createEmailPreferenceLinks({
    kind: "recipient",
    id: recipientHash,
  });
  if (!preferenceLinks) {
    return {
      success: false,
      error: "Email preference signing is not configured.",
    };
  }
  const { subject, html } = await renderFirstClinicWinEmail({
    brand,
    t: tx,
    practiceName: data.practiceName,
    trialEndDate: data.trialEndDate,
    billingUrl,
    unsubscribeUrl: preferenceLinks.preferencesUrl,
  });
  return sendEmail({
    to: data.to,
    subject,
    html,
    replyTo: brand.supportEmail,
    headers: {
      "List-Unsubscribe": `<${preferenceLinks.oneClickUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
    idempotencyKey: data.idempotencyKey,
  });
}

/** Receipt sent on a successful subscription payment. */
export async function sendPaymentReceiptEmail(data: {
  to: string;
  practiceName: string;
  amount: string;
  periodLabel: string;
  invoiceUrl?: string;
  idempotencyKey?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const brand = openvpmBrand();
  const { subject, html } = await renderPaymentReceiptEmail({
    brand,
    t: tx,
    practiceName: data.practiceName,
    amount: data.amount,
    periodLabel: data.periodLabel,
    invoiceUrl: data.invoiceUrl,
  });
  return sendEmail({
    to: data.to,
    subject,
    html,
    replyTo: brand.supportEmail,
    idempotencyKey: data.idempotencyKey,
  });
}

/** Dunning email sent on a failed subscription payment. */
export async function sendPaymentFailedEmail(data: {
  to: string;
  practiceName: string;
  amount: string;
  nextRetryDate?: string;
  billingUrl?: string;
  idempotencyKey?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const brand = openvpmBrand();
  const billingUrl = data.billingUrl ?? `${brand.appUrl}/settings?tab=billing`;
  const { subject, html } = await renderPaymentFailedEmail({
    brand,
    t: tx,
    practiceName: data.practiceName,
    amount: data.amount,
    nextRetryDate: data.nextRetryDate,
    billingUrl,
  });
  return sendEmail({
    to: data.to,
    subject,
    html,
    replyTo: brand.supportEmail,
    idempotencyKey: data.idempotencyKey,
  });
}
