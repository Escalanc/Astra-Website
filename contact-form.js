const FORM_TYPE_LABELS = {
  contact: 'Contact',
  launch: 'Launch Plan',
  orbit: 'Orbit Plan',
  galaxy: 'Galaxy Plan',
  'custom-software': 'Custom Software',
};

export function validateInquiryPayload(payload = {}) {
  const data = {
    formType: typeof payload.formType === 'string' ? payload.formType.trim().toLowerCase() : 'contact',
    name: typeof payload.name === 'string' ? payload.name.trim() : '',
    email: typeof payload.email === 'string' ? payload.email.trim() : '',
    company: typeof payload.company === 'string' ? payload.company.trim() : '',
    message: typeof payload.message === 'string' ? payload.message.trim() : '',
  };

  if (!FORM_TYPE_LABELS[data.formType]) {
    data.formType = 'contact';
  }

  const errors = {};

  if (!data.name) {
    errors.name = 'Name is required.';
  }

  if (!data.email) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!data.message) {
    errors.message = 'Message is required.';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, data };
}

export function buildInquiryEmail(data) {
  const label = FORM_TYPE_LABELS[data.formType] || FORM_TYPE_LABELS.contact;

  return {
    subject: `[Astra ${label}] New inquiry from ${data.name}`,
    text: [
      `Inquiry Type: ${label}`,
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      `Company: ${data.company || 'Not provided'}`,
      '',
      'Message:',
      data.message,
    ].join('\n'),
  };
}
