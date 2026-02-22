package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

var resendAPIKey = os.Getenv("RESEND_API_KEY")
var resendFrom = os.Getenv("RESEND_FROM")
var frontendURL = strings.TrimRight(os.Getenv("FRONTEND_URL"), "/")

func sendResendMail(to string, subject string, htmlBody string) error {
	if resendAPIKey == "" {
		return fmt.Errorf("RESEND_API_KEY not set")
	}
	if resendFrom == "" {
		return fmt.Errorf("RESEND_FROM not set")
	}

	payload := map[string]interface{}{
		"from":    resendFrom,
		"to":      []string{to},
		"subject": subject,
		"html":    htmlBody,
	}
	bodyBytes, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Authorization", "Bearer "+resendAPIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("resend request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("resend API error %d: %s", resp.StatusCode, string(respBody))
	}

	log.Printf("[resend] sent email to=%s subject=%q", to, subject)
	return nil
}

// ---------------------------------------------------------------------------
// Branded email templates — PagePerfect Editorial Design System
//
// Colors:  Ink #050505 · Card #0a0a0a · Text #f2f2f0 / #a8a8a0 / #6a6a64
//          Registration Blue #0033ff
// Fonts:   Inter Tight (display) · Source Serif 4 (body) · IBM Plex Mono
// ---------------------------------------------------------------------------

func brandedEmail(preheader, cardBody string) string {
	tmpl := `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>PagePerfect</title>
  <!--[if mso]><style>body,table,td{font-family:Arial,sans-serif!important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#050505;color:#f2f2f0;font-family:'Inter Tight',system-ui,-apple-system,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">{{PREHEADER}}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#050505;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%;">

          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-family:'Inter Tight',system-ui,sans-serif;font-size:18px;font-weight:700;letter-spacing:-0.02em;color:#ffffff;">PagePerfect</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#0a0a0a;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:40px 32px;">
              {{BODY}}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:32px;">
              <p style="margin:0;font-family:'IBM Plex Mono','SF Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:rgba(255,255,255,0.15);">
                PagePerfect &middot; Professional typesetting in your browser
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
	tmpl = strings.Replace(tmpl, "{{PREHEADER}}", preheader, 1)
	tmpl = strings.Replace(tmpl, "{{BODY}}", cardBody, 1)
	return tmpl
}

func emailButton(url, label string) string {
	return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:4px 0;"><a href="` + url + `" target="_blank" style="display:inline-block;background-color:#0033ff;color:#ffffff;font-family:'Inter Tight',system-ui,sans-serif;font-size:14px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:9999px;">` + label + `</a></td></tr></table>`
}

func emailHeading(text string) string {
	return `<h1 style="margin:0 0 8px;font-family:'Inter Tight',system-ui,sans-serif;font-size:22px;font-weight:700;letter-spacing:-0.02em;color:#f2f2f0;line-height:1.2;">` + text + `</h1>`
}

func emailBody(text string) string {
	return `<p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#a8a8a0;">` + text + `</p>`
}

func emailFootnote(text string) string {
	return `<p style="margin:28px 0 0;font-size:12px;line-height:1.6;color:#6a6a64;">` + text + `</p>`
}

func verificationEmailHTML(actionURL string) string {
	body := emailHeading("Verify your email") +
		emailBody("Click the button below to confirm your email address and activate your PagePerfect account.") +
		emailButton(actionURL, "Verify Email") +
		emailFootnote("If you didn't create a PagePerfect account, you can safely ignore this email.")
	return brandedEmail("Verify your email address for PagePerfect", body)
}

func passwordResetEmailHTML(actionURL string) string {
	body := emailHeading("Reset your password") +
		emailBody("We received a request to reset your password. Click the button below to choose a new one.") +
		emailButton(actionURL, "Reset Password") +
		emailFootnote("If you didn't request this, you can safely ignore this email. Your password won't change.")
	return brandedEmail("Reset your PagePerfect password", body)
}

func emailChangeHTML(actionURL string) string {
	body := emailHeading("Confirm email change") +
		emailBody("Click the button below to confirm your new email address.") +
		emailButton(actionURL, "Confirm Change") +
		emailFootnote("If you didn't request this change, please secure your account immediately.")
	return brandedEmail("Confirm your new email address", body)
}

func otpEmailHTML(code string) string {
	codeBlock := `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:4px 0;"><div style="display:inline-block;background-color:#111111;border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:20px 40px;"><span style="font-family:'IBM Plex Mono','SF Mono',monospace;font-size:32px;font-weight:600;letter-spacing:0.25em;color:#f2f2f0;">` + code + `</span></div></td></tr></table>`
	body := emailHeading("Your login code") +
		emailBody("Enter this code to complete your sign-in:") +
		codeBlock +
		emailFootnote("This code expires shortly. If you didn't request this, you can safely ignore this email.")
	return brandedEmail("Your PagePerfect login code: "+code, body)
}

func authAlertEmailHTML() string {
	body := emailHeading("New sign-in detected") +
		`<p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#a8a8a0;">A new sign-in to your PagePerfect account was detected. If this was you, no action is needed.</p>` +
		emailFootnote("If this wasn't you, please change your password immediately.")
	return brandedEmail("New sign-in to your PagePerfect account", body)
}

func main() {
	app := pocketbase.New()

	// Log Resend config on startup
	if resendAPIKey == "" || resendFrom == "" {
		log.Println("[resend] WARNING: RESEND_API_KEY or RESEND_FROM not set — emails will fail")
	} else {
		log.Printf("[resend] Email hooks active, sending from %s via Resend HTTP API", resendFrom)
	}
	if frontendURL == "" {
		log.Println("[resend] WARNING: FRONTEND_URL not set — email links will use PocketBase default URLs")
	} else {
		log.Printf("[resend] Frontend URL: %s", frontendURL)
	}

	// ── SQLite tuning for concurrent write safety ──────────────────────
	// PocketBase enables WAL mode by default, but the default busy_timeout
	// is very short. Under concurrent writes (50 users compiling + credit
	// deductions), SQLite will throw "database is locked" errors.
	// Setting busy_timeout to 5000ms tells SQLite to wait up to 5 seconds
	// for a write lock instead of failing immediately.
	app.OnServe().BindFunc(func(e *core.ServeEvent) error {
		_, err := app.DB().NewQuery("PRAGMA busy_timeout = 5000").Execute()
		if err != nil {
			log.Printf("[sqlite] WARNING: failed to set busy_timeout: %v", err)
		} else {
			log.Println("[sqlite] busy_timeout set to 5000ms")
		}

		// Verify WAL mode is active (PocketBase default, but worth confirming)
		var journalMode string
		app.DB().NewQuery("PRAGMA journal_mode").Row(&journalMode)
		log.Printf("[sqlite] journal_mode = %s", journalMode)

		return e.Next()
	})

	// Intercept all system emails and send via Resend HTTP API (bypasses SMTP entirely)
	const users = "users"

	// ── Verification email ──────────────────────────────────────────────
	app.OnMailerRecordVerificationSend(users).BindFunc(func(e *core.MailerRecordEvent) error {
		to := e.Record.GetString("email")
		log.Printf("[resend] verification email → %s", to)

		token, _ := e.Meta["token"].(string)
		if frontendURL == "" || token == "" {
			return sendResendMail(to, e.Message.Subject, e.Message.HTML)
		}

		actionURL := frontendURL + "/auth/verify?token=" + token
		html := verificationEmailHTML(actionURL)
		return sendResendMail(to, "Verify your email — PagePerfect", html)
	})

	// ── Password reset email ────────────────────────────────────────────
	app.OnMailerRecordPasswordResetSend(users).BindFunc(func(e *core.MailerRecordEvent) error {
		to := e.Record.GetString("email")
		log.Printf("[resend] password reset email → %s", to)

		token, _ := e.Meta["token"].(string)
		if frontendURL == "" || token == "" {
			return sendResendMail(to, e.Message.Subject, e.Message.HTML)
		}

		actionURL := frontendURL + "/auth/reset-password?token=" + token
		html := passwordResetEmailHTML(actionURL)
		return sendResendMail(to, "Reset your password — PagePerfect", html)
	})

	// ── Email change email ──────────────────────────────────────────────
	app.OnMailerRecordEmailChangeSend(users).BindFunc(func(e *core.MailerRecordEvent) error {
		to := e.Record.GetString("email")
		log.Printf("[resend] email change → %s", to)

		token, _ := e.Meta["token"].(string)
		if frontendURL == "" || token == "" {
			return sendResendMail(to, e.Message.Subject, e.Message.HTML)
		}

		actionURL := frontendURL + "/auth/verify?token=" + token + "&type=email-change"
		html := emailChangeHTML(actionURL)
		return sendResendMail(to, "Confirm email change — PagePerfect", html)
	})

	// ── OTP email ───────────────────────────────────────────────────────
	app.OnMailerRecordOTPSend(users).BindFunc(func(e *core.MailerRecordEvent) error {
		to := e.Record.GetString("email")
		log.Printf("[resend] OTP email → %s", to)

		otp, _ := e.Meta["otp"].(string)
		if otp == "" {
			return sendResendMail(to, e.Message.Subject, e.Message.HTML)
		}

		html := otpEmailHTML(otp)
		return sendResendMail(to, "Your login code — PagePerfect", html)
	})

	// ── Auth alert email ────────────────────────────────────────────────
	app.OnMailerRecordAuthAlertSend(users).BindFunc(func(e *core.MailerRecordEvent) error {
		to := e.Record.GetString("email")
		log.Printf("[resend] auth alert email → %s", to)

		html := authAlertEmailHTML()
		return sendResendMail(to, "New sign-in detected — PagePerfect", html)
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
