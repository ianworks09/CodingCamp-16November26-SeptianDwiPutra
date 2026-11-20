# Implementation Plan: To Do List Life Dashboard

## Overview

Implement a client-side single-page web application using HTML, CSS, and Vanilla JavaScript. The page contains four widgets: Greeting, Focus Timer, To-Do List, and Quick Links. All persistence is handled via `localStorage`. The implementation follows a module-per-widget architecture inside a single `js/app.js` file, with all styling in `css/styles.css`.

## Tasks

- [x] 1. Create project file structure and HTML skeleton
  - Create `index.html` with semantic HTML sections for all four widgets: Greeting, Focus Timer, Task List, and Quick Links
  - Create `css/styles.css` as an empty file linked from `index.html`
  - Create `js/app.js` as an empty file linked from `index.html`
  - Define HTML elements for each widget with appropriate `id` attributes referenced by the JS modules:
    - Greeting: `#greeting-time`, `#greeting-date`, `#greeting-message`
    - Focus Timer: `#timer-display`, `#timer-start`, `#timer-stop`, `#timer-reset`
    - Task List: `#task-container`, `#task-input`, `#task-submit`, `#task-error`
    - Quick Links: `#links-container`, `#link-label-input`, `#link-url-input`, `#link-submit`, `#link-error`
  - Include a `#storage-warning` dismissible banner element in the HTML
  - _Requirements: 9.1, 9.3, 9.4_

- [x] 2. Implement StorageService module
  - [x] 2.1 Write the `StorageService` object in `js/app.js`
    - Implement `isAvailable()`: attempts a test write/read/delete on `localStorage`; returns `true` on success, `false` on any exception
    - Implement `read(key)`: calls `JSON.parse(localStorage.getItem(key))`; returns `null` on any exception or missing key
    - Implement `write(key, value)`: calls `localStorage.setItem(key, JSON.stringify(value))`; returns `false` on `QuotaExceededError` or `SecurityError`, `true` on success
    - _Requirements: 8.1, 8.2, 8.5_

  - [ ]* 2.2 Write property test for StorageService round-trip
    - **Property 13: Task storage consistency over operation sequences**
    - **Property 14: Link storage consistency over operation sequences**
    - **Validates: Requirements 8.3, 8.4**

- [x] 3. Implement ClockService and GreetingWidget modules
  - [ ] 3.1 Write the `ClockService` object in `js/app.js`
    - Implement `subscribe(callback)`: pushes callback into an internal array
    - Implement `start()`: fires all callbacks immediately with `new Date()`, then sets a `setInterval` at 1 000 ms that fires all callbacks on each tick
    - _Requirements: 1.2_

  - [ ] 3.2 Write the `GreetingWidget` object in `js/app.js`
    - Implement `_selectGreeting(hour)`: returns `"Good Morning"` for 5–11, `"Good Afternoon"` for 12–17, `"Good Evening"` for 18–20, `"Good Night"` for 21–23 and 0–4
    - Implement `onTick(now)`: formats time as `HH:MM` (zero-padded), date as `"Day, DD Month YYYY"`, selects greeting via `_selectGreeting`; writes to the three DOM elements
    - Implement `init(elements)`: stores element references; subscribes `onTick` to `ClockService`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ]* 3.3 Write property test for greeting correctness
    - **Property 1: Greeting correctness for all hours**
    - Use `fc.integer({ min: 0, max: 23 })` as generator
    - Assert return value is one of the four greeting strings and maps to the correct hour range per spec
    - **Validates: Requirements 1.4, 1.5, 1.6, 1.7**

  - [ ]* 3.4 Write property test for date format
    - **Property 2: Date format correctness**
    - Use `fc.date()` as generator
    - Assert output matches `/^[A-Za-z]+, \d{2} [A-Za-z]+ \d{4}$/` with correct day/month/year values
    - **Validates: Requirements 1.3**

- [x] 4. Implement FocusTimer module
  - [ ] 4.1 Write the `FocusTimer` object in `js/app.js`
    - Define `INITIAL_SECONDS = 1500`; initialise state `remainingSeconds`, `isRunning`
    - Implement `_updateDisplay()`: formats `remainingSeconds` as `MM:SS` with zero-padding; writes to `#timer-display`
    - Implement `_updateButtonStates()`: enables/disables start, stop per the matrix (idle: start enabled/stop disabled; running: start disabled/stop enabled; expired 00:00: both disabled)
    - Implement `_playAlert()`: creates an `AudioContext` oscillator beep of ≥1 s duration; wraps in `try/catch` to skip silently on failure
    - Implement `_onExpiry()`: calls `stop()`; applies expired CSS class to display; calls `_playAlert()`; disables start button
    - Implement `start()`: subscribes `onTick` to `ClockService`; updates button states
    - Implement `stop()`: unsubscribes `onTick`; updates button states
    - Implement `reset()`: calls `stop()`; restores `remainingSeconds` to 1500; removes expired CSS class; calls `_updateDisplay()` and `_updateButtonStates()`
    - Implement `onTick()`: decrements `remainingSeconds`; calls `_updateDisplay()`; calls `_onExpiry()` if `remainingSeconds === 0`
    - Implement `init(elements)`: stores element references; attaches click listeners to start, stop, reset buttons; calls `_updateDisplay()` and `_updateButtonStates()`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [ ]* 4.2 Write property test for timer display format
    - **Property 3: Timer display format**
    - Use `fc.integer({ min: 0, max: 1500 })` as generator
    - Assert output of `_updateDisplay()` matches `/^\d{2}:\d{2}$/` and minutes/seconds are correctly computed
    - **Validates: Requirements 2.3**

- [ ] 5. Checkpoint — Verify greeting and timer behaviour
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement TaskList module — add and display
  - [ ] 6.1 Write TaskList skeleton and `_loadFromStorage` / `_saveToStorage` in `js/app.js`
    - Define constants `MAX_DESCRIPTION_LENGTH = 200`, `MAX_EDIT_LENGTH = 500`, `MAX_TASKS = 100`, `STORAGE_KEY = "tldash_tasks"`
    - Implement `_loadFromStorage()`: calls `StorageService.read(STORAGE_KEY)`; sets `tasks` to result or `[]` on `null`; shows inline error if `null` returned
    - Implement `_saveToStorage()`: calls `StorageService.write(STORAGE_KEY, tasks)`; returns `false` and shows inline error on failure
    - _Requirements: 3.6, 3.7, 8.1, 8.2, 8.3_

  - [ ] 6.2 Implement `_validate`, `_renderTask`, `_renderAll`, and `addTask` in TaskList
    - Implement `_validate(text, maxLen)`: returns `{ valid: false, reason }` for empty/whitespace-only strings or strings exceeding `maxLen`; returns `{ valid: true }` otherwise
    - Implement `_renderTask(task)`: builds a list item element containing: checkbox toggle, description `<span>`, edit button, delete button; applies strikethrough class when `task.completed` is true; wires click handlers to `toggleComplete`, opens inline edit UI, and `deleteTask`
    - Implement `_renderAll()`: clears `#task-container`; renders each task via `_renderTask`
    - Implement `addTask(description)`: validates against `MAX_DESCRIPTION_LENGTH`; rejects with inline message on failure; creates Task object with `id` (`crypto.randomUUID()`), `description` (trimmed), `completed: false`, `createdAt: Date.now()`; calls `_saveToStorage()` — only appends to `tasks` and re-renders if save succeeds; rejects with storage error message if save fails
    - Wire `#task-submit` click and `#task-input` Enter keypress to `addTask`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 6.3 Write property test for invalid task description rejection
    - **Property 4: Invalid task descriptions are rejected**
    - Use `fc.oneof(fc.constant(""), fc.string().filter(s => s.trim() === ""), fc.string({ minLength: 201 }))` as generator
    - Assert task array length unchanged and nothing new written to storage
    - **Validates: Requirements 3.3**

  - [ ]* 6.4 Write property test for task addition round-trip
    - **Property 5: Task addition round-trip**
    - Use `fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0)` as generator
    - Assert `StorageService.read("tldash_tasks")` last element `description` equals trimmed input
    - **Validates: Requirements 3.2, 3.4, 8.3**

  - [ ]* 6.5 Write property test for task insertion order
    - **Property 6: Task insertion order is preserved**
    - Use `fc.array(fc.string(...), { maxLength: 100 })` as generator
    - Assert storage array order matches add order
    - **Validates: Requirements 3.6**

- [x] 7. Implement TaskList module — edit, complete, delete
  - [x] 7.1 Implement `editTask` in TaskList
    - Implement inline edit mode in `_renderTask`: when edit button clicked, replace description `<span>` with a pre-filled `<input>`, show confirm and cancel buttons, close any other open edit input (Requirement 4.2)
    - Implement `editTask(id, newDescription)`: validates trimmed value against `MAX_EDIT_LENGTH`; rejects with inline error if empty/whitespace-only; calls `_saveToStorage()` — updates `tasks` array and re-renders only if save succeeds
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 7.2 Implement `toggleComplete` and `deleteTask` in TaskList
    - Implement `toggleComplete(id)`: flips `completed` flag on matched task; calls `_saveToStorage()` — updates and re-renders only if save succeeds; reverts and shows error if save fails (Requirement 5.6)
    - Implement `deleteTask(id)`: splices matched task from array; calls `_saveToStorage()` — removes from DOM only if save succeeds; reverts and shows error if save fails (Requirement 5.6)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 7.3 Write property test for valid edit updating description
    - **Property 7: Valid edit updates task description**
    - Use `fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0)` as generator
    - Assert in-memory and storage `description` equals trimmed input after `editTask`
    - **Validates: Requirements 4.3, 8.3**

  - [ ]* 7.4 Write property test for whitespace edit rejection
    - **Property 8: Whitespace edit is rejected and original is preserved**
    - Use `fc.oneof(fc.constant(""), fc.string().map(s => s.replace(/\S/g, "")))` as generator
    - Assert task description in memory and storage unchanged
    - **Validates: Requirements 4.4**

  - [ ]* 7.5 Write property test for completion toggle round-trip
    - **Property 9: Completion toggle is a true round-trip**
    - Use `fc.boolean()` as initial state generator
    - Assert two calls to `toggleComplete` restore original `completed` value and storage matches
    - **Validates: Requirements 5.2, 5.3, 8.3**

  - [ ]* 7.6 Write property test for deleted task absence
    - **Property 10: Deleted task is absent from memory and storage**
    - Assert `id` absent from in-memory array and storage JSON after `deleteTask`
    - **Validates: Requirements 5.5, 8.3**

- [ ] 8. Checkpoint — Verify task CRUD and persistence
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement QuickLinks module — add and display
  - [ ] 9.1 Write QuickLinks skeleton, `_loadFromStorage`, `_saveToStorage`, `_validateUrl`, and `addLink`
    - Define constants `MAX_LINKS = 50`, `MAX_LABEL_LENGTH = 50`, `STORAGE_KEY = "tldash_links"`
    - Implement `_loadFromStorage()`: calls `StorageService.read(STORAGE_KEY)`; sets `links` to result or `[]` on `null`; shows inline error if `null`
    - Implement `_saveToStorage()`: calls `StorageService.write(STORAGE_KEY, links)`; returns `false` and shows inline error on failure
    - Implement `_validateUrl(url)`: returns `true` only if `url` starts with `"http://"` or `"https://"`
    - Implement `addLink(label, url)`: validates label (non-empty, ≤50 chars) and URL; rejects with per-field inline message identifying which field is invalid; rejects with limit message if `links.length >= 50`; creates Link object with `id`, `label`, `url`; calls `_saveToStorage()` — appends and re-renders only if save succeeds
    - Wire `#link-submit` click to `addLink`
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6, 6.7, 6.8_

  - [ ] 9.2 Implement `_renderLink`, `_renderAll`, and `deleteLink` in QuickLinks
    - Implement `_renderLink(link)`: builds a container with a clickable `<button>` labeled with `link.label` that opens `link.url` in a new tab (`target="_blank" rel="noopener"`), plus a delete control
    - Implement `_renderAll()`: clears `#links-container`; renders each link via `_renderLink`
    - Implement `deleteLink(id)`: splices matched link; calls `_saveToStorage()` — removes from DOM only if save succeeds; reverts and shows error if save fails (Requirement 7.3)
    - _Requirements: 6.2, 6.4, 7.1, 7.2, 7.3_

  - [ ]* 9.3 Write property test for invalid URL rejection
    - **Property 11: Invalid URL is rejected**
    - Use `fc.string().filter(s => !s.startsWith("http://") && !s.startsWith("https://"))` as generator
    - Assert `_validateUrl` returns `false` and links array unchanged after `addLink`
    - **Validates: Requirements 6.2, 6.3**

  - [ ]* 9.4 Write property test for link addition round-trip
    - **Property 12: Link addition round-trip**
    - Use `fc.record({ label: fc.string({ minLength: 1, maxLength: 50 }), url: ... })` as generator
    - Assert storage array last element `label` and `url` equal submitted values
    - **Validates: Requirements 6.2, 6.5, 8.4**

- [x] 10. Implement storage unavailability handling and app initialisation
  - [x] 10.1 Wire the `init` entry point and storage warning banner in `js/app.js`
    - Add a `DOMContentLoaded` listener that calls `StorageService.isAvailable()`; if `false`, shows and wires the dismiss button on `#storage-warning`
    - Call `ClockService.start()` after all widget `init()` calls
    - Call `GreetingWidget.init(...)`, `FocusTimer.init(...)`, `TaskList.init(...)`, `QuickLinks.init(...)` in sequence, passing the DOM elements collected via `document.getElementById`
    - _Requirements: 8.2_

  - [x] 10.2 Implement storage write-failure guards across all widgets
    - Confirm `TaskList.addTask`, `editTask`, `toggleComplete`, `deleteTask` each abort the in-memory/UI update when `_saveToStorage()` returns `false` and show an inline error
    - Confirm `QuickLinks.addLink` and `deleteLink` each abort and show an inline error on save failure
    - _Requirements: 3.5, 4.6, 5.6, 7.3, 8.5_

- [x] 11. Apply all CSS styling in css/styles.css
  - Style the overall page layout (dark or neutral background, centered content, card-style widget panels)
  - Style the Greeting Widget: large time display, subdued date, prominent greeting text
  - Style the Focus Timer: large `MM:SS` display, three clearly distinguishable buttons, an `.expired` class that applies a visual distinct state (e.g., red colour or flashing animation) to the timer display
  - Style the Task List: input row, task items with strikethrough for completed tasks, inline error messages, edit mode input
  - Style the Quick Links panel: grid or flex layout of link buttons, delete affordance, inline error messages
  - Style the storage warning banner with a dismiss button
  - Implement responsive layout: at all viewport widths ≥ 320 px, all content is visible and no horizontal scrollbar appears (use fluid widths, `flex-wrap`, `min-width: 0` as needed)
  - _Requirements: 2.6, 5.2, 9.3, 9.6_

- [ ] 12. Final checkpoint — End-to-end verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The design has a Correctness Properties section, so property-based tests (using fast-check) are included as optional sub-tasks
- Checkpoints at tasks 5, 8, and 12 provide incremental validation gates
- All code lives in two files only: `css/styles.css` and `js/app.js` (plus `index.html`)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "3.1"] },
    { "id": 3, "tasks": ["3.2"] },
    { "id": 4, "tasks": ["3.3", "3.4", "4.1"] },
    { "id": 5, "tasks": ["4.2"] },
    { "id": 6, "tasks": ["5"] },
    { "id": 7, "tasks": ["6.1"] },
    { "id": 8, "tasks": ["6.2", "6.3"] },
    { "id": 9, "tasks": ["6.4", "6.5", "7.1"] },
    { "id": 10, "tasks": ["7.2"] },
    { "id": 11, "tasks": ["7.3", "7.4", "7.5", "7.6"] },
    { "id": 12, "tasks": ["8"] },
    { "id": 13, "tasks": ["9.1"] },
    { "id": 14, "tasks": ["9.2", "9.3"] },
    { "id": 15, "tasks": ["9.4", "10.1"] },
    { "id": 16, "tasks": ["10.2"] },
    { "id": 17, "tasks": ["11"] },
    { "id": 18, "tasks": ["12"] }
  ]
}
```
