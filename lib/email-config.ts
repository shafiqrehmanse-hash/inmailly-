export function getEmailFrom() {
  return process.env.EMAIL_FROM || "InMailly <notifications@inmailly.com>";
}

export function getNotifyEmail() {
  return process.env.NOTIFY_EMAIL || "hello@inmailly.com";
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}
