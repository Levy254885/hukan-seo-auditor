type SendArgs = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendEmail(args: SendArgs): Promise<{ ok: boolean; error?: string }> {
  const from = process.env.EMAIL_FROM || "noreply@hukan.example";
  const resendKey = process.env.RESEND_API_KEY;

  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [args.to],
          subject: args.subject,
          text: args.text,
          html: args.html || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        console.error("[email] Resend error", res.status, body);
        return { ok: false, error: `Resend ${res.status}` };
      }
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "send failed";
      console.error("[email] Resend exception", message);
      return { ok: false, error: message };
    }
  }

  console.info("[email:dev]", {
    from,
    to: args.to,
    subject: args.subject,
    textPreview: args.text.slice(0, 120),
  });
  return { ok: true };
}
