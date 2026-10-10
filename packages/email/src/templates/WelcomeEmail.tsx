import * as React from "react";
import { Section, Text } from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout";
import { Button } from "../components/Button";
import { InfoCard } from "../components/InfoCard";
import { Heading, Paragraph, Label } from "../components/Typography";
import { theme } from "../theme";
import type { Brand } from "../brand";
import { identity, type Translate } from "../i18n";

export interface WelcomeEmailProps {
  brand: Brand;
  practiceName: string;
  trialDays: number;
  billingRequired?: boolean;
  unsubscribeUrl?: string;
  t?: Translate;
}

export function WelcomeEmail({
  brand,
  practiceName,
  trialDays,
  billingRequired = false,
  unsubscribeUrl,
  t = identity,
}: WelcomeEmailProps) {
  const steps = [
    t("Take the 60-second tour of the schedule, records, and billing."),
    t("Make it yours: add your logo, accent color, and invite your team."),
    t(
      "Ask the AI assistant something, like “which pets are overdue for vaccines?”",
    ),
  ];
  return (
    <EmailLayout
      brand={brand}
      preview={billingRequired
        ? t(
            "Welcome to OpenVPM — complete billing to start your {trialDays}-day trial",
            { trialDays },
          )
        : t("Welcome to OpenVPM — your {trialDays}-day trial is ready", {
            trialDays,
          })}
      unsubscribeUrl={unsubscribeUrl}
      recipientReason={t(
        "You're receiving this because you created an OpenVPM account.",
      )}
      t={t}
    >
      <Heading>{t("Welcome to OpenVPM 🎉")}</Heading>
      <Paragraph>
        {t(
          "Hi {practiceName}, your account has been created. Your workspace includes sample clients, pets, and appointments to help you explore OpenVPM.",
          { practiceName },
        )}
      </Paragraph>
      <Paragraph muted>
        {billingRequired
          ? t(
              "Complete secure Stripe checkout to start your {trialDays}-day free trial. A card is required, with no subscription charge today. Billing starts automatically after the trial; review the price and charge date at checkout, and cancel in Settings → Plan & Billing before the trial ends to avoid a subscription charge. If you already completed checkout, sign in to your workspace.",
              { trialDays },
            )
          : t(
              "Your {trialDays}-day trial is ready. Your data is always yours to export.",
              { trialDays },
            )}
      </Paragraph>

      <Section style={{ margin: "28px 0 8px" }}>
        <Button href={billingRequired
          ? `${brand.appUrl.replace(/\/$/, "")}/login?next=%2Fsettings%3Ftab%3Dbilling`
          : brand.appUrl}>
          {billingRequired
            ? t("Review billing and start your trial")
            : t("Open your dashboard")}
        </Button>
      </Section>

      <InfoCard tone="brand">
        <Label>{t("Get started")}</Label>
        {steps.map((s, i) => (
          <Text
            key={i}
            style={{
              fontFamily: theme.fontBody,
              fontSize: "14px",
              lineHeight: "1.6",
              color: theme.text,
              margin: i === 0 ? "6px 0 0" : "10px 0 0",
            }}
          >
            <span style={{ color: theme.brand, fontWeight: 700 }}>→</span> {s}
          </Text>
        ))}
      </InfoCard>

      <Paragraph muted>
        {t("Questions? Just reply to this email — it reaches a real person.")}
      </Paragraph>
    </EmailLayout>
  );
}
