// The welcome a new Villager gets after paying. Sent through Resend when
// RESEND_API_KEY is present. Netlify Identity's set-password mail is separate
// and still goes out for brand new accounts.

const FROM = "Practice Village <admin@thepracticecenter.org>";

function html(planLabel, setPasswordNeeded) {
  const passwordLine = setPasswordNeeded
    ? `<p>One step before you can enter: check for a second email from us titled “Reset your password.” That link sets your password for the first time. If it has not arrived, go to <a href="https://thepracticevillage.org/login" style="color:#b95537;">thepracticevillage.org/login</a> and choose “Forgot your password.”</p>`
    : `<p>Sign in any time at <a href="https://thepracticevillage.org/login" style="color:#b95537;">thepracticevillage.org/login</a>.</p>`;

  return `<div style="margin:0 auto;max-width:600px;padding:36px 28px;background:#fffdf8;border:1px solid #ead9bd;border-radius:18px;color:#1a1a4e;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.65;">
  <div style="margin-bottom:24px;color:#c9862b;font-family:Georgia,serif;font-size:28px;font-weight:700;">Practice Village</div>
  <p>Your membership is active. Welcome in.</p>
  ${passwordLine}
  <p style="margin:28px 0;">
    <a href="https://thepracticevillage.org/member" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#b95537;color:#ffffff;font-weight:700;text-decoration:none;">Open your lobby</a>
  </p>
  <p><strong>What is open right now:</strong></p>
  <ul style="padding-left:18px;">
    <li><strong>The Concierge</strong> at the front desk. Tell it what you are dealing with. It answers in plain language, finds official resources, and keeps only what you say keep.</li>
    <li><strong>Moxie Studios</strong>, beginner yoga and meditation.</li>
    <li><strong>The Kitchen</strong>, PlantLuck plus a vetted shelf.</li>
    <li><strong>HUSH</strong>, the sixty-second app and free mindfulness resources.</li>
    <li><strong>Safety Hall</strong>, private documentation that never leaves your device.</li>
    <li><strong>Your Record</strong>, everything you keep with its sources, downloadable any time.</li>
  </ul>
  <p>Your ${planLabel} includes one Rebuild Arc workshop voucher each membership year. The first workshop is four Saturdays starting October 31 at 3:00 pm Central. Live classes begin February 7.</p>
  <p>Start wherever you are. You do not have to use every room or finish anything today.</p>
  <p>If something is confusing or broken, reply to this email and tell us.</p>
</div>`;
}

function text(planLabel, setPasswordNeeded) {
  return [
    "Your membership is active. Welcome in.",
    "",
    setPasswordNeeded
      ? "Check for a second email titled \"Reset your password\" to set your password for the first time. If it has not arrived, go to thepracticevillage.org/login and choose Forgot your password."
      : "Sign in any time at thepracticevillage.org/login.",
    "",
    "Your lobby: https://thepracticevillage.org/member",
    "",
    "Open now: the Concierge at the front desk, Moxie Studios (beginner yoga and meditation), the Kitchen (PlantLuck plus a vetted shelf), HUSH, Safety Hall, and your Record.",
    "",
    `Your ${planLabel} includes one Rebuild Arc workshop voucher each membership year. The first workshop is four Saturdays starting October 31 at 3:00 pm Central. Live classes begin February 7.`,
    "",
    "If something is confusing or broken, reply and tell us.",
  ].join("\n");
}

export async function sendWelcomeEmail(email, { planLabel = "membership", setPasswordNeeded = false } = {}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, reason: "RESEND_API_KEY is not configured" };
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        reply_to: "admin@thepracticecenter.org",
        subject: "You're in. Welcome to Practice Village.",
        html: html(planLabel, setPasswordNeeded),
        text: text(planLabel, setPasswordNeeded),
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return { sent: false, reason: payload.message || `Resend ${response.status}` };
    return { sent: true, id: payload.id };
  } catch (error) {
    return { sent: false, reason: error.message };
  }
}
