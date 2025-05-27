// Ensure 'questions' array is available from data.js
// It's assumed data.js is loaded before this script.

let mcqQuestions = []; // Filtered MCQ questions for the test
let currentQuestionIndex = 0;
let userAnswers = {}; // Stores user's selected answers {questionId: selectedOptionIndex}
let timerInterval;
const timePerQuestionSeconds = 60; // 60 seconds per question
let totalTimeSeconds = 0;
let timeLeftSeconds = 0;

const testControlsDiv = document.getElementById('test-controls');
const testContainer = document.getElementById('test-container');
const questionNumberDisplay = document.getElementById('question-number');
const questionContentDisplay = document.getElementById('question-content');
const optionsContainer = document.getElementById('options-container');
const prevButton = document.getElementById('prev-question-button');
const nextButton = document.getElementById('next-question-button');
const submitButton = document.getElementById('submit-test-button');
const resultContainer = document.getElementById('result-container');
const scoreDisplay = document.getElementById('score');
const totalQuestionsDisplay = document.getElementById('total-questions');
const percentageDisplay = document.getElementById('percentage');
const detailedResultsDiv = document.getElementById('detailed-results');
const timerDisplay = document.getElementById('timer');

// Filter elements
const mcqClassFilter = document.getElementById('mcq-class-filter');
const mcqSubjectFilter = document.getElementById('mcq-subject-filter');
const mcqTopicFilter = document.getElementById('mcq-topic-filter');
const mcqYearFilter = document.getElementById('mcq-year-filter');

function populateMcqFilters() {
    // Get unique values for filters from only MCQ type questions
    const availableMcqQuestions = questions.filter(q => q.type === 'mcq' && q.options && q.options.length > 0);

    const classes = [...new Set(availableMcqQuestions.map(q => q.class))].sort();
    const subjects = [...new Set(availableMcqQuestions.map(q => q.subject))].sort();
    const topics = [...new Set(availableMcqQuestions.map(q => q.topic))].sort();
    const years = [...new Set(availableMcqQuestions.map(q => q.year))].sort();

    // Helper to populate a select element
    const populateSelect = (selectElement, optionsArray) => {
        selectElement.innerHTML = `<option value="">All ${selectElement.id.replace('mcq-', '').replace('-filter', '')}s</option>`; // Reset and add 'All' option
        optionsArray.forEach(item => {
            const option = document.createElement('option');
            option.value = item;
            option.textContent = item;
            selectElement.appendChild(option);
        });
    };

    populateSelect(mcqClassFilter, classes);
    populateSelect(mcqSubjectFilter, subjects);
    populateSelect(mcqTopicFilter, topics);
    populateSelect(mcqYearFilter, years);
}


function startTest() {
    const numQuestionsInput = document.getElementById('num-questions');
    let numberOfQuestions = parseInt(numQuestionsInput.value, 10);

    if (isNaN(numberOfQuestions) || numberOfQuestions <= 0) {
        alert("Please enter a valid number of questions.");
        return;
    }

    // Apply filters before shuffling and slicing
    let potentialMcqQuestions = questions.filter(q => q.type === 'mcq' && q.options && q.options.length > 0);

    const selectedClass = mcqClassFilter.value;
    const selectedSubject = mcqSubjectFilter.value;
    const selectedTopic = mcqTopicFilter.value;
    const selectedYear = mcqYearFilter.value;

    potentialMcqQuestions = potentialMcqQuestions.filter(q => {
        const matchesClass = !selectedClass || q.class === selectedClass;
        const matchesSubject = !selectedSubject || q.subject === selectedSubject;
        const matchesTopic = !selectedTopic || q.topic === selectedTopic;
        const matchesYear = !selectedYear || q.year === selectedYear;
        return matchesClass && matchesSubject && matchesTopic && matchesYear;
    });

    if (potentialMcqQuestions.length === 0) {
        alert("No MCQ questions found matching your selected filters. Please adjust your filters or the number of questions.");
        return;
    }

    // Shuffle and pick desired number of questions from the filtered set
    mcqQuestions = shuffleArray(potentialMcqQuestions).slice(0, numberOfQuestions);

    if (mcqQuestions.length === 0) {
      alert("No questions could be generated with the selected filters and number. Try reducing the number of questions or broadening your filters.");
      return;
    }

    currentQuestionIndex = 0;
    userAnswers = {};
    testControlsDiv.style.display = 'none';
    testContainer.style.display = 'block';
    resultContainer.style.display = 'none';

    // Set up timer
    totalTimeSeconds = mcqQuestions.length * timePerQuestionSeconds;
    timeLeftSeconds = totalTimeSeconds;
    startTimer();

    loadQuestion();
    updateNavigationButtons();
}

function loadQuestion() {
    if (mcqQuestions.length === 0) return;

    const question = mcqQuestions[currentQuestionIndex];
    questionNumberDisplay.textContent = `Question ${currentQuestionIndex + 1} of ${mcqQuestions.length}`;
    questionContentDisplay.innerHTML = question.content; // Use innerHTML for MathJax

    optionsContainer.innerHTML = ''; // Clear previous options

    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option-item';

        const radioInput = document.createElement('input');
        radioInput.type = 'radio';
        radioInput.name = `question-${question.id}`;
        radioInput.id = `q${question.id}-option-${index}`;
        radioInput.value = index;
        radioInput.checked = userAnswers[question.id] === index; // Check if already answered
        radioInput.onchange = () => saveAnswer(question.id, index);

        const label = document.createElement('label');
        label.htmlFor = `q${question.id}-option-${index}`;
        label.innerHTML = `<span>${String.fromCharCode(65 + index)}.</span> ${option}`; // Use innerHTML for MathJax options

        optionDiv.appendChild(radioInput);
        optionDiv.appendChild(label);
        optionsContainer.appendChild(optionDiv);
    });

    // Typeset MathJax after new content is loaded
    if (window.MathJax) MathJax.typesetPromise([questionContentDisplay, optionsContainer]);
}

function saveAnswer(questionId, selectedOptionIndex) {
    userAnswers[questionId] = selectedOptionIndex;
}

function navigateQuestion(direction) {
    saveCurrentAnswer(); // Save the answer before navigating
    currentQuestionIndex += direction;
    updateNavigationButtons();
    loadQuestion();
}

function updateNavigationButtons() {
    prevButton.disabled = currentQuestionIndex === 0;
    nextButton.disabled = currentQuestionIndex === mcqQuestions.length - 1;

    if (currentQuestionIndex === mcqQuestions.length - 1) {
        submitButton.style.display = 'inline-block';
    } else {
        submitButton.style.display = 'none';
    }
}

function saveCurrentAnswer() {
    const currentQuestion = mcqQuestions[currentQuestionIndex];
    const radios = document.getElementsByName(`question-${currentQuestion.id}`);
    for (const radio of radios) {
        if (radio.checked) {
            userAnswers[currentQuestion.id] = parseInt(radio.value, 10);
            return;
        }
    }
    // If no option is selected, ensure it's recorded as undefined or null
    userAnswers[currentQuestion.id] = undefined;
}


function submitTest() {
    clearInterval(timerInterval); // Stop the timer
    saveCurrentAnswer(); // Save the last question's answer

    let score = 0;
    detailedResultsDiv.innerHTML = ''; // Clear previous results

    mcqQuestions.forEach((q, index) => {
        const userAnswer = userAnswers[q.id];
        const isCorrect = userAnswer === q.answer;

        if (isCorrect) {
            score++;
        }

        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        if (isCorrect) {
            resultItem.classList.add('correct');
        } else {
            resultItem.classList.add('incorrect');
        }

        // --- Build content of resultItem more explicitly using created elements ---

        // 1. Question Header
        const questionHeader = document.createElement('h3');
        questionHeader.innerHTML = `Question ${index + 1}: ${q.content}`; // Math in q.content is here

        // 2. Options List
        const optionsList = document.createElement('ul');
        if (q.options) {
            q.options.forEach((opt, i) => {
                const optionLi = document.createElement('li');
                let optionClass = '';
                if (i === q.answer) {
                    optionClass = 'correct-option'; // Correct option
                }
                if (userAnswer !== undefined && i === userAnswer && !isCorrect) {
                    optionClass = 'user-incorrect-option'; // User's incorrect answer
                }
                optionLi.className = optionClass;
                optionLi.innerHTML = `<span>${String.fromCharCode(65 + i)}.</span> ${opt}`; // Math in opt
                optionsList.appendChild(optionLi);
            });
        }

        // 3. User's Answer
        const userAnswerP = document.createElement('p');
        userAnswerP.innerHTML = `<strong>Your Answer:</strong> ${userAnswer !== undefined ? String.fromCharCode(65 + userAnswer) : 'Not Answered'}`;

        // 4. Correct Answer
        const correctAnswerP = document.createElement('p');
        // Math is in q.options[q.answer]
        correctAnswerP.innerHTML = `<strong>Correct Answer:</strong> ${String.fromCharCode(65 + q.answer)} - ${q.options[q.answer]}`;

        // 5. Solution
        const solutionP = document.createElement('p');
        solutionP.innerHTML = `<strong>Solution:</strong> ${q.solution}`; // Math in q.solution is here

        // Append all parts to the resultItem
        resultItem.appendChild(questionHeader);
        resultItem.appendChild(optionsList);
        resultItem.appendChild(userAnswerP);
        resultItem.appendChild(correctAnswerP);
        resultItem.appendChild(solutionP);

        // Append the fully constructed resultItem to the detailedResultsDiv
        detailedResultsDiv.appendChild(resultItem);

        // *** CRUCIAL MODIFICATION: Call MathJax specifically for THIS result item ***
        // This ensures MathJax processes each question's result after it's added
        if (window.MathJax) {
            MathJax.typesetPromise([resultItem]).catch(err => {
                console.error("MathJax typesetting error for result item:", err);
            });
        }
    });

    scoreDisplay.textContent = score;
    totalQuestionsDisplay.textContent = mcqQuestions.length;
    percentageDisplay.textContent = ((score / mcqQuestions.length) * 100).toFixed(2);

    testContainer.style.display = 'none';
    resultContainer.style.display = 'block';

    // IMPORTANT: Remove the previous global typesetPromise call if it's still here,
    // as we are now typesetting each item individually.
    // if (window.MathJax) MathJax.typesetPromise(detailedResultsDiv); // REMOVE THIS LINE IF PRESENT
}

function retakeTest() {
    testControlsDiv.style.display = 'block';
    resultContainer.style.display = 'none';
    testContainer.style.display = 'none'; // Ensure test container is hidden on retake
    document.getElementById('num-questions').value = 5; // Reset default
    clearInterval(timerInterval); // Clear any lingering timer
    timerDisplay.textContent = "00:00"; // Reset timer display
    populateMcqFilters(); // Re-populate filters in case data changed (though unlikely for static data.js)
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
}

function startTimer() {
    clearInterval(timerInterval); // Clear any existing timer
    const displayTimer = () => {
        const minutes = Math.floor(timeLeftSeconds / 60);
        const seconds = timeLeftSeconds % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (timeLeftSeconds <= 0) {
            clearInterval(timerInterval);
            alert("Time's up! Submitting your test.");
            submitTest();
        } else {
            timeLeftSeconds--;
        }
    };
    displayTimer(); // Call once immediately
    timerInterval = setInterval(displayTimer, 1000);
}

// Initial setup on page load
window.onload = () => {
    // Ensure 'questions' array from data.js is loaded
    if (typeof questions === 'undefined' || questions.length === 0) {
        console.error("Questions array not found or is empty. Ensure 'data.js' is loaded correctly.");
        // You might want to disable the start test button or show an error message
    } else {
        populateMcqFilters(); // Populate filters on page load
    }
};