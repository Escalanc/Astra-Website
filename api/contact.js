import { buildInquiryEmail, validateInquiryPayload } from '../contact-form.js';

const RESEND_API_URL = 'https://api.resend.com/emails';

async function sendWithResend(email, toEmail) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return {
      ok: false,
      status: 503,
      code: 'missing_api_key',
      message: 'Email delivery is not configured yet.',
    };
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.ASTRA_FROM_EMAIL || 'Astra Website <onboarding@resend.dev>',
      to: [toEmail],
      reply_to: email.replyTo,
      subject: email.subject,
      text: email.text,
    }),
  });

  if (!response.ok) {
    const details = await response.text();

    return {
      ok: false,
      status: response.status,
      code: 'resend_failed',
      message: details || 'Email delivery failed.',
    };
  }

  return { ok: true };
}

async function parseRequestBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');

  return rawBody ? JSON.parse(rawBody) : {};
}

function setJson(res, statusCode) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    setJson(res, 405);
    res.end(JSON.stringify({ error: 'Method not allowed.' }));
    return;
  }

  let payload;

  try {
    payload = await parseRequestBody(req);
  } catch {
    setJson(res, 400);
    res.end(JSON.stringify({ error: 'Invalid JSON payload.' }));
    return;
  }

  const validation = validateInquiryPayload(payload);

  if (!validation.ok) {
    setJson(res, 400);
    res.end(JSON.stringify({ error: 'Validation failed.', fields: validation.errors }));
    return;
  }

  const toEmail = process.env.ASTRA_CONTACT_EMAIL || 'hello@buildwithastra.dev';
  const email = buildInquiryEmail(validation.data);
  let delivery;

  try {
    delivery = await sendWithResend(
      {
        ...email,
        replyTo: validation.data.email,
      },
      toEmail,
    );
  } catch {
    delivery = {
      ok: false,
      status: 502,
      message: 'Email delivery is temporarily unavailable.',
    };
  }

  if (!delivery.ok) {
    setJson(res, delivery.status);
    res.end(
      JSON.stringify({
        error: delivery.message,
      }),
    );
    return;
  }

  setJson(res, 200);
  res.end(JSON.stringify({ ok: true }));
}
