# Requirements Document

## Introduction

The To Do List Life Dashboard is a client-side web application built with HTML, CSS, and Vanilla JavaScript. It provides a personal productivity hub that combines a time-aware greeting, a Pomodoro-style focus timer, a persistent to-do list, and a customizable quick-links panel — all stored in the browser's Local Storage with no backend required. The application runs as a standalone web page or browser extension in any modern browser.

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Greeting_Widget**: The UI section that displays the current time, date, and a time-of-day greeting message.
- **Focus_Timer**: The UI section that runs a 25-minute countdown timer with start, stop, and reset controls.
- **Task_List**: The UI section that manages the collection of user-defined to-do items.
- **Task**: A single to-do item with a text description and a completion state.
- **Quick_Links**: The UI section that displays user-saved shortcut buttons that open external URLs.
- **Link**: A single quick-link entry with a display label and a URL.
- **Storage**: The browser's `localStorage` API used to persist data client-side.
- **Modern_Browser**: Chrome, Firefox, Edge, or Safari at their current stable release.

---

## Requirements

### Requirement 1: Greeting Widget

**User Story:** As a user, I want to see the current time, date, and a personalized greeting when I open the Dashboard, so that I am immediately oriented to the time of day without leaving the page.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Greeting_Widget SHALL display the current time in HH:MM 24-hour format using the browser's local clock.
2. WHILE the Dashboard is open, THE Greeting_Widget SHALL update the displayed time every 60 seconds to reflect the current HH:MM value.
3. WHEN the Dashboard loads, THE Greeting_Widget SHALL display the current date in the format "Day, DD Month YYYY" (e.g., Monday, 16 November 2026) using the browser's local clock.
4. IF the browser's local time is between 05:00 and 11:59 inclusive, THEN THE Greeting_Widget SHALL display the greeting "Good Morning".
5. IF the browser's local time is between 12:00 and 17:59 inclusive, THEN THE Greeting_Widget SHALL display the greeting "Good Afternoon".
6. IF the browser's local time is between 18:00 and 20:59 inclusive, THEN THE Greeting_Widget SHALL display the greeting "Good Evening".
7. IF the browser's local time is between 21:00 and 23:59 inclusive, or between 00:00 and 04:59 inclusive, THEN THE Greeting_Widget SHALL display the greeting "Good Night".

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with start, stop, and reset controls, so that I can use the Pomodoro technique to manage focused work sessions.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialize with a countdown value of 25 minutes and 00 seconds (25:00).
2. WHEN the user activates the start control, THE Focus_Timer SHALL begin counting down one second per real second.
3. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL update the displayed MM:SS value each second.
4. WHEN the user activates the stop control, THE Focus_Timer SHALL pause the countdown and retain the current remaining time.
5. WHEN the user activates the reset control, THE Focus_Timer SHALL stop any active countdown and restore the display to 25:00.
6. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and change the timer display to a visually distinct state (such as a color change or flashing indicator) that persists until the user activates the reset control.
7. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL play an audible alert sound of at least 1 second duration.
8. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL disable the start control to prevent duplicate activation.
9. IF the Focus_Timer is not counting down, THEN THE Focus_Timer SHALL disable the stop control.
10. IF the Focus_Timer display shows 00:00, THEN THE Focus_Timer SHALL disable the start control.

---

### Requirement 3: To-Do List — Add and Display Tasks

**User Story:** As a user, I want to add new tasks to my to-do list and see them displayed, so that I can track the work I need to complete.

#### Acceptance Criteria

1. THE Task_List SHALL provide a text input field and a submit control for entering new tasks.
2. WHEN the user submits a non-empty task description of 1 to 200 characters, THE Task_List SHALL add the task to the list and display it.
3. IF the user submits an empty, whitespace-only, or greater-than-200-character task description, THEN THE Task_List SHALL reject the submission and display an inline validation message indicating the reason for rejection.
4. WHEN a task is added, THE Task_List SHALL persist the updated task collection to Storage before confirming the display update, completing the write within 1 second.
5. IF Storage is unavailable when a task is submitted, THEN THE Task_List SHALL reject the submission and display an error message indicating the task could not be saved.
6. WHEN the Dashboard loads, THE Task_List SHALL read all previously saved tasks from Storage and render them in the same order they were added, displaying a maximum of 100 tasks.
7. IF Storage is unavailable or returns unreadable data when the Dashboard loads, THEN THE Task_List SHALL display an error message indicating tasks could not be loaded and render an empty list.

---

### Requirement 4: To-Do List — Edit Tasks

**User Story:** As a user, I want to edit the text of an existing task, so that I can correct or update it without deleting and re-adding it.

#### Acceptance Criteria

1. THE Task_List SHALL provide an edit control for each displayed task.
2. WHEN the user activates the edit control for a task, THE Task_List SHALL replace the task's display text with an editable input pre-filled with the current task description, and deactivate any other task's edit input that is currently open.
3. WHEN the user confirms the edit with a value between 1 and 500 characters after trimming leading and trailing whitespace, THE Task_List SHALL update the task description to the trimmed value and return to display mode showing the updated text.
4. IF the user confirms the edit with an empty or whitespace-only value, THEN THE Task_List SHALL reject the change, retain the original task description, and display an error message indicating that the task description cannot be blank.
5. WHEN the user cancels the edit, THE Task_List SHALL discard any changes and return to display mode without modifying the task.
6. WHEN a task description is updated, THE Task_List SHALL persist the updated task collection to Storage before returning to display mode.

---

### Requirement 5: To-Do List — Complete and Delete Tasks

**User Story:** As a user, I want to mark tasks as done and delete tasks I no longer need, so that I can maintain an accurate and clean task list.

#### Acceptance Criteria

1. THE Task_List SHALL provide a completion toggle control (e.g., a checkbox) for each task.
2. WHEN the user activates the completion toggle, THE Task_List SHALL update the task's completion state and apply a strikethrough style to the task text to indicate completion, and SHALL remove the strikethrough style when the task is toggled back to incomplete.
3. WHEN the completion state of a task changes, THE Task_List SHALL persist the updated task collection to Storage within 500 milliseconds.
4. THE Task_List SHALL provide a delete control for each task.
5. WHEN the user activates the delete control for a task, THE Task_List SHALL remove that task from the displayed list and from Storage within 500 milliseconds.
6. IF Storage is unavailable when persisting a completion state change or a deletion, THEN THE Task_List SHALL display an error message indicating the save failed and SHALL retain the task collection in its pre-action state.

---

### Requirement 6: Quick Links — Add and Display Links

**User Story:** As a user, I want to save shortcuts to my favorite websites as buttons on the Dashboard, so that I can open them with a single click.

#### Acceptance Criteria

1. THE Quick_Links SHALL provide input fields for a link label and a URL, plus a submit control for adding a new link, where the label field accepts at most 50 characters.
2. WHEN the user submits a non-empty label and a URL that begins with `http://` or `https://`, THE Quick_Links SHALL add the link and render it as a clickable button labeled with the submitted label.
3. IF the user submits an empty label or a URL that does not begin with `http://` or `https://`, THEN THE Quick_Links SHALL reject the submission and display an inline validation message identifying which field is invalid.
4. WHEN a link button is clicked, THE Quick_Links SHALL open the associated URL in a new browser tab.
5. WHEN a link is added, THE Quick_Links SHALL persist the updated link collection to Storage before rendering the new button, up to a maximum of 50 saved links.
6. IF the total number of saved links has reached 50, THEN THE Quick_Links SHALL reject any new submission and display an inline message indicating the limit has been reached.
7. WHEN the Dashboard loads, THE Quick_Links SHALL read all previously saved links from Storage and render them as buttons.
8. IF Storage is unavailable when the Dashboard loads, THEN THE Quick_Links SHALL render no link buttons and display an inline message indicating that saved links could not be loaded.

---

### Requirement 7: Quick Links — Delete Links

**User Story:** As a user, I want to remove quick links I no longer need, so that my links panel stays relevant and uncluttered.

#### Acceptance Criteria

1. THE Quick_Links SHALL provide a visible delete control for each displayed link button.
2. WHEN the user activates the delete control for a link, THE Quick_Links SHALL remove that link from the panel and persist the updated link collection to Storage before the display updates.
3. IF the Storage write fails when deleting a link, THEN THE Quick_Links SHALL retain the link in the panel and display an error message indicating the deletion could not be saved.

---

### Requirement 8: Data Persistence

**User Story:** As a user, I want my tasks and quick links to survive page refreshes, so that I do not need to re-enter data every time I open the Dashboard.

#### Acceptance Criteria

1. THE Dashboard SHALL store all Task and Link data exclusively in browser-local Storage (localStorage), with no network requests.
2. WHEN Storage is unavailable or returns a parse error, THE Dashboard SHALL initialize with an empty task list and an empty link list, and display a dismissible warning message within the Dashboard UI without blocking access to any controls.
3. WHEN any add, edit, complete, or delete operation on tasks completes, THE Dashboard SHALL write the full updated task collection to Storage so that a subsequent Storage read returns a collection identical to the current in-memory task state.
4. WHEN any add or delete operation on links completes, THE Dashboard SHALL write the full updated link collection to Storage so that a subsequent Storage read returns a collection identical to the current in-memory link state.
5. IF a Storage write fails during any add, edit, complete, or delete operation, THEN THE Dashboard SHALL display an error message indicating the change could not be saved and preserve the in-memory state without reverting the UI.

---

### Requirement 9: Browser Compatibility and Technical Constraints

**User Story:** As a user, I want the Dashboard to work reliably across modern browsers without any installation, so that I can use it anywhere.

#### Acceptance Criteria

1. THE Dashboard SHALL be implemented using only HTML, CSS, and Vanilla JavaScript — no external frameworks or libraries.
2. THE Dashboard SHALL function correctly in Chrome, Firefox, Edge, and Safari at their current stable releases.
3. THE Dashboard SHALL use a single CSS file for all styling.
4. THE Dashboard SHALL use a single JavaScript file for all application logic.
5. THE Dashboard SHALL load and become interactive — meaning all buttons, inputs, and controls respond to user input — in under 3 seconds on a connection speed of at least 25 Mbps download.
6. WHEN the user resizes the browser window, THE Dashboard SHALL maintain a layout where all content remains visible and no horizontal scrollbar appears at any viewport width of 320 px or greater.
