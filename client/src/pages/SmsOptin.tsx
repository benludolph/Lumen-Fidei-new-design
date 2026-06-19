import fullImg from "@assets/Full_1781894911490.png";
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
            This page documents the complete opt-in process for SMS messages sent by the
            Archdiocese of Chicago Spiritual Healing Ministry. Consent is collected on
            the ministry's official online intake form, which displays the Archdiocese of
            Chicago name and crest at the top and bottom of every page.
          </p>
          <p>
            A person provides their phone number on the form, selects "SMS text message"
            as their preferred contact method, reads the consent agreement, and checks
            the consent box to agree. Text messages are limited to appointment reminders
            and scheduling updates related to the person's own ministry request. SMS
            consent is never required to receive ministry services — every recipient may
            choose email instead.
          </p>

          {/* Full form */}
          <div className="space-y-3 pt-6 border-t border-border">
            <p className="font-semibold text-foreground">The complete opt-in experience</p>
            <p className="text-muted-foreground">
              Full intake form, with SMS selected and consent shown
            </p>
            <p>
              The full page below shows the entire opt-in experience end to end: the
              Archdiocese of Chicago branding, the official form title, all fields
              including the phone number field, the SMS selection, the full consent
              agreement, and the consent checkbox.
            </p>
            <img
              src={fullImg}
              alt="Complete Archdiocese of Chicago Spiritual Healing Ministry official intake form, showing the Archdiocese name and crest at top and bottom, the form title, all fields, the phone number field, SMS text message selected, the full SMS consent agreement, and the consent checkbox"
              className="w-full rounded-lg border border-border"
              data-testid="img-sms-optin-full"
            />
            <p className="text-xs text-muted-foreground">
              Complete Archdiocese of Chicago Spiritual Healing Ministry official intake
              form, showing the Archdiocese name and crest at top and bottom, the form
              title, all fields, the phone number field, SMS text message selected, the
              full SMS consent agreement, and the consent checkbox
            </p>
          </div>

          {/* Detail view header */}
          <div className="pt-6 border-t border-border">
            <p className="font-semibold text-foreground">Detail view</p>
            <p className="text-muted-foreground mt-1">The consent step, up close</p>
          </div>

          {/* Step 1 */}
          <div className="space-y-3">
            <p className="font-semibold text-foreground">Step 1</p>
            <p className="text-muted-foreground">
              The person enters their phone number and chooses a contact method
            </p>
            <p>
              The person provides their phone number and reaches the{" "}
              <strong>Preferred Contact Method</strong> options, with the Archdiocese of
              Chicago name and crest on the form.
            </p>
            <img
              src={step1Img}
              alt="Intake form phone number field and Preferred Contact Method options with Archdiocese of Chicago branding"
              className="w-full rounded-lg border border-border"
              data-testid="img-sms-optin-step1"
            />
            <p className="text-xs text-muted-foreground">
              Intake form phone number field and Preferred Contact Method options with
              Archdiocese of Chicago branding
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-3 pt-2">
            <p className="font-semibold text-foreground">Step 2</p>
            <p className="text-muted-foreground">
              The person selects SMS, and the consent agreement and checkbox appear
            </p>
            <p>
              After selecting "SMS text message," the consent language appears and the
              person must check the box to agree. The agreement names the Archdiocese of
              Chicago Healing Ministry, the message types, frequency and rates, and
              STOP/HELP.
            </p>
            <img
              src={step2Img}
              alt="Intake form with SMS selected, showing the full SMS consent agreement, checkbox, and Archdiocese of Chicago branding"
              className="w-full rounded-lg border border-border"
              data-testid="img-sms-optin-step2"
            />
            <p className="text-xs text-muted-foreground">
              Intake form with SMS selected, showing the full SMS consent agreement,
              checkbox, and Archdiocese of Chicago branding
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
