/**
 * Integracja z Google Calendar API
 * Wymaga skonfigurowania zmiennych środowiskowych:
 * - GOOGLE_CALENDAR_CLIENT_EMAIL: Email serwisu z Google Cloud Console
 * - GOOGLE_CALENDAR_PRIVATE_KEY: Klucz prywatny (bez cudzysłowów i nowych linii)
 * - GOOGLE_CALENDAR_ID: ID kalendarza do którego dodajemy wydarzenia (lub 'primary')
 */

interface CalendarEvent {
  summary: string;
  description?: string;
  start: {
    date: string; // YYYY-MM-DD format
    timeZone?: string;
  };
  end: {
    date: string; // YYYY-MM-DD format (włącznie z tym dniem, więc dodajemy 1 dzień)
    timeZone?: string;
  };
}

/**
 * Tworzy wydarzenie w Google Calendar
 */
export async function createCalendarEvent(
  startDate: string,
  endDate: string,
  employeeEmail: string,
  employeeName?: string,
  description?: string
): Promise<string | null> {
  try {
    const clientEmail = process.env.GOOGLE_CALENDAR_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_CALENDAR_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    if (!clientEmail || !privateKey) {
      console.error('Google Calendar credentials not configured');
      return null;
    }

    // Formatuj daty - dodaj 1 dzień do endDate bo Google Calendar używa daty wyłącznej
    const endDateExclusive = new Date(endDate);
    endDateExclusive.setDate(endDateExclusive.getDate() + 1);
    const endDateStr = endDateExclusive.toISOString().split('T')[0];

    const event: CalendarEvent = {
      summary: `Urlop - ${employeeName || employeeEmail}`,
      description: description || `Urlop pracownika: ${employeeName || employeeEmail}`,
      start: {
        date: startDate,
        timeZone: 'Europe/Warsaw',
      },
      end: {
        date: endDateStr,
        timeZone: 'Europe/Warsaw',
      },
    };

    // Pobierz token JWT
    const jwt = await getAccessToken(clientEmail, privateKey);

    // Utwórz wydarzenie
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error creating calendar event:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    return data.id || null;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return null;
  }
}

/**
 * Usuwa wydarzenie z Google Calendar
 */
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  try {
    const clientEmail = process.env.GOOGLE_CALENDAR_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_CALENDAR_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    if (!clientEmail || !privateKey || !eventId) {
      console.error('Google Calendar credentials not configured or eventId missing');
      return false;
    }

    // Pobierz token JWT
    const jwt = await getAccessToken(clientEmail, privateKey);

    // Usuń wydarzenie
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${jwt}`,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text();
      console.error('Error deleting calendar event:', response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return false;
  }
}

/**
 * Pobiera token dostępu JWT dla Google Calendar API
 */
async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  // Dynamiczny import jsonwebtoken dla kompatybilności z Next.js
  const jwt = await import('jsonwebtoken').then(m => m.default);

  const now = Math.floor(Date.now() / 1000);
  const token = jwt.sign(
    {
      iss: clientEmail,
      sub: clientEmail,
      aud: 'https://www.googleapis.com/oauth2/v4/token',
      exp: now + 3600, // Token ważny przez 1 godzinę
      iat: now,
      scope: 'https://www.googleapis.com/auth/calendar',
    },
    privateKey,
    { algorithm: 'RS256' }
  );

  // Wymień token na access token
  const response = await fetch('https://www.googleapis.com/oauth2/v4/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: token,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get access token: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}
