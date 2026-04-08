import twilio from "twilio";

function getClient() {
  const sid = process.env["TWILIO_ACCOUNT_SID"];
  const token = process.env["TWILIO_AUTH_TOKEN"];
  if (!sid || !token) throw new Error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set");
  return twilio(sid, token);
}

function getFromNumber() {
  const from = process.env["TWILIO_PHONE_NUMBER"];
  if (!from) throw new Error("TWILIO_PHONE_NUMBER must be set");
  return from;
}

export async function sendSmsAlert({
  to,
  message,
}: {
  to: string;
  message: string;
}): Promise<void> {
  const client = getClient();
  await client.messages.create({ from: getFromNumber(), to, body: message });
}

export async function sendWhatsAppAlert({
  to,
  message,
}: {
  to: string;
  message: string;
}): Promise<void> {
  const client = getClient();
  const from = `whatsapp:${getFromNumber()}`;
  const toWhatsapp = `whatsapp:${to}`;
  await client.messages.create({ from, to: toWhatsapp, body: message });
}
