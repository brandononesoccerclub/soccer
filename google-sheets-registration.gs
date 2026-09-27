const SPREADSHEET_ID = '1OPWUFxXGSBH6UKhW7CFocCoiwnOd0xtNXhquDoBWHJc';
const REGISTRATION_SHEET_NAME = 'Registrations';
const YOUTH_TEAMS = ['u8', 'u10', 'u12', 'u14'];

function doGet() {
  try {
    SpreadsheetApp.openById(SPREADSHEET_ID);
    return HtmlService.createHtmlOutput(
      'Web app is deployed and can access the registration spreadsheet. Submit the website form to add a registration.'
    ).setTitle('Registration connection check');
  } catch (error) {
    console.error(error);
    return HtmlService.createHtmlOutput(
      'The web app is running, but it could not access the spreadsheet. Check the spreadsheet ID and deployment account permissions.'
    ).setTitle('Registration connection check failed');
  }
}

function doPost(event) {
  try {
    const fields = event && event.parameter ? event.parameter : {};
    if (fields.website) {
      return registrationResult_(true);
    }

    const playerName = cleanText_(fields.playerName, 120);
    const age = Number(fields.age);
    const guardianName = cleanText_(fields.guardianName, 120);
    const email = cleanText_(fields.email, 254);
    const phone = cleanText_(fields.phone, 40);
    const team = cleanText_(fields.team, 10).toLowerCase();
    const comments = cleanText_(fields.comments, 2000);
    const validTeamAge = team === 'over21'
      ? age >= 22 && age <= 120
      : team === 'ages19to21'
        ? age >= 19 && age <= 21
        : YOUTH_TEAMS.includes(team) && age >= 4 && age <= 18;

    if (!playerName || !Number.isInteger(age) || !validTeamAge
      || !guardianName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      || phone.length < 7) {
      return registrationResult_(false);
    }

    if (!SPREADSHEET_ID || SPREADSHEET_ID.startsWith('PASTE_')) {
      throw new Error('Set the spreadsheet ID before deploying this script.');
    }

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(REGISTRATION_SHEET_NAME)
      || spreadsheet.insertSheet(REGISTRATION_SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Submitted At', 'Player Name', 'Age', 'Parent/Guardian Name',
        'Email', 'Phone', 'Team', 'Comments'
      ]);
    }

    sheet.appendRow([
      new Date(),
      safeCell_(playerName),
      age,
      safeCell_(guardianName),
      safeCell_(email),
      safeCell_(phone),
      team === 'over21'
        ? 'Over 21 years'
        : team === 'ages19to21' ? 'Ages 19–21' : team.toUpperCase(),
      safeCell_(comments)
    ]);

    return registrationResult_(true);
  } catch (error) {
    console.error(error);
    return registrationResult_(false);
  }
}

function cleanText_(value, maximumLength) {
  return String(value || '').trim().slice(0, maximumLength);
}

function safeCell_(value) {
  return /^[=+@\-]/.test(value) ? `'${value}` : value;
}

function registrationResult_(success) {
  const heading = success ? 'Registration received' : 'Registration not submitted';
  const message = success
    ? 'Thank you. Your registration details have been sent to the club.'
    : 'We could not submit your registration. Please return to the form and try again.';
  const color = success ? '#176b3a' : '#a32121';

  return HtmlService.createHtmlOutput(
    '<!doctype html><html lang="en"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1">'
    + `<title>${heading}</title><style>`
    + 'body{margin:0;padding:2rem;font:16px/1.5 Arial,sans-serif;color:#1f1f1f}'
    + 'main{max-width:36rem;margin:4rem auto}h1{font-size:1.6rem}'
    + `h1{color:${color}}a{color:#0d47d6}</style></head><body><main>`
    + `<h1>${heading}</h1><p>${message}</p>`
    + '<p><a href="javascript:history.back()">Return to the registration form</a></p>'
    + '</main></body></html>'
  ).setTitle(heading);
}