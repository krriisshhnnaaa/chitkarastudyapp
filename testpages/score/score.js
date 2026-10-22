// Chitkara University Score & Evaluation Controller

// Embedded Answer Keys (Tests 1 through 5)
const ANSWER_KEYS = {
  1: {"question 1": "B", "question 2": "C", "question 3": "A", "question 4": "B", "question 5": "B", "question 6": "C", "question 7": "B", "question 8": "A", "question 9": "B", "question 10": "A", "question 11": "A", "question 12": "D", "question 13": "B", "question 14": "C", "question 15": "A", "question 16": "B", "question 17": "B", "question 18": "A", "question 19": "C", "question 20": "A", "question 21": "B", "question 22": "B", "question 23": "C", "question 24": "B", "question 25": "B", "question 26": "A"},
  2: {"question 1": "A", "question 2": "A", "question 3": "A", "question 4": "A", "question 5": "A", "question 6": "B", "question 7": "A", "question 8": "A", "question 9": "A", "question 10": "A", "question 11": "A", "question 12": "A", "question 13": "A", "question 14": "A", "question 15": "A", "question 16": "A", "question 17": "B", "question 18": "B", "question 19": "A", "question 20": "A", "question 21": "A", "question 22": "A", "question 23": "A", "question 24": "A", "question 25": "A", "question 26": "A"},
  3: {"question 1": "A", "question 2": "A", "question 3": "B", "question 4": "B", "question 5": "A", "question 6": "B", "question 7": "A", "question 8": "A", "question 9": "A", "question 10": "A", "question 11": "A", "question 12": "A", "question 13": "A", "question 14": "A", "question 15": "A", "question 16": "A", "question 17": "A", "question 18": "A", "question 19": "A", "question 20": "A", "question 21": "A", "question 22": "A", "question 23": "A", "question 24": "A", "question 25": "A", "question 26": "A"},
  4: {"question 1": "A", "question 2": "A", "question 3": "A", "question 4": "A", "question 5": "A", "question 6": "A", "question 7": "A", "question 8": "A", "question 9": "A", "question 10": "A", "question 11": "A", "question 12": "A", "question 13": "A", "question 14": "A", "question 15": "A", "question 16": "A", "question 17": "A", "question 18": "A", "question 19": "A", "question 20": "A", "question 21": "A", "question 22": "A", "question 23": "B", "question 24": "A", "question 25": "B", "question 26": "B"},
  5: {"question 1": "B", "question 2": "B", "question 3": "A", "question 4": "B", "question 5": "A", "question 6": "A", "question 7": "B", "question 8": "B", "question 9": "A", "question 10": "B", "question 11": "C", "question 12": "B", "question 13": "C", "question 14": "C", "question 15": "A", "question 16": "A", "question 17": "C", "question 18": "B", "question 19": "B", "question 20": "A", "question 21": "B", "question 22": "B", "question 23": "B", "question 24": "A", "question 25": "B", "question 26": "A"}
};

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const testNumber = parseInt(params.get('test') || '1', 10);
  renderScoreView(testNumber);
});

function renderScoreView(testNumber) {
  // Retrieve saved responses
  let savedPayload = JSON.parse(localStorage.getItem(`chitkara_test_${testNumber}_response`) || 'null');
  if (!savedPayload) {
    savedPayload = JSON.parse(localStorage.getItem('chitkara_latest_response') || '{}');
  }

  const responses = savedPayload.responses || {};
  const correctKeys = ANSWER_KEYS[testNumber] || ANSWER_KEYS[1];
  const totalQuestions = 26;

  let marks = 0;
  const breakdown = [];

  for (let q = 1; q <= totalQuestions; q++) {
    const key = `question ${q}`;
    const userOption = (responses[key] || "").toUpperCase();
    const correctOption = (correctKeys[key] || "").toUpperCase();

    const isCorrect = (userOption !== "" && userOption === correctOption);
    if (isCorrect) {
      marks += 1; // for every correct answer: marks += 1
    }
    // for every incorrect answer: marks unchanged

    breakdown.push({
      questionNumber: q,
      userOption: userOption || "Not Answered",
      correctOption: correctOption,
      isCorrect: isCorrect
    });
  }

  const percentage = ((marks / totalQuestions) * 100).toFixed(1);
  const isPassed = percentage >= 50.0;

  // Update Hero Card
  document.getElementById('testTitleHeading').textContent = `Introduction To Web Technologies TEST-${testNumber} Result`;
  document.getElementById('marksDisplay').innerHTML = `${marks} <span>/ ${totalQuestions}</span>`;
  document.getElementById('percentageDisplay').textContent = `${percentage}% Score`;

  const badgeEl = document.getElementById('statusBadge');
  if (isPassed) {
    badgeEl.textContent = 'Passed';
    badgeEl.className = 'score-badge badge-passed';
  } else {
    badgeEl.textContent = 'Needs Practice';
    badgeEl.className = 'score-badge badge-retry';
  }

  // Meta grid
  document.getElementById('studentNameVal').textContent = savedPayload.studentName || 'Student';
  document.getElementById('submissionTimeVal').textContent = savedPayload.timestamp ? new Date(savedPayload.timestamp).toLocaleTimeString() : 'Just now';
  document.getElementById('correctCountVal').textContent = `${marks} Correct`;
  document.getElementById('incorrectCountVal').textContent = `${totalQuestions - marks} Incorrect/Skipped`;

  // Action Buttons
  const retakeBtn = document.getElementById('retakeBtn');
  retakeBtn.href = `../test${testNumber}/test.html`;

  const nextBtn = document.getElementById('nextTestBtn');
  if (testNumber < 5) {
    nextBtn.href = `../test${testNumber + 1}/test.html`;
    nextBtn.textContent = `Proceed to TEST-${testNumber + 1}`;
  } else {
    nextBtn.href = '../../landingpage/index.html';
    nextBtn.textContent = 'Complete & Return Home';
  }

  // Setup download button
  const downloadBtn = document.getElementById('downloadJsonBtn');
  downloadBtn.onclick = () => downloadResponseJson(testNumber, responses);

  // Render question-by-question breakdown list
  const listContainer = document.getElementById('breakdownList');
  listContainer.innerHTML = '';

  breakdown.forEach(item => {
    const card = document.createElement('div');
    card.className = `review-card ${item.isCorrect ? 'correct' : 'incorrect'}`;

    card.innerHTML = `
      <div class="review-header">
        <span class="review-qnum">question ${item.questionNumber}</span>
        <span class="review-status-tag ${item.isCorrect ? 'tag-correct' : 'tag-incorrect'}">
          ${item.isCorrect ? '✓ Correct (+1 Mark)' : '✗ Incorrect (+0)'}
        </span>
      </div>
      <div class="review-answers">
        <div class="ans-col">
          <strong>Your Response:</strong> <span style="color: ${item.isCorrect ? '#3fb950' : '#ff5252'}">(${item.userOption.toLowerCase()})</span>
        </div>
        <div class="ans-col">
          <strong>Correct Answer:</strong> <span style="color: #3fb950">(${item.correctOption.toLowerCase()})</span>
        </div>
      </div>
    `;
    listContainer.appendChild(card);
  });
}

function downloadResponseJson(testNumber, responses) {
  // Format matching the agy.info specification:
  // response.json
  // {
  //   "question 1": "B",
  //   "question 2": "C"
  // }
  const formatted = {
    testNumber: testNumber,
    responses: responses
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formatted, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", "response.json");
  document.body.appendChild(dlAnchor);
  dlAnchor.click();
  dlAnchor.remove();
}
