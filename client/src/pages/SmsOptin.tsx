import step1Img from "@assets/Optin_1_1781894152881.png";
import step2Img from "@assets/Optin_2_1781894161621.png";

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
            the ministry's official online intake form, which carries the Archdiocese of
            Chicago name and crest. A person reaches these screens only after choosing to
            provide their contact information and selecting a text-message contact method.
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
              The person enters their phone number and chooses a contact method
            </p>
            <p>
              On the official Archdiocese of Chicago intake form, the person provides
              their phone number and reaches the <strong>Preferred Contact Method</strong>{" "}
              options. The Archdiocese of Chicago name and crest appear on the form.
            </p>
            <img
              src={step1Img}
              alt="Archdiocese of Chicago intake form showing phone number field and Preferred Contact Method options, with the Archdiocese of Chicago name and crest"
              className="w-full rounded-lg border border-border"
              data-testid="img-sms-optin-step1"
            />
            <p className="text-xs text-muted-foreground">
              Archdiocese of Chicago intake form showing phone number field and Preferred
              Contact Method options, with the Archdiocese of Chicago name and crest
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-3 pt-4">
            <p className="font-semibold text-foreground">Step 2</p>
            <p className="text-muted-foreground">
              The person selects SMS, and the consent agreement and checkbox appear
            </p>
            <p>
              After selecting "SMS text message," the consent language appears and the
              person must check the box to agree. The agreement names the sender
              (Archdiocese of Chicago Healing Ministry), the message types, frequency and
              rates, and STOP/HELP — shown alongside the Archdiocese of Chicago name and
              crest.
            </p>
            <img
              src={step2Img}
              alt="Archdiocese of Chicago intake form with SMS selected, showing the full SMS consent agreement, the consent checkbox, and the Archdiocese of Chicago name and crest"
              className="w-full rounded-lg border border-border"
              data-testid="img-sms-optin-step2"
            />
            <p className="text-xs text-muted-foreground">
              Archdiocese of Chicago intake form with SMS selected, showing the full SMS
              consent agreement, the consent checkbox, and the Archdiocese of Chicago name
              and crest
            </p>
          </div>

          {/* Full consent language */}
          <div className="space-y-3 pt-6 border-t border-border">
            <p className="font-semibold text-foreground">Consent language, in full</p>
            <p className="text-muted-foreground">The agreement each recipient accepts</p>
            <blockquote className="border-l-4 border-muted pl-4 italic text-muted-foreground">
              "I agree to receive SMS text messages from the Archdiocese of Chicago
              Healing Ministry at the phone number I provided. These text messages may
              include appointment reminders and scheduling updates related to my ministry
              request. Message frequency varies. Msg & data rates may apply. Reply STOP
              to opt out or HELP for help. I understand that SMS consent is not required
              to receive ministry services. I may choose email instead."
            </blockquote>
          </div>

          {/* Footer */}
          <p className="pt-4 text-sm text-muted-foreground border-t border-border">
            Maintained by the Archdiocese of Chicago Spiritual Healing Ministry. For how
            mobile information is handled, see our{" "}
            <a href="/sms-privacy" className="underline hover:text-foreground transition-colors">
              SMS Messaging Terms &amp; Privacy
            </a>{" "}
            page.
          </p>
        </div>
      </div>
    </div>
  );
}
