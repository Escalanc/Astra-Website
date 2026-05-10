import test from 'node:test';
import assert from 'node:assert/strict';

import handler from './api/contact.js';

function createRequest(body, method = 'POST') {
  const chunks = [Buffer.from(JSON.stringify(body))];

  return {
    method,
    body: undefined,
    async *[Symbol.asyncIterator]() {
      for (const chunk of chunks) {
        yield chunk;
      }
    },
  };
}

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    end(payload) {
      this.body = payload;
    },
  };
}

test('contact handler returns direct-delivery configuration error without mailto fallback', async () => {
  const previousApiKey = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;

  const req = createRequest({
    formType: 'contact',
    name: 'Avery',
    email: 'avery@example.com',
    message: 'Need help with a project.',
  });
  const res = createResponse();

  await handler(req, res);

  if (previousApiKey) {
    process.env.RESEND_API_KEY = previousApiKey;
  }

  assert.equal(res.statusCode, 503);
  const payload = JSON.parse(res.body);
  assert.equal(payload.error, 'Email delivery is not configured yet.');
  assert.equal(payload.fallbackUrl, undefined);
});
