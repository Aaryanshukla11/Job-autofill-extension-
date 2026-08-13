# ⚡ AI Job Application Autofill Chrome Extension (V1)

> A calm, privacy-first Manifest V3 Chrome Extension that parses resumes locally, manages candidate profiles, understands job application forms, and autofills fields with precision—keeping final application submission strictly under user control.

---

## ✨ Overview

Applying for jobs online involves repetitive manual data entry across hundreds of fields on diverse applicant tracking systems (ATS) like Greenhouse, Lever, Workday, Naukri, and custom career portals.

**AI Job Application Autofill** solves this by turning application filling into a single-click productivity action:
1. **Upload Resume**: PDF or DOCX resume is parsed 100% locally in your browser.
2. **Candidate Profile**: Automatically extracts personal details, contact info, professional summary, skills, links, and education. Allows adding dynamic custom fields and exporting/importing profile JSON files.
3. **Smart Form Detection & Autofill**: Scans page inputs, classifies fields using an 8-tier normalization engine, dispatches React/Vue synthetic events, and autofills forms cleanly.
4. **Safety & Control**: Never submits applications programmatically.

---

## 🛠 Features

- 📄 **100% Local Resume Parsing**: Uses Mozilla PDF.js and native `DecompressionStream('deflate')` for FlateDecode stream parsing. Zero server uploads required.
- 👤 **Editable Candidate Profile & Custom Fields**: Modify extracted data, add custom key-value application fields, export to `candidate-profile.json`, or import external profile JSONs.
- 🎯 **8-Tier Field Classification**: Maps form inputs using name attributes, IDs, labels, placeholders, ARIA roles, surrounding text, and structural DOM heuristics.
- ⚛️ **Synthetic Event Dispatching**: Triggers native `focus`, `input`, `change`, and `blur` events so React, Vue, Angular, and Svelte component state updates immediately.
- 🔒 **Fact Safety & Sensitive Policies**: Protects sensitive fields (salary, visa, gender, disability) from accidental autofill and verifies AI-generated text against profile facts.
- 🛑 **Strict Never-Submit Invariant**: Identifies Submit/Apply/Next buttons but **NEVER programmatically clicks them**. Final submission is always manual.
- 🎨 **Minimal & Editorial UI Design**: Inspired by Linear, Notion, and Raycast. Features light and dark modes with restrained typography and zero flashy gradients.

---

## 📂 Project Structure

```text
job-apply-bot/
├── manifest.json                # Manifest V3 Chrome Extension Configuration
├── package.json                 # Dependencies & Test Scripts
│
├── background/                  # Service Worker
│   └── service-worker.js        # Background proxy for AI API calls & storage listeners
│
├── resume/                      # Resume Parsing & Extraction
│   ├── pdf-extract.js           # Mozilla PDF.js & FlateDecode stream text extractor
│   ├── docx-extract.js          # DOCX text & XML extractor
│   ├── resume-parser.js         # Entity extraction (Name, Email, Phone, Skills, Links)
│   ├── profile-builder.js       # Profile builder pipeline
│   └── profile-schema.js        # Candidate Profile schema & sanitizer
│
├── autofill/                    # Form Autofill Engine
│   ├── field-classifier.js      # 8-tier field classification engine
│   ├── value-resolver.js        # Profile JSON path & custom field value resolver
│   └── confidence.js            # Match confidence policy calculator
│
├── content/                     # Injected Page Scripts
│   ├── content.js               # Page entry script & Chrome message listener
│   ├── dom-scanner.js           # Interactive input, textarea, select scanner
│   ├── form-filler.js           # Page form filler
│   ├── event-dispatcher.js      # React/Vue synthetic event emitter
│   └── file-handler.js          # File input detection & manual prompt handler
│
├── ai/                          # AI Integration (Groq Cloud API)
│   ├── groq-provider.js         # Groq Llama 3.3 70B API provider
│   ├── prompts.js               # Structured prompt templates
│   ├── question-classifier.js   # Open-ended question categorizer
│   ├── answer-generator.js      # Fact-backed answer generator
│   └── fact-validator.js        # Unsupported claim detector & safety validator
│
├── validation/                  # Pre-fill & Post-fill Validation
│   └── validator.js             # Format, regex, and constraint validation
│
├── storage/                     # Browser Storage Layer
│   ├── storage.js               # chrome.storage.local proxy
│   └── schemas.js               # Storage default schemas
│
├── ui/                          # Side Panel Interface
│   ├── sidepanel.html           # Main Extension Markup
│   ├── sidepanel.css            # Editorial Design System & Dark Mode CSS
│   ├── sidepanel.js             # Sidepanel Controller
│   └── components/              # Modular UI Components
│       ├── autofill-view.js     # Primary Autofill screen
│       ├── resume-view.js       # Document upload & remove resume view
│       ├── profile-view.js      # Profile editor & JSON import/export
│       ├── results-view.js      # Fill execution summary & element highlighter
│       └── settings-view.js     # Groq API key & safety settings
│
└── tests/                       # Test Suite & Integration Lab
    ├── field-classifier.test.js # Unit test: Field Classifier
    ├── resume-parser.test.js    # Unit test: Resume Parser
    ├── value-resolver.test.js   # Unit test: Value Resolver
    ├── validator.test.js        # Unit test: Validation Engine
    ├── run-integration-tests.js # JSDOM Integration Test Suite Runner
    └── fixtures/                # 7 Local HTML Form Test Fixtures
```

---

## 💻 Installation

### Load Unpacked Extension in Chrome

1. Clone or download this repository to your local machine:
   ```bash
   git clone https://github.com/your-username/job-apply-bot.git
   ```
2. Open Google Chrome and navigate to:
   ```text
   chrome://extensions
   ```
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click **Load unpacked** and select the `job-apply-bot` project directory.
5. *(Optional for local HTML testing)*: Click **Details** on the extension card and turn **ON** `Allow access to file URLs`.

---

## 📖 How to Use

1. Click the Chrome Extension icon or open the Chrome **Side Panel**.
2. **Upload Resume**: Go to the **Resume** tab and select your PDF or DOCX resume.
3. **Verify Profile**: Open the **Profile** tab to inspect extracted fields or add custom application key-value pairs.
4. **Autofill Application**: Navigate to any job application page (or local test HTML form) and click **Autofill →**.
5. **Review & Submit**: Review filled fields in the **Results** tab or on the page, make any needed edits, and click Submit manually.

---

## 🧪 Running Tests

The repository includes both unit tests and a JSDOM browser integration test suite.

### Run Unit Tests
```bash
npm test
```
*Executes unit tests for field classification, resume parsing, value resolution, and constraint validation.*

### Run Integration Test Suite
```bash
npm run test:integration
```
*Executes integration tests against 7 local HTML form fixtures (basic forms, obfuscated fields, React synthetic events, multi-step wizards, unknown open-ended questions, sensitive fields, and file upload prompts).*

---

## 🔒 Safety & Privacy Invariants

- **No Auto-Submit**: The extension will never programmatically trigger `form.submit()`, click `[type="submit"]`, or click Apply/Submit buttons.
- **Local Storage**: Resume text and profile details are stored strictly inside your local browser via `chrome.storage.local`.
- **Sensitive Field Blocking**: Fields such as salary expectations, visa status, disability, and gender are protected by default unless explicitly enabled in Settings.

---

## 📜 License

This project is licensed under the [ISC License](LICENSE).
