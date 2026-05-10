import test from 'node:test';
import assert from 'node:assert/strict';

import { buildInquiryEmail, validateInquiryPayload } from './contact-form.js';

test('validateInquiryPayload requires core contact fields', () => {
  const result = validateInquiryPayload({
    formType: 'contact',
    name: '',
    email: '',
    message: '',
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.errors, {
    name: 'Name is required.',
    email: 'Email is required.',
    message: 'Message is required.',
  });
});

test('validateInquiryPayload accepts known pricing form types', () => {
  const result = validateInquiryPayload({
    formType: 'galaxy',
    name: 'Avery',
    email: 'avery@example.com',
    message: 'Need a custom platform.',
    company: 'North Star',
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.formType, 'galaxy');
  assert.equal(result.data.company, 'North Star');
});

test('buildInquiryEmail creates a distinct subject for each inquiry type', () => {
  const email = buildInquiryEmail({
    formType: 'custom-software',
    name: 'Avery',
    email: 'avery@example.com',
    company: 'North Star',
    message: 'Need a custom platform.',
  });

  assert.equal(email.subject, '[Astra Custom Software] New inquiry from Avery');
  assert.match(email.text, /Inquiry Type: Custom Software/);
  assert.match(email.text, /Company: North Star/);
  assert.match(email.text, /Message:\s+Need a custom platform\./);
});
