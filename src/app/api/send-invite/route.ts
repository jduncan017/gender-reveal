import { NextResponse } from "next/server";
import { Resend } from "resend";
import { env } from "~/env";

const resend = new Resend(env.RESEND_API_KEY);

export async function POST(request: Request) {
  const body = (await request.json()) as { emails: string[] };
  const emails = body.emails?.filter(Boolean);

  if (!emails || emails.length === 0) {
    return NextResponse.json(
      { error: "No emails provided" },
      { status: 400 },
    );
  }

  try {
    const { error } = await resend.emails.send({
      from: "Baby Marzofka-Duncan <josh@digitalnovastudio.com>",
      to: emails,
      subject: "You're Invited! Gender Reveal Video Call",
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 16px; text-align: center;">
          <h1 style="color: #000000; font-size: 28px; margin-bottom: 8px;">
            You're Invited!
          </h1>
          <p style="color: #555555; font-size: 16px; line-height: 1.6;">
            We're having a video call to find out if Baby Marzofka-Duncan is a
            boy or a girl! We'd love for you to be there.
          </p>

          <div style="margin: 24px 0; padding: 16px; background-color: #f0fdf4; border-radius: 10px;">
            <p style="color: #14532d; font-size: 18px; font-weight: bold; margin: 0;">
              ${env.GOOGLE_MEET_DATE}
            </p>
          </div>

          <p style="color: #555555; font-size: 14px; margin-bottom: 24px;">
            If that time doesn't work for you, just let Josh know and we can reschedule!
          </p>

          <p style="margin: 24px 0;">
            <a href="${env.GOOGLE_MEET_LINK}"
               target="_blank"
               style="color: #15803d; font-size: 22px; font-weight: bold; text-decoration: underline;">
              Join the Video Call
            </a>
          </p>

          <p style="color: #555555; font-size: 13px; margin-top: 20px;">
            Save this email &mdash; use the button above to join when it's time!
          </p>

          <div style="margin-top: 28px; padding: 20px; background-color: #f0fdf4; border-radius: 12px; text-align: left;">
            <h2 style="color: #000000; font-size: 16px; margin: 0 0 12px 0;">
              How to join (it's easy!):
            </h2>
            <ol style="color: #333333; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>When it's time, click the green <strong>"Join the Video Call"</strong> link above</li>
              <li>It will open in your web browser &mdash; no app needed!</li>
              <li>If it asks, click <strong>"Allow"</strong> to turn on your camera and microphone</li>
              <li>Click <strong>"Join now"</strong> (or "Ask to join")</li>
              <li>Make sure your video is on so we can all see each other!</li>
            </ol>
            <p style="color: #555555; font-size: 13px; margin-top: 12px;">
              <strong>Tip:</strong> Works best on a computer or tablet. On a phone, it may ask you to open the Google Meet app &mdash; that works too!
            </p>
          </div>

          <p style="color: #555555; font-size: 12px; margin-top: 24px;">
            See you there!
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: emails.length });
  } catch (err) {
    console.error("Failed to send invites:", err);
    return NextResponse.json(
      { error: "Failed to send emails" },
      { status: 500 },
    );
  }
}
