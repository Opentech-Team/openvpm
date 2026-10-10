import * as React from "react";
import { Section, Row, Column } from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout";
import { Button } from "../components/Button";
import { InfoCard } from "../components/InfoCard";
import { Heading, Paragraph, Label, Stat } from "../components/Typography";
import type { Brand } from "../brand";
import { identity, type Translate } from "../i18n";

export interface PaymentReceiptEmailProps {
  brand: Brand;
  practiceName: string;
  amount: string; // e.g. "$79.00"
  periodLabel: string; // e.g. "Jun 10 – Jul 10, 2026"
  invoiceUrl?: string;
  t?: Translate;
}

export function PaymentReceiptEmail({
  brand,
  practiceName,
  amount,
  periodLabel,
  invoiceUrl,
  t = identity,
}: PaymentReceiptEmailProps) {
  return (
    <EmailLayout
      brand={brand}
      preview={t("Your OpenVPM receipt — {amount}", { amount })}
      t={t}
    >
      <Heading>{t("Payment received")}</Heading>
      <Paragraph>
        {t(
          "Thanks, {practiceName}. We've received your payment — here are the details for your records.",
          { practiceName },
        )}
      </Paragraph>

      <InfoCard tone="success">
        <Row>
          <Column>
            <Label>{t("Amount paid")}</Label>
            <Stat>{amount}</Stat>
          </Column>
          <Column style={{ textAlign: "right", verticalAlign: "top" }}>
            <Label>{t("Billing period")}</Label>
            <Paragraph>{periodLabel}</Paragraph>
          </Column>
        </Row>
      </InfoCard>

      {invoiceUrl ? (
        <Section style={{ margin: "8px 0" }}>
          <Button href={invoiceUrl}>{t("View invoice")}</Button>
        </Section>
      ) : null}

      <Paragraph muted>
        {t(
          "You can review every invoice and update your payment method anytime in billing settings. Questions? Just reply to this email.",
        )}
      </Paragraph>
    </EmailLayout>
  );
}
