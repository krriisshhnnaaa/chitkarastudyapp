// Test 3 Interaction and Submission Handler
const TEST_NUMBER = 3;
const TOTAL_QUESTIONS = 26;

document.addEventListener('DOMContentLoaded', () => {
  // Restore student details if present
  const user = JSON.parse(localStorage.getItem('chitkara_student') || '{}');
  if (user.name) {
    console.log(`Test ${TEST_NUMBER} loaded for: ${user.name} (${user.email || 'No email'})`);
  }

  // Restore saved responses if any
  const savedData = JSON.parse(localStorage.getItem(`chitkara_test_${TEST_NUMBER}_progress`) || '{}');
  for (let q = 1; q <= TOTAL_QUESTIONS; q++) {
    const val = savedData[`question ${q}`];
    if (val) {
      const radio = document.querySelector(`input[name="question ${q}"][value="${val}"]`);
      if (radio) {
        radio.checked = true;
        highlightSelected(radio);
      }
    }
  }
  updateCounter();

  // Attach change listeners to all radios
  const form = document.getElementById('quizForm');
  form.addEventListener('change', (e) => {
    if (e.target && e.target.type === 'radio') {
      highlightSelected(e.target);
      saveProgress();
      updateCounter();
    }
  });
});

function highlightSelected(radio) {
  const name = radio.name;
  const labels = document.querySelectorAll(`input[name="${name}"]`);
  labels.forEach(input => {
    const parentLabel = input.closest('.option-label');
    if (parentLabel) parentLabel.classList.remove('selected');
  });
  const currentLabel = radio.closest('.option-label');
  if (currentLabel) currentLabel.classList.add('selected');

  const block = radio.closest('.question-block');
  if (block) block.classList.add('answered');
}

function saveProgress() {
  const responses = getSelectedResponses();
  localStorage.setItem(`chitkara_test_${TEST_NUMBER}_progress`, JSON.stringify(responses));
}

function updateCounter() {
  const responses = getSelectedResponses();
  const count = Object.keys(responses).length;
  const counterEl = document.getElementById('answeredCounter');
  if (counterEl) {
    counterEl.textContent = `Answered: ${count} / ${TOTAL_QUESTIONS}`;
  }
}

function getSelectedResponses() {
  const form = document.getElementById('quizForm');
  const formData = new FormData(form);
  const responses = {};
  for (let q = 1; q <= TOTAL_QUESTIONS; q++) {
    const key = `question ${q}`;
    const val = formData.get(key);
    if (val) {
      responses[key] = val;
    }
  }
  return responses;
}

function submitTest() {
  const responses = getSelectedResponses();
  const answeredCount = Object.keys(responses).length;

  if (answeredCount < TOTAL_QUESTIONS) {
    const proceed = confirm(`You have answered ${answeredCount} out of ${TOTAL_QUESTIONS} questions. Are you sure you want to submit?`);
    if (!proceed) return;
  } else {
    const proceed = confirm(`Are you ready to submit TEST-${TEST_NUMBER}?`);
    if (!proceed) return;
  }

  const user = JSON.parse(localStorage.getItem('chitkara_student') || '{}');
  
  const formattedResponses = {};
  for (let q = 1; q <= TOTAL_QUESTIONS; q++) {
    const key = `question ${q}`;
    formattedResponses[key] = responses[key] || "";
  }

  const payload = {
    testNumber: TEST_NUMBER,
    studentName: user.name || "Student",
    studentEmail: user.email || "",
    timestamp: new Date().toISOString(),
    responses: formattedResponses
  };

  // Store globally so the score page can calculate and present results immediately
  localStorage.setItem('chitkara_latest_response', JSON.stringify(payload));
  localStorage.setItem(`chitkara_test_${TEST_NUMBER}_response`, JSON.stringify(payload));

  // Try submitting to backend endpoint if running a backend server
  fetch('/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => {
    // Static fallback
  }).finally(() => {
    // Navigate to score page
    window.location.href = '../score/score.html?test=' + TEST_NUMBER;
  });
}
