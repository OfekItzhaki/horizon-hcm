-- Add notification templates for polls, messages, and invoices
INSERT INTO notification_templates (id, name, title, body, language, is_active, created_at, updated_at)
VALUES 
  (
    gen_random_uuid()::text,
    'new_poll',
    'New Poll',
    '{{pollTitle}} - Vote by {{endDate}}',
    'en',
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid()::text,
    'new_message',
    'New Message',
    '{{senderName}}: {{messagePreview}}',
    'en',
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid()::text,
    'new_invoice',
    'New Invoice',
    'Invoice {{invoiceNumber}} for {{amount}} - Due {{dueDate}}',
    'en',
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (name) DO NOTHING;
