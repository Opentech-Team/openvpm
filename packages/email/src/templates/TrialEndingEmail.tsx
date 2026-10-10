import * as React from "react";
import { Section } from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout";
import { Button } from "../components/Button";
import { InfoCard } from "../components/InfoCard";
import { Heading, Paragraph, Label, Stat } from "../components/Typography";
import type { Brand } from "../brand";
import { identity, tNodes, type Translate } from "../i18n";

export interface TrialEndingEmailProps {
  brand: Brand;
  practiceName: string;
  daysLeft: number;
  trialEndDate: string; // e.g. "July 10, 2026"
  monthlyPrice: string; // e.g. "$79"
  billingUrl: string;
  billingConnected?: boolean;
  unsubscribeUrl?: string;
  t?: Translate;
}

export function TrialEndingEmail({
  brand,
  practiceName,
  daysLeft,
  trialEndDate,
  monthlyPrice,
  billingUrl,
  billingConnected = false,
  unsubscribeUrl,
  t = identity,
}: TrialEndingEmailProps) {
  const endsTomorrow = daysLeft <= 1;
  return (
    <EmailLayout
      brand={brand}
      preview={
        billingConnected
          ? endsTomorrow
            ? t(
                "Your OpenVPM trial ends tomorrow. Your billing setup is connected.",
              )
            : t(
                "Your OpenVPM trial ends in {daysLeft} days. Your billing setup is connected.",
                { daysLeft },
              )
          : endsTomorrow
            ? t(
                "Your OpenVPM trial ends tomorrow. Add billing and nothing changes.",
              )
            : t(
                "Your OpenVPM trial ends in {daysLeft} days. Add billing and nothing changes.",
                { daysLeft },
              )
      }
      unsubscribeUrl={unsubscribeUrl}
      recipientReason={t(
        "This address is the OpenVPM billing contact for {practiceName}.",
        { practiceName },
      )}
      t={t}
    >
      <Heading>
        {endsTomorrow
          ? t("Your trial ends tomorrow")
          : t("Your trial ends in {daysLeft} days", { daysLeft })}
      </Heading>
      <Paragraph>
        {tNodes(
          t,
          billingConnected
            ? "Hi {practiceName}, your OpenVPM trial ends on {trialEndDate}. You already completed billing setup, so there is no need to add it again. Your schedule, records, and everything you've set up stay exactly as they are."
            : "Hi {practiceName}, your OpenVPM trial ends on {trialEndDate}. Add billing now and nothing changes. Your schedule, records, and everything you've set up stay exactly as they are.",
          { practiceName },
          { trialEndDate: <strong>{trialEndDate}</strong> },
        )}
      </Paragraph>

      <InfoCard tone="warning">
        <Label>{t("Simple, flat pricing")}</Label>
        <Stat>{t("{monthlyPrice}/location per month", { monthlyPrice })}</Stat>
        <Paragraph muted>
          {t(
            "Unlimited staff, with AI and SMS allowances included. Cancel anytime.",
          )}
        </Paragraph>
      </InfoCard>

      <Section style={{ margin: "8px 0" }}>
        <Button href={billingUrl}>
          {billingConnected ? t("Review billing") : t("Add billing")}
        </Button>
      </Section>

      <Paragraph muted>
        {t(
          "If your trial lapses, your workspace simply becomes read only. Nothing is deleted, and you can turn it back on anytime by adding a card.",
        )}
      </Paragraph>
    </EmailLayout>
  );
}
