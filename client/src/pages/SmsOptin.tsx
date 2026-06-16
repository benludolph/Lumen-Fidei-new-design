import step1Img from "@assets/Preferred_Contact_1781625581414.jpeg";
import step2Img from "@assets/Confirm_1781625581414.jpeg";

export default function SmsOptin() {
  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center">
      <div className="max-w-2xl w-full px-6 py-16 md:py-24">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
          How recipients consent to text messages
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Archdiocese of Chicago — Spiritual Healing Ministry
        </p>

        <div className="space-y-6 text-[15px] leading-relaxed text-foreground/90">
          <p>
            This page documents the opt-in process for SMS messages sent by the
            Archdiocese of Chicago Spiritual Healing Ministry. Consent is collected on
            the ministry's official online intake form. A person reaches these screens
            only after choosing to provide their contact information and selecting a
            text-message contact method.
          </p>

          <p>
            Text messages are limited to appointment reminders and scheduling updates
            related to a person's own ministry request. SMS consent is never required to
            receive ministry services — every recipient may choose email instead.
          </p>

          {/* Step 1 */}
          <div className="space-y-3 pt-4">
            <p className="font-semibold text-foreground">Step 1</p>
            <p className="text-muted-foreground">
              The person selects a text-message contact method
            </p>
            <p>
              On the intake form, under <strong>Preferred Contact Method</strong>, the
              person actively selects “SMS text message” (or “Both Email & SMS text
              message”).
            </p>
            <img
              src={step1Img}
              alt="Intake form Preferred Contact Method options with SMS text message selected"
              className="w-full rounded-lg border border-border"
              data-testid="img-sms-optin-step1"
            />
            <p className="text-xs text-muted-foreground">
              Intake form Preferred Contact Method options with SMS text message selected
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-3 pt-4">
            <p className="font-semibold text-foreground">Step 2</p>
            <p className="text-muted-foreground">
              The consent agreement and checkbox appear
            </p>
            <p>
              Only after a text method is chosen, the consent language appears and the
              person must check the box to agree. The agreement names the sender, states
              the message types, frequency, and rates, and explains STOP and HELP.
            </p>
            <img
              src={step2Img}
              alt="SMS consent agreement text and checkbox shown after selecting SMS"
              className="w-full rounded-lg border border-border"
              data-testid="img-sms-optin-step2"
            />
            <p className="text-xs text-muted-foreground">
              SMS consent agreement text and checkbox shown after selecting SMS, naming
              the Archdiocese of Chicago Healing Ministry
            </p>
          </div>

          {/* Full consent language */}
          <div className="space-y-3 pt-6 border-t border-border">
            <p className="font-semibold text-foreground">Consent language, in full</p>
            <p className="text-muted-foreground">
              The agreement each recipient accepts
            </p>
            <blockquote className="border-l-4 border-muted pl-4 italic text-muted-foreground">
              “I agree to receive SMS text messages from the Archdiocese of Chicago
              Healing Ministry at the phone number I provided. These text messages may
              include appointment reminders and scheduling updates related to my ministry
              request. Message frequency varies. Msg & data rates may apply. Reply STOP
              to opt out or HELP for help. I understand that SMS consent is not required
              to receive ministry services. I may choose email instead.”
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
}
