
const questionsPerPage = 6; // Number of questions to display per page
let currentPage = 1;
let filteredQuestions = []; // To store questions after search/filter

function toggleSolution(questionId) {
  const solutionDiv = document.getElementById(`solution-${questionId}`);
  const toggleButton = document.getElementById(`toggle-button-${questionId}`);
  if (solutionDiv.style.display === "none" || solutionDiv.style.display === "") {
    solutionDiv.style.display = "block";
    toggleButton.textContent = "Hide Solution";
  } else {
    solutionDiv.style.display = "none";
    toggleButton.textContent = "Show Solution";
  }
  if (window.MathJax) MathJax.typesetPromise(solutionDiv); // Typeset MathJax if content becomes visible
}

function populateFilters() {
  const classes = [...new Set(questions.map(q => q.class))].sort();
  const subjects = [...new Set(questions.map(q => q.subject))].sort();
  const topics = [...new Set(questions.map(q => q.topic))].sort();
  const years = [...new Set(questions.map(q => q.year))].sort();
  const types = [...new Set(questions.map(q => q.type))].sort();

  const classFilter = document.getElementById('class-filter');
  const subjectFilter = document.getElementById('subject-filter');
  const topicFilter = document.getElementById('topic-filter');
  const yearFilter = document.getElementById('year-filter');
  const typeFilter = document.getElementById('type-filter');

  classes.forEach(c => {
    const option = document.createElement('option');
    option.value = c;
    option.textContent = c;
    classFilter.appendChild(option);
  });

  subjects.forEach(s => {
    const option = document.createElement('option');
    option.value = s;
    option.textContent = s;
    subjectFilter.appendChild(option);
  });

  topics.forEach(t => {
    const option = document.createElement('option');
    option.value = t;
    option.textContent = t;
    topicFilter.appendChild(option);
  });

  years.forEach(y => {
    const option = document.createElement('option');
    option.value = y;
    option.textContent = y;
    yearFilter.appendChild(option);
  });

  types.forEach(ty => {
    const option = document.createElement('option');
    option.value = ty;
    option.textContent = ty;
    typeFilter.appendChild(option);
  });
}


function renderSolutions() {
  const solutionList = document.getElementById("solution-list");
  solutionList.innerHTML = "";

  const startIndex = (currentPage - 1) * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex);

  if (paginatedQuestions.length === 0) {
    solutionList.textContent = "No questions found matching your search.";
    return;
  }

  paginatedQuestions.forEach((q) => {
    const div = document.createElement("div");
    div.className = "question-item";
    let optionsHtml = '';
    if (q.type === "mcq" && q.options) {
      optionsHtml = `<ul>${q.options.map((opt, i) => `<li><strong>${String.fromCharCode(65 + i)}.</strong> ${opt}</li>`).join("")}</ul>`;
    }

    div.innerHTML = `
      <p><strong>Question:</strong> ${q.content}</p>
      ${optionsHtml}
      <button id="toggle-button-${q.id}" onclick="toggleSolution(${q.id})" class="solution-toggle-btn">Show Solution</button>
      <div id="solution-${q.id}" class="solution-content" style="display: none;">
        ${q.type === "mcq" && q.options && q.answer !== undefined ? 
          `<p><strong>Correct Answer:</strong> ${String.fromCharCode(65 + q.answer)} - ${q.options[q.answer]}</p>` : ''}
        <p><strong>Solution:</strong> ${q.solution || 'Solution not available.'}</p>
      </div>
      <hr style="border-top: 1px dashed #eee; margin: 20px 0;">
    `;
    solutionList.appendChild(div);
  });

  updatePaginationControls();
  if (window.MathJax) MathJax.typesetPromise();
}

function updatePaginationControls() {
    const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);
    document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prev-page-button').disabled = currentPage === 1;
    document.getElementById('next-page-button').disabled = currentPage === totalPages || totalPages === 0;
}

function changePage(direction) {
    const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);
    currentPage += direction;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    renderSolutions();
}

function searchSolutions() {
  const searchTerm = document.getElementById("solution-search-input").value.toLowerCase();
  const classFilter = document.getElementById('class-filter').value;
  const subjectFilter = document.getElementById('subject-filter').value;
  const topicFilter = document.getElementById('topic-filter').value;
  const yearFilter = document.getElementById('year-filter').value;
  const typeFilter = document.getElementById('type-filter').value;


  filteredQuestions = questions.filter(q => {
    const matchesSearchTerm = q.content.toLowerCase().includes(searchTerm) ||
                              (q.solution && q.solution.toLowerCase().includes(searchTerm)) ||
                              (q.topic && q.topic.toLowerCase().includes(searchTerm)) ||
                              (q.subject && q.subject.toLowerCase().includes(searchTerm));

    const matchesClass = !classFilter || q.class === classFilter;
    const matchesSubject = !subjectFilter || q.subject === subjectFilter;
    const matchesTopic = !topicFilter || q.topic === topicFilter;
    const matchesYear = !yearFilter || q.year === yearFilter;
    const matchesType = !typeFilter || q.type === typeFilter;

    return matchesSearchTerm && matchesClass && matchesSubject && matchesTopic && matchesYear && matchesType;
  });
  currentPage = 1; // Reset to first page on new search
  renderSolutions();
}

window.onload = () => {
    populateFilters();
    filteredQuestions = questions; // Initialize filteredQuestions with all questions
    renderSolutions();
};