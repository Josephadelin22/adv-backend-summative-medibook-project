
const languageSelect = document.getElementById('language-select');
const questionsContainer = document.getElementById('questions-container');

async function loadLanguage(language) {
    // Only English and French are supported
    const supportedLanguages = ['en', 'fr'];

    const activeLanguage = supportedLanguages.includes(language)
        ? language
        : 'en';

    try {
        // Load the selected translation file
        const response = await fetch(`/locales/${activeLanguage}.json`);

        if (!response.ok) {
            throw new Error('Unable to load language file');
        }

        const translations = await response.json();

        // Update the page language
        document.documentElement.lang = activeLanguage;

        // Update page content
        document.getElementById('page-title').textContent =
            translations.pageTitle;

        document.getElementById('instructions').textContent =
            translations.instructions;

        document.getElementById('date-label').textContent =
            translations.dateLabel;

        document.getElementById('language-label').textContent =
            translations.languageLabel;

        document.getElementById('submit-button').textContent =
            translations.submitButton;

        // Format today's date according to the active language
        const today = new Date();

        document.getElementById('feedback-date').textContent =
            new Intl.DateTimeFormat(activeLanguage, {
                dateStyle: 'full'
            }).format(today);

        // Generate exactly five essay questions
        questionsContainer.innerHTML = '';

        translations.questions.forEach((question, index) => {
            const questionGroup = document.createElement('div');
            questionGroup.className = 'question-group';

            const label = document.createElement('label');
            label.htmlFor = `question-${index + 1}`;
            label.textContent = `${index + 1}. ${question}`;

            const textarea = document.createElement('textarea');
            textarea.id = `question-${index + 1}`;
            textarea.name = `question-${index + 1}`;
            textarea.rows = 5;
            textarea.required = true;
            textarea.placeholder = activeLanguage === 'fr'
                ? 'Écrivez votre réponse ici...'
                : 'Write your answer here...';

            questionGroup.appendChild(label);
            questionGroup.appendChild(textarea);

            questionsContainer.appendChild(questionGroup);
        });

        languageSelect.value = activeLanguage;

    } catch (error) {
        console.error('Language loading error:', error);
        questionsContainer.textContent =
            'Unable to load the feedback form. Please try again.';
    }
}

// Get language from URL
const urlParameters = new URLSearchParams(window.location.search);
const requestedLanguage = urlParameters.get('lang') || 'en';

// Load initial language
loadLanguage(requestedLanguage);

// Change language when the user selects another option
languageSelect.addEventListener('change', () => {
    const selectedLanguage = languageSelect.value;

    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('lang', selectedLanguage);

    window.location.href = newUrl.toString();
});

// Handle form submission
document.getElementById('feedback-form').addEventListener('submit', (event) => {
    event.preventDefault();

    const answers = [];

    for (let i = 1; i <= 5; i++) {
        answers.push(document.getElementById(`question-${i}`).value.trim());
    }

    console.log('Course feedback answers:', answers);

    const message = document.getElementById('form-message');
    message.textContent = translations.successMessage;

    document.getElementById('feedback-form').reset();
});
