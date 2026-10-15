import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@^9";

const allowedOrigins = new Set([
  "https://www.softstepscarpets.com",
  "https://softstepscarpets.com",
  "https://softsteps-5l9x.vercel.app",
  "http://localhost:4200",
  "http://localhost:4201",
]);

function response(
  body: Record<string, unknown>,
  status: number,
  origin: string,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
      "Vary": "Origin",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "authorization, apikey, content-type, x-client-info",
    },
  });
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") ?? "";

  if (!allowedOrigins.has(origin)) {
    return new Response("Origin not allowed", { status: 403 });
  }

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Vary": "Origin",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "authorization, apikey, content-type, x-client-info",
      },
    });
  }

  if (req.method !== "POST") {
    return response({ error: "Method not allowed" }, 405, origin);
  }

  let claimed = false;
  let submissionId = "";

  try {
    const payload = await req.json();
    submissionId = String(payload?.submissionId ?? "").trim();

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        .test(submissionId)
    ) {
      return response({ error: "Invalid submission ID" }, 400, origin);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const smtpUser = Deno.env.get("HOSTINGER_SMTP_USER");
    const smtpPassword = Deno.env.get("HOSTINGER_SMTP_PASSWORD");

    if (!supabaseUrl || !serviceRoleKey || !smtpUser || !smtpPassword) {
      console.error("Notification function is missing required server secrets.");
      return response({ error: "Notification service unavailable" }, 500, origin);
    }

    const db = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: row, error: readError } = await db
      .from("custom_requirement_submissions")
      .select(
        "id, reference_number, name, email, phone, requirement_type, project_size, preferred_size, material, colour, budget, location, details, status, created_at, notification_claimed_at, notification_sent_at",
      )
      .eq("id", submissionId)
      .maybeSingle();

    if (readError) {
      console.error("Could not load enquiry:", readError.message);
      return response({ error: "Could not verify submission" }, 500, origin);
    }

    if (!row) {
      return response({ error: "Submission not found" }, 404, origin);
    }

    if (row.notification_sent_at) {
      return response({ ok: true, alreadySent: true }, 200, origin);
    }

    const createdAt = new Date(row.created_at).getTime();
    if (
      !Number.isFinite(createdAt) ||
      Date.now() - createdAt > 15 * 60 * 1000 ||
      createdAt > Date.now() + 60 * 1000
    ) {
      return response({ error: "Submission is outside the notification window" }, 400, origin);
    }

    const host = Deno.env.get("HOSTINGER_SMTP_HOST") ?? "smtp.hostinger.com";
    const configuredPort = Number(Deno.env.get("HOSTINGER_SMTP_PORT") ?? "465");

    if (configuredPort !== 465) {
      console.error("Notification SMTP must use port 465.");
      return response({ error: "Email service configuration error" }, 500, origin);
    }

    const transporter = nodemailer.createTransport({
      host,
      port: 465,
      secure: true,
      auth: { user: smtpUser, pass: smtpPassword },
    });

    const { data: claim, error: claimError } = await db
      .from("custom_requirement_submissions")
      .update({ notification_claimed_at: new Date().toISOString() })
      .eq("id", submissionId)
      .is("notification_claimed_at", null)
      .is("notification_sent_at", null)
      .select("id")
      .maybeSingle();

    if (claimError) {
      console.error("Could not claim notification:", claimError.message);
      return response({ error: "Could not claim notification" }, 500, origin);
    }

    if (!claim) {
      const { data: latest } = await db
        .from("custom_requirement_submissions")
        .select("notification_sent_at")
        .eq("id", submissionId)
        .maybeSingle();

      if (latest?.notification_sent_at) {
        return response({ ok: true, alreadySent: true }, 200, origin);
      }

      return response({ ok: false, message: "Notification already being processed" }, 409, origin);
    }

    claimed = true;

    const fields: Array<[string, unknown]> = [
      ["Reference", row.reference_number ? `#${row.reference_number}` : row.id],
      ["Name", row.name],
      ["Email", row.email],
      ["Phone", row.phone],
      ["Requirement type", row.requirement_type],
      ["Project size", row.project_size],
      ["Preferred size", row.preferred_size],
      ["Material", row.material],
      ["Colour", row.colour],
      ["Budget", row.budget],
      ["Location", row.location],
      ["Details", row.details],
      ["Status", row.status],
      ["Submitted at", row.created_at],
    ];

    const text = [
      "A new custom requirement has been submitted on Soft Steps Carpets.",
      "",
      ...fields.map(([label, value]) => `${label}: ${value || "Not provided"}`),
      "",
      "Review this enquiry in the Soft Steps admin dashboard.",
    ].join("\n");

    const html = `
      <h2>New Custom Requirement</h2>
      <p>A customer has submitted a requirement on Soft Steps Carpets.</p>
      <table style="border-collapse:collapse;width:100%;max-width:700px">
        ${fields.map(([label, value]) => `
          <tr>
            <th style="text-align:left;padding:9px;border:1px solid #ddd">${escapeHtml(label)}</th>
            <td style="padding:9px;border:1px solid #ddd;white-space:pre-wrap">${escapeHtml(value || "Not provided")}</td>
          </tr>
        `).join("")}
      </table>
    `;

    const fromEmail = Deno.env.get("HOSTINGER_SMTP_FROM_EMAIL") ?? "info@softstepscarpets.com";
    const fromName = Deno.env.get("HOSTINGER_SMTP_FROM_NAME") ?? "Soft Steps Carpets";

    try {
      await transporter.sendMail({
        from: `"${fromName.replaceAll('"', "")}" <${fromEmail}>`,
        to: "info@softstepscarpets.com",
        subject: `New Custom Requirement — ${row.name} — Ref #${row.reference_number ?? row.id}`,
        text,
        html,
        ...(row.email ? { replyTo: String(row.email) } : {}),
      });
    } catch (mailError) {
      // Release the claim only when SMTP explicitly reports failure.
      await db
        .from("custom_requirement_submissions")
        .update({ notification_claimed_at: null })
        .eq("id", submissionId)
        .is("notification_sent_at", null);

      claimed = false;
      console.error("SMTP delivery failed:", mailError);
      return response({ error: "Email delivery failed" }, 502, origin);
    }

    const { error: sentUpdateError } = await db
      .from("custom_requirement_submissions")
      .update({ notification_sent_at: new Date().toISOString() })
      .eq("id", submissionId)
      .not("notification_claimed_at", "is", null);

    if (sentUpdateError) {
      // Keep the claim in place: SMTP accepted the email, so avoid automatic duplicates.
      console.error("Email accepted but sent timestamp update failed:", sentUpdateError.message);
      return response({ ok: true, sentTimestampPending: true }, 200, origin);
    }

    claimed = false;
    return response({ ok: true }, 200, origin);
  } catch (error) {
    console.error("Notification function failed:", error);

    // If an unexpected error happened after claiming but before sending,
    // attempt to release the claim. Never expose internal errors to the caller.
    if (claimed && submissionId) {
      try {
        const url = Deno.env.get("SUPABASE_URL");
        const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (url && key) {
          const db = createClient(url, key, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          await db
            .from("custom_requirement_submissions")
            .update({ notification_claimed_at: null })
            .eq("id", submissionId)
            .is("notification_sent_at", null);
        }
      } catch (releaseError) {
        console.error("Could not release notification claim:", releaseError);
      }
    }

    return response({ error: "Notification processing failed" }, 500, origin);
  }
});
