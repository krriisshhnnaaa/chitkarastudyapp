// Student Authentication & Database Synchronization Handler
let currentMode = 'login'; // 'login' or 'signup'

// Default Seed Users (Matches database/users.json)
const DEFAULT_USERS = [
  { name: "Krishnan G", email: "krishnang@chitkara.edu.in" },
  { name: "Student", email: "student@chitkara.edu.in" },
  { name: "Test User", email: "testuser@chitkara.edu.in" }
];

document.addEventListener('DOMContentLoaded', () => {
  initDatabase();
  setupAuthForm();
});

function initDatabase() {
  const existing = localStorage.getItem('chitkara_registered_users');
  if (!existing) {
    localStorage.setItem('chitkara_registered_users', JSON.stringify(DEFAULT_USERS));
  } else {
    // Attempt to merge default users if missing
    try {
      const parsed = JSON.parse(existing);
      DEFAULT_USERS.forEach(defUser => {
        const found = parsed.some(u => u.email.toLowerCase() === defUser.email.toLowerCase());
        if (!found) parsed.push(defUser);
      });
      localStorage.setItem('chitkara_registered_users', JSON.stringify(parsed));
    } catch (e) {
      localStorage.setItem('chitkara_registered_users', JSON.stringify(DEFAULT_USERS));
    }
  }

  // Attempt to fetch latest database/users.json
  const isInsideLanding = window.location.pathname.includes('/landingpage/');
  const dbPath = isInsideLanding ? '../../database/users.json' : 'database/users.json';
  fetch(dbPath)
    .then(res => res.json())
    .then(dbUsers => {
      if (Array.isArray(dbUsers)) {
        const local = JSON.parse(localStorage.getItem('chitkara_registered_users') || '[]');
        dbUsers.forEach(u => {
          if (!local.some(l => l.email.toLowerCase() === u.email.toLowerCase())) {
            local.push({ name: u.name, email: u.email });
          }
        });
        localStorage.setItem('chitkara_registered_users', JSON.stringify(local));
      }
    })
    .catch(() => {
      // Offline / file protocol fallback
    });
}

function switchAuthMode(mode) {
  currentMode = mode;
  const tabLogin = document.getElementById('tabLogin');
  const tabSignup = document.getElementById('tabSignup');
  const formHeading = document.getElementById('formHeading');
  const formSubheading = document.getElementById('formSubheading');
  const submitBtn = document.getElementById('submitBtn');

  if (mode === 'signup') {
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
    formHeading.textContent = 'Student Sign Up';
    formSubheading.textContent = 'Create a new profile saved to the Chitkara MongoDB database';
    submitBtn.textContent = 'Sign Up & Register';
  } else {
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    formHeading.textContent = 'Student Login';
    formSubheading.textContent = 'Authenticate to access Introduction to Web Technologies practice tests';
    submitBtn.textContent = 'Log In & Continue';
  }
}

function setupAuthForm() {
  const form = document.getElementById('authForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('userName');
    const emailInput = document.getElementById('userEmail');

    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim().toLowerCase() : '';

    if (!name || !email) {
      alert('Please fill in both Name and Institutional Email.');
      return;
    }

    const users = JSON.parse(localStorage.getItem('chitkara_registered_users') || '[]');

    if (currentMode === 'signup') {
      // Check if already registered
      const alreadyExists = users.some(u => u.email.toLowerCase() === email);
      if (alreadyExists) {
        alert('An account with this email already exists. Switching to Login mode.');
        switchAuthMode('login');
        return;
      }

      // Add new student to local database
      const newUser = { name, email, registeredAt: new Date().toISOString() };
      users.push(newUser);
      localStorage.setItem('chitkara_registered_users', JSON.stringify(users));

      // Attempt backend API call to update MongoDB through login.cpp
      fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, mode: 'signup' })
      }).catch(() => {});

      alert(`Success! User "${name}" has been registered in the database.\nPlease click Log In to continue.`);
      switchAuthMode('login');

    } else {
      // Mode === 'login'
      // Compare login credentials with current database
      const matchedUser = users.find(u => 
        u.email.toLowerCase() === email && 
        u.name.toLowerCase() === name.toLowerCase()
      );

      if (!matchedUser) {
        // Not matched : pop.window : user not found
        showPopup('User not found', 'The credentials you provided do not match any registered student in the database. Please verify your Name and Email, or Sign Up to create an account.');
      } else {
        // Matched : redirect to main.html
        localStorage.setItem('chitkara_student', JSON.stringify({
          name: matchedUser.name,
          email: matchedUser.email,
          loginTime: new Date().toISOString()
        }));

        const isInsideLandingPage = window.location.pathname.includes('/landingpage/');
        window.location.href = isInsideLandingPage ? 'main.html' : 'landingpage/main.html';
      }
    }
  });
}

function showPopup(title, message) {
  const modal = document.getElementById('popupModal');
  const titleEl = document.getElementById('popupTitle');
  const msgEl = document.getElementById('popupMsg');

  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;
  if (modal) modal.classList.add('show');
}

function closePopup() {
  const modal = document.getElementById('popupModal');
  if (modal) modal.classList.remove('show');
}

// Close popup on outside click or Escape key
window.addEventListener('click', (e) => {
  const modal = document.getElementById('popupModal');
  if (e.target === modal) closePopup();
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closePopup();
});
