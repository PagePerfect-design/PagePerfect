package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

var resendAPIKey = os.Getenv("RESEND_API_KEY")
var resendFrom = os.Getenv("RESEND_FROM")

func sendResendMail(to string, subject string, htmlBody string) error {
	url := "https://api.resend.com/emails"
	payload := map[string]interface{}{
		"from":    resendFrom,
		"to":      []string{to},
		"subject": subject,
		"html":    htmlBody,
	}
	bodyBytes, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(bodyBytes))
	req.Header.Set("Authorization", "Bearer "+resendAPIKey)
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return fmt.Errorf("resend error status: %d", resp.StatusCode)
	}
	return nil
}

func main() {
	app := pocketbase.New()

	// Send all system emails via Resend (v0.36 API: collection-scoped hooks, e.Message)
	const users = "users"

	app.OnMailerRecordVerificationSend(users).BindFunc(func(e *core.MailerRecordEvent) error {
		to := e.Record.GetString("email")
		return sendResendMail(to, e.Message.Subject, e.Message.HTML)
	})

	app.OnMailerRecordPasswordResetSend(users).BindFunc(func(e *core.MailerRecordEvent) error {
		to := e.Record.GetString("email")
		return sendResendMail(to, e.Message.Subject, e.Message.HTML)
	})

	app.OnMailerRecordEmailChangeSend(users).BindFunc(func(e *core.MailerRecordEvent) error {
		to := e.Record.GetString("email")
		return sendResendMail(to, e.Message.Subject, e.Message.HTML)
	})

	app.OnMailerRecordOTPSend(users).BindFunc(func(e *core.MailerRecordEvent) error {
		to := e.Record.GetString("email")
		return sendResendMail(to, e.Message.Subject, e.Message.HTML)
	})

	app.OnMailerRecordAuthAlertSend(users).BindFunc(func(e *core.MailerRecordEvent) error {
		to := e.Record.GetString("email")
		return sendResendMail(to, e.Message.Subject, e.Message.HTML)
	})

	app.Start()
}
