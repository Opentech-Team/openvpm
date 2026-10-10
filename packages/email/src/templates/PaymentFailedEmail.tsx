import * as React from "react";
import { Section } from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout";
import { Button } from "../components/Button";
import { InfoCard } from "../components/InfoCard";
import { Heading, Paragraph, Label, Stat } from "../components/Typography";
import type { Brand } from "../brand";
import { identity, tNodes, type Translate } from "../i18n";

export interface PaymentFailedEmailProps {
  brand: Brand;
  practiceName: string;
  amount: string; // e.g. "$79.00"
  nextRetryDate?: string; // e.g. "July 3, 2026"
  billingUrl: string;
  t?: Translate;
}

export function PaymentFailedEmail({
  brand,
  practiceName,
  amount,
  nextRetryDate,
  billingUrl,
  t = identity,
}: PaymentFailedEmailProps) {
  return (
    <EmailLayout
      brand={brand}
      preview={t(
        "Your OpenVPM payment didn't go through — update your billing",
      )}
      t={t}
    >
      <Heading>{t("Your payment didn't go through")}</Heading>
      <Paragraph>
        {tNodes(
          t,
          "Hi {practiceName}, we couldn't process your latest OpenVPM payment of {amount}. This usually means a card expired or was replaced — it's a quick fix.",
          { practiceName },
          { amount: <strong>{amount}</strong> },
        )}
      </Paragraph>

      <InfoCard tone="danger">
        <Label>{t("What happens next")}</Label>
        <Paragraph>
          {nextRetryDate
            ? t(
                "We'll automatically try again on {nextRetryDate}. Update your card before then to avoid any interruption.",
                { nextRetryDate },
              )
            : t(
                "Update your card to keep your workspace active and avoid any interruption.",
              )}
        </Paragraph>
      </InfoCard>

      <Section style={{ margin: "8px 0" }}>
        <Button href={billingUrl}>{t("Update billing")}</Button>
      </Section>

      <Paragraph muted>
        {t(
          "Your data is safe. If a payment ultimately doesn't clear, your workspace becomes read-only — nothing is deleted, and reactivating takes one click. Need a hand? Just reply to this email.",
        )}
      </Paragraph>
    </EmailLayout>
  );
}
