import type { Meeting } from '@horizon-hcm/shared/src/types/meeting';

/**
 * Generate iCalendar (.ics) file content for a meeting
 */
export function generateICalendar(meeting: Meeting): string {
  const startDate = new Date(meeting.date);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const escapeText = (text: string): string => {
    return text.replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n');
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Horizon HCM//Meeting//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${meeting.id}@horizon-hcm.com`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:${escapeText(meeting.title)}`,
    `DESCRIPTION:${escapeText(meeting.agenda || '')}`,
    `LOCATION:${escapeText(meeting.location)}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return icsContent;
}

/**
 * Download iCalendar file
 */
export function downloadICalendar(meeting: Meeting): void {
  const icsContent = generateICalendar(meeting);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `meeting-${meeting.id}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate Google Calendar URL
 */
export function getGoogleCalendarUrl(meeting: Meeting): string {
  const startDate = new Date(meeting.date);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const formatGoogleDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: meeting.title,
    dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
    details: meeting.agenda || '',
    location: meeting.location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Calendar URL
 */
export function getOutlookCalendarUrl(meeting: Meeting): string {
  const startDate = new Date(meeting.date);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const formatOutlookDate = (date: Date): string => {
    return date.toISOString();
  };

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: meeting.title,
    startdt: formatOutlookDate(startDate),
    enddt: formatOutlookDate(endDate),
    body: meeting.agenda || '',
    location: meeting.location,
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Open calendar integration menu
 */
export function addToCalendar(
  meeting: Meeting,
  provider: 'google' | 'outlook' | 'apple' | 'download'
): void {
  switch (provider) {
    case 'google':
      window.open(getGoogleCalendarUrl(meeting), '_blank');
      break;
    case 'outlook':
      window.open(getOutlookCalendarUrl(meeting), '_blank');
      break;
    case 'apple':
    case 'download':
      downloadICalendar(meeting);
      break;
  }
}
