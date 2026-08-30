import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

logger = logging.getLogger(__name__)

def send_otp_email(to_email: str, otp: str) -> bool:
    """
    Sends an OTP email for password reset.
    If SMTP credentials are not configured in environment variables,
    it falls back to logging the OTP to the console.
    """
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM_EMAIL", smtp_user or "noreply@morphacademy.com")

    subject = "Morph Academy - Password Reset OTP"
    body_text = f"Your OTP for resetting your password is: {otp}\n\nThis OTP is valid for 15 minutes. If you did not request this, please ignore this email."
    
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
        <div style="max-width: 500px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <h2 style="color: #2c3e50; text-align: center;">Morph Academy</h2>
          <hr style="border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 16px; color: #333;">Hello,</p>
          <p style="font-size: 16px; color: #333;">You requested to reset your password. Use the OTP code below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2563eb; background: #eff6ff; padding: 10px 25px; border-radius: 6px; border: 1px dashed #2563eb;">{otp}</span>
          </div>
          <p style="font-size: 14px; color: #666;">This OTP is valid for <strong>15 minutes</strong>. If you did not request a password reset, please ignore this email.</p>
        </div>
      </body>
    </html>
    """

    if not smtp_user or not smtp_password:
        print("\n=======================================================")
        print(f"[OTP MAIL SIMULATION] To: {to_email} | OTP: {otp}")
        print("=======================================================\n")
        logger.info(f"SMTP not configured. OTP for {to_email} is {otp}")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = smtp_from
        msg["To"] = to_email

        part1 = MIMEText(body_text, "plain")
        part2 = MIMEText(html_content, "html")
        msg.attach(part1)
        msg.attach(part2)

        server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_from, [to_email], msg.as_string())
        server.quit()
        logger.info(f"OTP email sent successfully to {to_email}")
        return True
    except Exception as e:
        print("\n=======================================================")
        print(f"[OTP MAIL FALLBACK - SMTP Error: {e}] To: {to_email} | OTP: {otp}")
        print("=======================================================\n")
        logger.error(f"Failed to send email via SMTP to {to_email}: {e}")
        return False
