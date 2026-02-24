const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding notification templates...');

  const templates = [
    {
      id: require('crypto').randomUUID(),
      name: 'new_poll',
      title: 'New Poll',
      body: '{{pollTitle}} - Vote by {{endDate}}',
      language: 'en',
      is_active: true,
      updated_at: new Date(),
    },
    {
      id: require('crypto').randomUUID(),
      name: 'new_message',
      title: 'New Message',
      body: '{{senderName}}: {{messagePreview}}',
      language: 'en',
      is_active: true,
      updated_at: new Date(),
    },
    {
      id: require('crypto').randomUUID(),
      name: 'new_invoice',
      title: 'New Invoice',
      body: 'Invoice {{invoiceNumber}} for {{amount}} - Due {{dueDate}}',
      language: 'en',
      is_active: true,
      updated_at: new Date(),
    },
  ];

  for (const template of templates) {
    try {
      const existing = await prisma.notification_templates.findUnique({
        where: { name: template.name },
      });

      if (existing) {
        console.log(`✓ Template "${template.name}" already exists`);
      } else {
        await prisma.notification_templates.create({
          data: template,
        });
        console.log(`✓ Created template "${template.name}"`);
      }
    } catch (error) {
      console.error(`✗ Error creating template "${template.name}":`, error.message);
    }
  }

  console.log('\nDone!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
