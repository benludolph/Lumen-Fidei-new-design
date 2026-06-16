export default function SmsPrivacy() {
  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center">
      <div className="max-w-2xl w-full px-6 py-16 md:py-24">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
          SMS Messaging Terms & Privacy
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Archdiocese of Chicago — Spiritual Healing Ministry
        </p>

        <div className="space-y-6 text-[15px] leading-relaxed text-foreground/90">
          <p>
            This page is maintained by the Archdiocese of Chicago Spiritual Healing
            Ministry. Lumen Fidei is a digital formation program of this ministry.
          </p>

          <p>
            By providing your phone number and selecting SMS on our intake form, you
            agree to receive text messages from the Archdiocese of Chicago Spiritual
            Healing Ministry. These messages may include appointment reminders and
            scheduling updates related to your ministry request.
          </p>

          <div className="space-y-2">
            <p className="font-medium text-foreground">Key details</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Message frequency varies</li>
              <li>Message and data rates may apply</li>
              <li>Reply STOP to opt out</li>
              <li>Reply HELP for assistance</li>
              <li>SMS consent is not required to receive ministry services</li>
            </ul>
          </div>

          <p>
            The Archdiocese of Chicago Spiritual Healing Ministry will not share or
            sell your mobile phone number or SMS information. No mobile information
            will be shared with third parties or affiliates for marketing or
            promotional purposes at any time. Text messaging originator opt-in data
            and consent will not be shared with any third parties.
          </p>
        </div>
      </div>
    </div>
  );
}
