package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

var resendAPIKey = os.Getenv("RESEND_API_KEY")
var resendFrom = os.Getenv("RESEND_FROM")

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

func main() {
	app := pocketbase.New()

	// Log Resend config on startup
	if resendAPIKey == "" || resendFrom == "" {
		log.Println("[resend] WARNING: RESEND_API_KEY or RESEND_FROM not set — emails will fail")
	} else {
		log.Printf("[resend] Email hooks active, sending from %s via Resend HTTP API", resendFrom)
	}

	// Intercept all system emails and send via Resend HTTP API (bypasses SMTP entirely)
	const users = "users"

	app.OnMailerRecordVerificationSend(users).BindFunc(func(e *core.MailerRecordEvent) error {
		to := e.Record.GetString("email")
		log.Printf("[resend] verification email → %s", to)
		return sendResendMail(to, e.Message.Subject, e.Message.HTML)
	})

	app.OnMailerRecordPasswordResetSend(users).BindFunc(func(e *core.MailerRecordEvent) error {
		to := e.Record.GetString("email")
		log.Printf("[resend] password reset email → %s", to)
		return sendResendMail(to, e.Message.Subject, e.Message.HTML)
	})

	app.OnMailerRecordEmailChangeSend(users).BindFunc(func(e *core.MailerRecordEvent) error {
		to := e.Record.GetString("email")
		log.Printf("[resend] email change → %s", to)
		return sendResendMail(to, e.Message.Subject, e.Message.HTML)
	})

	app.OnMailerRecordOTPSend(users).BindFunc(func(e *core.MailerRecordEvent) error {
		to := e.Record.GetString("email")
		log.Printf("[resend] OTP email → %s", to)
		return sendResendMail(to, e.Message.Subject, e.Message.HTML)
	})

	app.OnMailerRecordAuthAlertSend(users).BindFunc(func(e *core.MailerRecordEvent) error {
		to := e.Record.GetString("email")
		log.Printf("[resend] auth alert email → %s", to)
		return sendResendMail(to, e.Message.Subject, e.Message.HTML)
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
