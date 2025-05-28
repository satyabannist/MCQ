

let selectedQuestions = [];
let currentPage = 1;
const questionsPerPage = 6; // Number of questions to display per page

// Populate filter dropdowns dynamically from questions
function populateFilters() {
  const filterClass = document.getElementById("filter-class");
  const filterSubject = document.getElementById("filter-subject");
  const filterTopic = document.getElementById("filter-topic");
  const filterYear = document.getElementById("filter-year");
  const filterType = document.getElementById("filter-type");

  // Helper to add unique values to select
  function addOptions(select, values) {
    // Clear existing options first (except the "All" option if it exists)
    select.innerHTML = '<option value="">All</option>';
    const unique = [...new Set(values)].sort();
    unique.forEach(val => {
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = val;
      select.appendChild(opt);
    });
  }

  addOptions(filterClass, questions.map(q => q.class));
  addOptions(filterSubject, questions.map(q => q.subject));
  addOptions(filterTopic, questions.map(q => q.topic));
  addOptions(filterYear, questions.map(q => q.year));
  addOptions(filterType, questions.map(q => q.type));
}

let currentFilteredQuestions = []; // Store the currently filtered questions

function applyFiltersAndRender() {
  const filterClass = document.getElementById("filter-class").value;
  const filterSubject = document.getElementById("filter-subject").value;
  const filterTopic = document.getElementById("filter-topic").value;
  const filterYear = document.getElementById("filter-year").value;
  const filterType = document.getElementById("filter-type").value;

  currentFilteredQuestions = questions.filter(q => {
    return (filterClass === "" || q.class == filterClass) &&
           (filterSubject === "" || q.subject === filterSubject) &&
           (filterTopic === "" || q.topic === filterTopic) &&
           (filterYear === "" || String(q.year) === filterYear) &&
           (filterType === "" || q.type === filterType);
  });
  currentPage = 1; // Reset to first page after filtering
  renderQuestions();
}

function renderQuestions() {
  const list = document.getElementById("question-list");
  list.innerHTML = "";

  const totalPages = Math.ceil(currentFilteredQuestions.length / questionsPerPage);
  document.getElementById("page-info").textContent = `Page ${currentPage} of ${totalPages}`;

  document.getElementById("prev-page").disabled = currentPage === 1;
  document.getElementById("next-page").disabled = currentPage === totalPages || totalPages === 0;

  if (currentFilteredQuestions.length === 0) {
    list.textContent = "No questions found for selected filters.";
    return;
  }

  const startIndex = (currentPage - 1) * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const questionsToDisplay = currentFilteredQuestions.slice(startIndex, endIndex);

  questionsToDisplay.forEach((q, index) => {
    const div = document.createElement("div");
    div.className = "question-item";
    div.innerHTML = `
      <p><strong>Class:</strong> ${q.class} | <strong>Subject:</strong> ${q.subject} | <strong>Topic:</strong> ${q.topic} | <strong>Year:</strong> ${q.year} | <strong>Type:</strong> ${q.type}</p>
      <p>${q.content}</p>
      ${q.type === "mcq" ? `
        <ul>
          ${q.options.map((opt, i) => `<li><strong>${String.fromCharCode(65 + i)}.</strong> ${opt}</li>`).join("")}
        </ul>` : ""}
      <button onclick="addQuestionById(${q.id})">Add</button>
    `;
    list.appendChild(div);
  });

  if (window.MathJax) MathJax.typesetPromise();
}

function nextPage() {
  const totalPages = Math.ceil(currentFilteredQuestions.length / questionsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderQuestions();
  }
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    renderQuestions();
  }
}


function addQuestionById(id) {
  const q = questions.find(q => q.id === id);
  if (!q) return;

  // Prevent duplicates by id
  if (!selectedQuestions.some(sel => sel.id === id)) {
    // Add default marks if not present
    const questionToAdd = { ...q, marks: q.marks || 1 };
    selectedQuestions.push(questionToAdd);
    updateSelectedQuestions();
  } else {
    alert("This question is already selected.");
  }
}

function removeQuestion(index) {
  selectedQuestions.splice(index, 1);
  updateSelectedQuestions();
}

function updateMarks(index, value) {
  const newMarks = parseInt(value);
  if (!isNaN(newMarks) && newMarks >= 0) { // Ensure it's a non-negative number
    selectedQuestions[index].marks = newMarks;
  } else {
    alert("Please enter a valid non-negative number for marks.");
    updateSelectedQuestions();
  }
}

function updateSelectedQuestions() {
  const container = document.getElementById("selected-questions");
  container.innerHTML = "";

  if (selectedQuestions.length === 0) {
    container.textContent = "No questions selected.";
    return;
  }

  selectedQuestions.forEach((q, index) => {
    const div = document.createElement("div");
    div.className = "question-item";
    div.innerHTML = `
      <p><strong>Q${index + 1}:</strong> ${q.content}</p>
      ${q.type === "mcq" ? `
        <ul>
          ${q.options.map((opt, i) => `<li><strong>${String.fromCharCode(65 + i)}.</strong> ${opt}</li>`).join("")}
        </ul>` : ""}
      <label>Marks:
        <input type="number" min="0" value="${q.marks || ''}" onchange="updateMarks(${index}, this.value)" />
      </label>
      <button onclick="removeQuestion(${index})">Remove</button>
    `;
    container.appendChild(div);
  });

  if (window.MathJax) MathJax.typesetPromise();
}

function generateQuestionPaper() {
  if (selectedQuestions.length === 0) {
    alert("No questions selected to generate paper!");
    return;
  }

  // Get exam details from input fields
  const examName = document.getElementById("exam-name").value;
  const instituteName = document.getElementById("institute-name").value;
  const paperSubject = document.getElementById("paper-subject").value;
  const examDuration = document.getElementById("exam-duration").value;

  let totalMarks = 0;
  selectedQuestions.forEach(q => {
      totalMarks += q.marks || 0;
  });

  let paperHTML = `<div style="text-align: center; margin-bottom: 30px;">`;
  if (instituteName) paperHTML += `<h1>${instituteName}</h1>`;
  if (examName) paperHTML += `<h2>${examName}</h2>`;
  if (paperSubject) paperHTML += `<h3>Subject: ${paperSubject}</h3>`;
  paperHTML += `<p style="display: flex; justify-content: space-between; width: 80%; margin: 0 auto;">`;
  paperHTML += `<span><strong>Total Marks:</strong> ${totalMarks}</span>`;
  if (examDuration) paperHTML += `<span><strong>Duration:</strong> ${examDuration}</span>`;
  paperHTML += `</p>`;
  paperHTML += `<p style="text-align: right; width: 80%; margin: 5px auto 0 auto;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>`;
  paperHTML += `</div>`;
  paperHTML += `<hr style="border: 1px dashed #ccc; margin: 20px auto; width: 80%;">`;

  // Sort questions by type
  const mcqQuestions = selectedQuestions.filter(q => q.type === "mcq");
  const nonMcqQuestions = selectedQuestions.filter(q => q.type !== "mcq");

  // Render MCQ questions first
  if (mcqQuestions.length > 0) {
    paperHTML += `<h3 style="margin-top: 30px;">Part A: Multiple Choice Questions</h3>`;
    mcqQuestions.forEach((q, index) => {
      paperHTML += `<div style="margin-bottom: 25px;">`;
      paperHTML += `<p><strong>Q${index + 1} (${q.marks || 0} marks):</strong> ${q.content}</p>`;
      paperHTML += `<ul style="list-style-type: none; padding-left: 20px;">`;
      q.options.forEach((opt, i) => {
        paperHTML += `<li style="margin-bottom: 5px;"><strong>${String.fromCharCode(65 + i)}.</strong> ${opt}</li>`;
      });
      paperHTML += `</ul>`;
      paperHTML += `</div>`;
    });
  }

  // Render Non-MCQ questions next
  if (nonMcqQuestions.length > 0) {
    paperHTML += `<h3 style="margin-top: 30px;">Part B: Subjective Questions</h3>`;
    nonMcqQuestions.forEach((q, index) => {
      paperHTML += `<div style="margin-bottom: 25px;">`;
      paperHTML += `<p><strong>Q${mcqQuestions.length + index + 1} (${q.marks || 0} marks):</strong> ${q.content}</p>`; // Adjust question numbering
      paperHTML += `</div>`;
    });
  }

  // Add the footer
  paperHTML += `<div style="text-align: center; margin-top: 50px; font-size: 0.9em; color: #777;">`;
  paperHTML += `<p>Question paper generated by: <a href="http://Qpapergen.com" target="_blank" style="color: #007bff; text-decoration: none;">Qpapergen.com</a></p>`;
  paperHTML += `</div>`;


  const win = window.open('', '_blank');
  win.document.write(`
    <html>
      <head>
        <title>Generated Question Paper</title>
        <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js" async></script>
        <style>
          body { font-family: 'Times New Roman', serif; padding: 30px; font-size: 11pt; }
          h1 { text-align: center; margin-bottom: 10px; color: #333; font-size: 1.8em; }
          h2 { text-align: center; margin-bottom: 15px; color: #333; font-size: 1.5em; }
          h3 { text-align: center; margin-bottom: 20px; color: #555; font-size: 1.2em; }
          p { margin-bottom: 10px; }
          strong { font-weight: bold; }
          ul { list-style-type: none; padding-left: 0; margin-top: 10px; }
          li { margin-bottom: 5px; }
          /* MathJax configuration for the new window */
          #MathJax_Message { display: none !important; }
        </style>
      </head>
      <body>
        ${paperHTML}
        <script>
          window.MathJax = {
            tex: {
              inlineMath: [['$', '$'], ['\\\\(', '\\\\)']]
            },
            startup: {
              typeset: true
            }
          };
          if (window.MathJax) {
            MathJax.startup.promise.then(() => {
              console.log('MathJax typeset in new window.');
            }).catch((err) => {
              console.error('MathJax typesetting error in new window:', err);
            });
          }
        <\/script>
      </body>
    </html>
  `);
  win.document.close();
}

window.onload = () => {
  populateFilters();

  ["filter-class", "filter-subject", "filter-topic", "filter-year", "filter-type"].forEach(id => {
    document.getElementById(id).addEventListener("change", applyFiltersAndRender);
  });

  document.getElementById("prev-page").addEventListener("click", prevPage);
  document.getElementById("next-page").addEventListener("click", nextPage);

  applyFiltersAndRender();
  updateSelectedQuestions();
};

document.getElementById("manual-type").addEventListener("change", function () {
  const type = this.value;
  document.getElementById("manual-options").style.display = type === "mcq" ? "block" : "none";
});
// Add this part to ensure options are visible if MCQ is default on load
document.addEventListener("DOMContentLoaded", function() {
    const manualTypeSelect = document.getElementById("manual-type");
    const manualOptionsDiv = document.getElementById("manual-options");

    // Check if the default selected option is "mcq" on page load
    if (manualTypeSelect.value === "mcq") {
        manualOptionsDiv.style.display = "block";
    }
});


function addManualQuestion() {
  const content = document.getElementById("manual-question").value.trim();
  const type = document.getElementById("manual-type").value;
  const marks = parseInt(document.getElementById("manual-marks").value);
  let options = [];

  if (!content || isNaN(marks) || marks <= 0) {
    alert("Please fill all required fields correctly.");
    return;
  }

  if (type === "mcq") {
    const a = document.getElementById("opt-a").value.trim();
    const b = document.getElementById("opt-b").value.trim();
    const c = document.getElementById("opt-c").value.trim();
    const d = document.getElementById("opt-d").value.trim();
    if (!a || !b || !c || !d) {
      alert("All four MCQ options are required.");
      return;
    }
    options = [a, b, c, d];
  }

  const newQuestion = {
    id: Date.now(), // temporary unique ID
    content,
    type,
    marks,
    options: type === "mcq" ? options : undefined
  };

  selectedQuestions.push(newQuestion);
  updateSelectedQuestions();
  document.getElementById("manual-question").value = "";
  if (type === "mcq") {
    ["opt-a", "opt-b", "opt-c", "opt-d"].forEach(id => document.getElementById(id).value = "");
  }
  document.getElementById("manual-marks").value = 1;
}
