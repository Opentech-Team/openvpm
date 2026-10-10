import * as React from "react";
import { Section } from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout";
import { Button } from "../components/Button";
import { InfoCard } from "../components/InfoCard";
import { Heading, Label, Paragraph } from "../components/Typography";
import type { Brand } from "../brand";
import { identity, type Translate } from "../i18n";

export interface SetupRecoveryEmailProps {
  brand: Brand;
  practiceName: string;
  stepTitle: string;
  nextAction: string;
  resumeUrl: string;
  attemptNumber: 1 | 2;
  unsubscribeUrl?: string;
  t?: Translate;
}

export function SetupRecoveryEmail({
  brand,
  practiceName,
  stepTitle,
  nextAction,
  resumeUrl,
  attemptNumber,
  unsubscribeUrl,
  t = identity,
}: SetupRecoveryEmailProps) {
  return (
    <EmailLayout
      brand={brand}
      preview={t("Resume {practiceName} at {stepTitle}", {
        practiceName,
        stepTitle,
      })}
      unsubscribeUrl={unsubscribeUrl}
      recipientReason={t(
        "You're receiving this because you started an OpenVPM trial.",
      )}
      t={t}
    >
      <Heading>
        {attemptNumber === 1
          ? t("Your clinic workspace is ready")
          : t("Can we help with {stepTitle}?", { stepTitle })}
      </Heading>
      <Paragraph>
        {t(
          "{practiceName} is saved exactly where you left it. OpenVPM will take you straight back to the next setup step—no call or credit card required.",
          { practiceName },
        )}
      </Paragraph>

      <InfoCard tone="brand">
        <Label>{t("Next step: {stepTitle}", { stepTitle })}</Label>
        <Paragraph>{nextAction}</Paragraph>
      </InfoCard>

      <Section style={{ margin: "28px 0 8px" }}>
        <Button href={resumeUrl}>{t("Resume clinic setup")}</Button>
      </Section>

      <Paragraph muted>
        {t(
          "If you would rather have help, reply to this email. For an existing PIMS export, we will arrange a private transfer review—please do not email patient files or use a public sharing link.",
        )}
      </Paragraph>
    </EmailLayout>
  );
}
