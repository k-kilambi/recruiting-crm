import { Resend } from "resend";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { userEmail, message } = req.body;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "noreply@ggrecruit.com",
      to: "k.kilambi.ms@gmail.com",
      subject: `AI Quick Add interest — ${userEmail}`,
      text: `${userEmail} wants access to AI Quick Add.\n\nTheir message:\n${message || "(none)"}`,
    });
  } catch (e) {
    console.error("notify-interest email failed:", e);
  }
  return res.status(200).json({ ok: true });
}
