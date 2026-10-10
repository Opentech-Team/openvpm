import * as React from "react";
import { render } from "@react-email/render";
import { WelcomeEmail, type WelcomeEmailProps } from "./templates/WelcomeEmail";
import {
  TrialEndingEmail,
  type TrialEndingEmailProps,
} from "./templates/TrialEndingEmail";
import {
  SetupRecoveryEmail,
  type SetupRecoveryEmailProps,
} from "./templates/SetupRecoveryEmail";
import {
  PaymentReceiptEmail,
  type PaymentReceiptEmailProps,
} from "./templates/PaymentReceiptEmail";
import {
  PaymentFailedEmail,
  type PaymentFailedEmailProps,
} from "./templates/PaymentFailedEmail";
import {
  FirstClinicWinEmail,
  type FirstClinicWinEmailProps,
} from "./templates/FirstClinicWinEmail";
import { identity } from "./i18n";

export interface RenderedEmail {
  subject: string;
  html: string;
}

export async function renderWelcomeEmail(
  p: WelcomeEmailProps,
): Promise<RenderedEmail> {
  const t = p.t ?? identity;
  return {
    subject: t("Welcome to OpenVPM, {practiceName}", {
      practiceName: p.practiceName,
    }),
    html: await render(<WelcomeEmail {...p} />),
  };
}

export async function renderTrialEndingEmail(
  p: TrialEndingEmailProps,
): Promise<RenderedEmail> {
  const t = p.t ?? identity;
  return {
    subject:
      p.daysLeft <= 1
        ? t("Your OpenVPM trial ends tomorrow")
        : t("Your OpenVPM trial ends in {daysLeft} days", {
            daysLeft: p.daysLeft,
          }),
    html: await render(<TrialEndingEmail {...p} />),
  };
}

export async function renderSetupRecoveryEmail(
  p: SetupRecoveryEmailProps,
): Promise<RenderedEmail> {
  const t = p.t ?? identity;
  return {
    subject:
      p.attemptNumber === 1
        ? t("Resume setup for {practiceName}", {
            practiceName: p.practiceName,
          })
        : t("Can we help with {stepTitle}?", { stepTitle: p.stepTitle }),
    html: await render(<SetupRecoveryEmail {...p} />),
  };
}

export async function renderPaymentReceiptEmail(
  p: PaymentReceiptEmailProps,
): Promise<RenderedEmail> {
  const t = p.t ?? identity;
  return {
    subject: t("Your OpenVPM receipt — {amount}", { amount: p.amount }),
    html: await render(<PaymentReceiptEmail {...p} />),
  };
}

export async function renderPaymentFailedEmail(
  p: PaymentFailedEmailProps,
): Promise<RenderedEmail> {
  const t = p.t ?? identity;
  return {
    subject: t("Action needed: your OpenVPM payment didn't go through"),
    html: await render(<PaymentFailedEmail {...p} />),
  };
}

export async function renderFirstClinicWinEmail(
  p: FirstClinicWinEmailProps,
): Promise<RenderedEmail> {
  const t = p.t ?? identity;
  return {
    subject: t("Your first real OpenVPM visit is complete"),
    html: await render(<FirstClinicWinEmail {...p} />),
  };
}
