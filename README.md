# Soft Steps Hostinger SMTP Edge Function Patch

## Files
- `supabase/functions/send-admin-email/index.ts`: authenticated/admin-checked email Edge Function using Hostinger SMTP on port 465.
- `src/app/features/admin/services/email-communication.service.ts`: removes the old Resend/not-configured frontend gate and invokes the Edge Function.
- `src/environments/environment.ts` and `.prod.ts`: updates the informational provider setting.

## Apply
Extract this patch into the project root (`D:\\All Projects\\softsteps\\soft-steps-carpet`) and allow it to overwrite the listed source files.

## Required Supabase secrets
Set these in Supabase Dashboard > Edge Functions > Secrets (or the CLI):
- `HOSTINGER_SMTP_HOST=smtp.hostinger.com`
- `HOSTINGER_SMTP_PORT=465`
- `HOSTINGER_SMTP_USER=info@softstepscarpets.com`
- `HOSTINGER_SMTP_PASSWORD` = the actual mailbox password, entered securely
- `HOSTINGER_SMTP_FROM_EMAIL=info@softstepscarpets.com`
- `HOSTINGER_SMTP_FROM_NAME=Soft Steps Carpets`

Supabase normally provides `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. Confirm they are present for this project. Never place the SMTP password or service-role key in Angular source.

## Deploy (PowerShell)
Run from the project root:
```powershell
supabase functions deploy send-admin-email --use-api
```

Set non-password secrets through CLI if desired:
```powershell
supabase secrets set HOSTINGER_SMTP_HOST=smtp.hostinger.com HOSTINGER_SMTP_PORT=465 HOSTINGER_SMTP_USER=info@softstepscarpets.com HOSTINGER_SMTP_FROM_EMAIL=info@softstepscarpets.com HOSTINGER_SMTP_FROM_NAME="Soft Steps Carpets"
```
Set `HOSTINGER_SMTP_PASSWORD` separately using the Supabase Dashboard secret UI to avoid putting the password in shell history.

## Notes
- SMTP port 465 (implicit TLS) is used. Supabase's SMTP egress restrictions can vary; verify the deployed function with a real mailbox test.
- SMTP server acceptance is not proof of inbox delivery.
- This patch is generated from the supplied source ZIP; it has not been run against your local full Angular workspace or live Supabase project.
