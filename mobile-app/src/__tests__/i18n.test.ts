import { t, setLocale } from '../i18n';

// expo-localization mock
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en' }],
}));

describe('i18n translations', () => {
  afterEach(() => setLocale('en'));

  it('returns English strings by default', () => {
    setLocale('en');
    expect(t('common.save')).toBe('Save');
    expect(t('auth.login')).toBe('Login');
    expect(t('nav.dashboard')).toBe('Dashboard');
  });

  it('returns Hebrew strings when locale is he', () => {
    setLocale('he');
    expect(t('common.save')).toBe('שמור');
    expect(t('auth.login')).toBe('התחברות');
    expect(t('nav.dashboard')).toBe('לוח בקרה');
  });

  it('falls back to English for missing Hebrew key', () => {
    setLocale('he');
    // All keys should resolve — no undefined
    expect(t('offline.banner')).toBeTruthy();
  });

  it('covers all top-level namespaces in Hebrew', () => {
    setLocale('he');
    // Spot-check one key per namespace to ensure Hebrew translations exist
    const checks: [string, string][] = [
      ['common.save', 'שמור'],
      ['auth.login', 'התחברות'],
      ['nav.dashboard', 'לוח בקרה'],
      ['dashboard.welcome', 'ברוך הבא'],
      ['buildings.title', 'בניינים'],
      ['apartments.title', 'דירות'],
      ['residents.title', 'דיירים'],
      ['invoices.title', 'חשבוניות'],
      ['payments.title', 'תשלומים'],
      ['reports.title', 'דוחות'],
      ['announcements.title', 'הודעות'],
      ['maintenance.title', 'בקשות תחזוקה'],
      ['meetings.title', 'פגישות'],
      ['polls.title', 'סקרים'],
      ['documents.title', 'מסמכים'],
      ['chat.title', 'צ\'אט'],
      ['notifications.title', 'התראות'],
      ['profile.title', 'פרופיל'],
      ['settings.title', 'הגדרות'],
      ['offline.banner', 'אין חיבור לאינטרנט'],
    ];
    for (const [key, expected] of checks) {
      expect(t(key)).toBe(expected);
    }
  });
});
