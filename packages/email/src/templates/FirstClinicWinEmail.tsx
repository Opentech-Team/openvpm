import * as React from "react";
import { Section } from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout";
import { Button } from "../components/Button";
import { InfoCard } from "../components/InfoCard";
import { Heading, Label, Paragraph, Stat } from "../components/Typography";
import type { Brand } from "../brand";
import { identity, type Translate } from "../i18n";

export interface FirstClinicWinEmailProps {
  brand: Brand;
  practiceName: string;
  trialEndDate: string;
  billingUrl: string;
  unsubscribeUrl?: string;
  t?: Translate;
}

/** A PHI-free celebration sent only after the first completed real visit. */
export function FirstClinicWinEmail({
  brand,
  practiceName,
  trialEndDate,
  billingUrl,
  unsubscribeUrl,
  t = identity,
}: FirstClinicWinEmailProps) {
  return (
    <EmailLayout
      brand={brand}
      preview={t("Your team completed its first real visit in OpenVPM.")}
      unsubscribeUrl={unsubscribeUrl}
      recipientReason={t(
        "This is the verified OpenVPM administrator address saved for {practiceName}.",
        { practiceName },
      )}
      t={t}
    >
      <Heading>{t("You ran your first real visit.")}</Heading>
      <Paragraph>
        {t(
          "Your team just took OpenVPM through a real clinic workflow—not a demo or a setup checklist. That's a meaningful first win.",
        )}
      </Paragraph>

      <InfoCard tone="success">
        <Label>{t("Your supported trial")}</Label>
        <Stat>{t("Runs through {trialEndDate}", { trialEndDate })}</Stat>
        <Paragraph muted>
          {t(
            "Keep validating the workflow with your team. A card is not required during this supported trial.",
          )}
        </Paragraph>
      </InfoCard>

      <Paragraph>
        {t(
          "When the clinic is ready, add billing once and the workspace can keep moving without an interruption at the end of the trial.",
        )}
      </Paragraph>

      <Section style={{ margin: "8px 0" }}>
        <Button href={billingUrl}>{t("Review billing")}</Button>
      </Section>

      <Paragraph muted>
        {t(
          "Questions or something that did not fit the way your clinic works? Reply and tell us. We're building this with clinics like yours.",
        )}
      </Paragraph>
    </EmailLayout>
  );
}
