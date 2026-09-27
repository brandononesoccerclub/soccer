const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxzTcXkQB5e6yu6PJnfex1JqF4B5GQsTTB7JSmx7ffPy0-PjY49WkVB-mKlV1InPjun/exec';
const registrationForm = document.getElementById('registration-form');
const registrationSubmit = document.getElementById('registration-submit');
const registrationStatus = document.getElementById('registration-submit-status');
const teamSelect = document.getElementById('team-select');
const ageInput = document.getElementById('player-age');
const endpointIsConfigured = GOOGLE_APPS_SCRIPT_URL.startsWith('https://script.google.com/macros/s/')
  && GOOGLE_APPS_SCRIPT_URL.endsWith('/exec');
const submittedFlag = 'registrationSubmissionStarted';

function updateAgeRange() {
  if (!teamSelect || !ageInput) {
    return;
  }

  const ageRange = {
    ages19to21: ['19', '21'],
    over21: ['22', '120']
  }[teamSelect.value] || ['4', '18'];
  ageInput.min = ageRange[0];
  ageInput.max = ageRange[1];

  if (ageInput.value && !ageInput.checkValidity()) {
    ageInput.value = '';
  }
}

if (teamSelect && ageInput) {
  teamSelect.addEventListener('change', updateAgeRange);
}

if (registrationForm && registrationSubmit && registrationStatus && endpointIsConfigured) {
  registrationForm.action = GOOGLE_APPS_SCRIPT_URL;
  registrationSubmit.disabled = false;
  registrationStatus.textContent = 'Your registration details will be sent to the club registration sheet.';

  registrationForm.addEventListener('submit', () => {
    sessionStorage.setItem(submittedFlag, 'true');
    registrationSubmit.disabled = true;
    registrationSubmit.textContent = 'Submitting...';
    registrationStatus.textContent = 'Submitting your registration. Please wait.';
  });

  window.addEventListener('pageshow', () => {
    if (sessionStorage.getItem(submittedFlag) !== 'true') {
      return;
    }

    sessionStorage.removeItem(submittedFlag);
    registrationForm.reset();
    registrationSubmit.disabled = false;
    registrationSubmit.textContent = 'Submit Registration';
    registrationStatus.textContent = 'Your registration details will be sent to the club registration sheet.';
    updateAgeRange();
  });
}