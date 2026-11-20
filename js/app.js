/**
 * To Do List Life Dashboard — Main Application Script
 *
 * Module structure (all in this file):
 *   1. StorageService   — localStorage wrapper with error handling
 *   2. ClockService     — shared 1 s interval, drives GreetingWidget and FocusTimer
 *   3. GreetingWidget   — time, date, and time-of-day greeting display
 *   4. FocusTimer       — 25-minute Pomodoro countdown timer
 *   5. TaskList         — to-do CRUD with localStorage persistence
 *   6. QuickLinks       — URL shortcut buttons with localStorage persistence
 *   7. init             — DOMContentLoaded entry point
 */

// ─── 1. StorageService ────────────────────────────────────────────────────────
// Centralises all localStorage access. All widgets communicate with storage
// exclusively through this module. Requirements: 8.1, 8.2, 8.5

const StorageService = {
  /**
   * Tests whether localStorage is available by performing a sentinel write,
   * read, and delete. Returns true on success, false if any exception is
   * thrown (e.g. SecurityError in private-browsing mode).
   *
   * @returns {boolean}
   */
  isAvailable() {
    const TEST_KEY = "__storage_test__";
    try {
      localStorage.setItem(TEST_KEY, "1");
      localStorage.getItem(TEST_KEY);
      localStorage.removeItem(TEST_KEY);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Reads and JSON-parses the value stored at `key`. Returns null if the key
   * is absent, the stored value is not valid JSON, or any other exception
   * occurs (e.g. SecurityError).
   *
   * @param {string} key
   * @returns {any|null}
   */
  read(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch (e) {
      return null;
    }
  },

  /**
   * JSON-serialises `value` and writes it to localStorage at `key`. Returns
   * true on success. Returns false on QuotaExceededError (storage full) or
   * SecurityError (access denied).
   *
   * @param {string} key
   * @param {any} value
   * @returns {boolean}
   */
  write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      // QuotaExceededError name varies by browser:
      //   Chrome/Firefox : "QuotaExceededError"
      //   Safari legacy  : "QUOTA_EXCEEDED_ERR" (e.code === 22)
      if (
        e.name === "QuotaExceededError" ||
        e.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
        e.code === 22 ||
        e.name === "SecurityError"
      ) {
        return false;
      }
      return false;
    }
  },
};

// ─── 2. ClockService ──────────────────────────────────────────────────────────
// Owns the single shared setInterval that drives GreetingWidget and FocusTimer.
// Other modules register tick callbacks via subscribe(). Requirements: 1.2

const ClockService = {
  /** @type {Array<(now: Date) => void>} */
  _callbacks: [],

  /**
   * Adds a callback to the tick list. The callback will receive a `Date`
   * object on every tick (and immediately when `start()` is called).
   *
   * @param {(now: Date) => void} callback
   */
  subscribe(callback) {
    this._callbacks.push(callback);
  },

  /**
   * Fires all registered callbacks immediately with the current time, then
   * starts a 1 000 ms interval that fires them on each subsequent tick.
   * Calling `start()` more than once is safe — it simply adds another
   * interval — but the intended usage is to call it once during init.
   */
  start() {
    const tick = () => {
      const now = new Date();
      this._callbacks.forEach((cb) => cb(now));
    };
    tick(); // fire immediately so the UI is populated without a 1 s delay
    setInterval(tick, 1000);
  },

  /**
   * Removes a previously registered callback from the tick list. Splices
   * the first matching reference out of the internal array; subsequent ticks
   * will no longer invoke it.
   *
   * @param {(now: Date) => void} callback
   */
  unsubscribe(callback) {
    const index = this._callbacks.indexOf(callback);
    if (index !== -1) {
      this._callbacks.splice(index, 1);
    }
  },
};

// ─── 3. GreetingWidget ────────────────────────────────────────────────────────
// Displays the current time, date, and a time-of-day greeting.
// Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7

const GreetingWidget = {
  /** @type {{ time: HTMLElement, date: HTMLElement, greeting: HTMLElement }} */
  _elements: null,

  /** Day names and month names used by the date formatter. */
  _DAYS: [
    "Sunday", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday",
  ],
  _MONTHS: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],

  /**
   * Returns the appropriate greeting string for the given hour (0–23).
   *
   * | Hours      | Greeting         |
   * |------------|------------------|
   * | 05 – 11    | Good Morning     |
   * | 12 – 17    | Good Afternoon   |
   * | 18 – 20    | Good Evening     |
   * | 21–23, 0–4 | Good Night       |
   *
   * @param {number} hour  Integer in the range 0–23.
   * @returns {"Good Morning"|"Good Afternoon"|"Good Evening"|"Good Night"}
   */
  _selectGreeting(hour) {
    if (hour >= 5 && hour <= 11) return "Good Morning";
    if (hour >= 12 && hour <= 17) return "Good Afternoon";
    if (hour >= 18 && hour <= 20) return "Good Evening";
    return "Good Night"; // covers 21–23 and 0–4
  },

  /**
   * Called on each ClockService tick. Updates the three DOM elements with
   * the current time (HH:MM), date ("Day, DD Month YYYY"), and greeting.
   *
   * @param {Date} now
   */
  onTick(now) {
    // ── Time: HH:MM (zero-padded) ───────────────────────────────────────────
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    this._elements.time.textContent = `${hours}:${minutes}`;

    // ── Date: "Day, DD Month YYYY" ──────────────────────────────────────────
    const dayName = this._DAYS[now.getDay()];
    const day = String(now.getDate()).padStart(2, "0");
    const monthName = this._MONTHS[now.getMonth()];
    const year = now.getFullYear();
    this._elements.date.textContent = `${dayName}, ${day} ${monthName} ${year}`;

    // ── Greeting ────────────────────────────────────────────────────────────
    this._elements.greeting.textContent = this._selectGreeting(now.getHours());
  },

  /**
   * Stores DOM element references and subscribes `onTick` to the shared
   * ClockService so the widget updates on every clock tick.
   *
   * @param {{ time: HTMLElement, date: HTMLElement, greeting: HTMLElement }} elements
   */
  init(elements) {
    this._elements = elements;
    ClockService.subscribe((now) => this.onTick(now));
  },
};

// ─── 4. FocusTimer ────────────────────────────────────────────────────────────
// 25-minute Pomodoro countdown timer driven by ClockService ticks.
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10

const FocusTimer = {
  /** Total seconds for one Pomodoro session. */
  INITIAL_SECONDS: 1500,

  /** @type {number} Seconds remaining in the current session. */
  remainingSeconds: 1500,

  /** @type {boolean} Whether the timer is currently counting down. */
  isRunning: false,

  /** @type {{ display: HTMLElement, startBtn: HTMLButtonElement, stopBtn: HTMLButtonElement, resetBtn: HTMLButtonElement }} */
  _elements: null,

  /**
   * Formats `remainingSeconds` as a zero-padded `MM:SS` string and writes it
   * to the `#timer-display` element.
   */
  _updateDisplay() {
    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = this.remainingSeconds % 60;
    this._elements.display.textContent =
      String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
  },

  /**
   * Enables / disables the start and stop buttons based on current state:
   *
   * | State                        | start   | stop    |
   * |------------------------------|---------|---------|
   * | Idle (not running, time > 0) | enabled | disabled|
   * | Running                      | disabled| enabled |
   * | Expired (00:00)              | disabled| disabled|
   */
  _updateButtonStates() {
    const expired = this.remainingSeconds === 0;
    this._elements.startBtn.disabled = this.isRunning || expired;
    this._elements.stopBtn.disabled = !this.isRunning;
  },

  /**
   * Plays a short beep using the Web Audio API to alert the user that the
   * session has ended. Any failure (e.g. AudioContext blocked by browser
   * policy) is caught silently so the timer still works without audio.
   */
  _playAlert() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 1.5); // ≥1 s duration
    } catch (e) {
      // Audio unavailable — skip silently.
    }
  },

  /**
   * Called when `remainingSeconds` reaches zero. Stops the countdown,
   * marks the display as expired, plays the alert beep, and disables the
   * start button so the user must reset before starting again.
   */
  _onExpiry() {
    this.stop();
    this._elements.display.classList.add("expired");
    this._playAlert();
    this._elements.startBtn.disabled = true;
  },

  /**
   * Binds `onTick` as a ClockService callback and flips `isRunning` to true,
   * then refreshes the button states.
   */
  start() {
    if (this.isRunning || this.remainingSeconds === 0) return;
    this.isRunning = true;
    ClockService.subscribe(this._boundOnTick);
    this._updateButtonStates();
  },

  /**
   * Removes `onTick` from the ClockService tick list and flips `isRunning`
   * to false, then refreshes the button states.
   */
  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    ClockService.unsubscribe(this._boundOnTick);
    this._updateButtonStates();
  },

  /**
   * Stops the timer, restores `remainingSeconds` to `INITIAL_SECONDS`,
   * removes the `expired` CSS class, and refreshes the display and buttons.
   */
  reset() {
    this.stop();
    this.remainingSeconds = this.INITIAL_SECONDS;
    this._elements.display.classList.remove("expired");
    this._updateDisplay();
    this._updateButtonStates();
  },

  /**
   * Called on each ClockService tick while the timer is running. Decrements
   * `remainingSeconds` by one, refreshes the display, and triggers expiry
   * handling when the countdown reaches zero.
   *
   * @param {Date} _now  Current time (unused — the timer counts elapsed ticks).
   */
  onTick(_now) {
    if (!this.isRunning) return;
    this.remainingSeconds -= 1;
    this._updateDisplay();
    if (this.remainingSeconds === 0) {
      this._onExpiry();
    }
  },

  /**
   * Stores DOM element references, attaches click listeners to the three
   * control buttons, and sets the initial display and button states.
   *
   * @param {{ display: HTMLElement, startBtn: HTMLButtonElement, stopBtn: HTMLButtonElement, resetBtn: HTMLButtonElement }} elements
   */
  init(elements) {
    this._elements = elements;

    // Bind `onTick` once so the same reference can be passed to both
    // subscribe and unsubscribe (required for identity-based removal).
    this._boundOnTick = (now) => this.onTick(now);

    this._elements.startBtn.addEventListener("click", () => this.start());
    this._elements.stopBtn.addEventListener("click", () => this.stop());
    this._elements.resetBtn.addEventListener("click", () => this.reset());

    this._updateDisplay();
    this._updateButtonStates();
  },
};

// ─── 5. TaskList ──────────────────────────────────────────────────────────────
// To-do CRUD with localStorage persistence.
// Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1–4.6, 5.1–5.6, 8.1–8.5

const TaskList = {
  MAX_DESCRIPTION_LENGTH: 200,
  MAX_EDIT_LENGTH: 500,
  MAX_TASKS: 100,
  STORAGE_KEY: "tldash_tasks",

  /** @type {Array<{ id: string, description: string, completed: boolean, createdAt: number }>} */
  tasks: [],

  /** @type {{ container: HTMLElement, input: HTMLInputElement, submitBtn: HTMLButtonElement, errorMsg: HTMLElement }} */
  _elements: null,

  // ── Task 6.1 ────────────────────────────────────────────────────────────────

  /**
   * Reads the task array from localStorage. On null result (key absent or
   * parse error), initialises tasks to [] and shows an inline error.
   * Requirements: 3.6, 3.7, 8.2
   */
  _loadFromStorage() {
    const data = StorageService.read(this.STORAGE_KEY);
    if (data === null) {
      this.tasks = [];
      // Only show the load-error message if there was a key present but it was
      // unreadable; a fresh install returns null for a missing key (expected).
      // We distinguish by checking whether the raw key exists in localStorage.
      try {
        if (localStorage.getItem(this.STORAGE_KEY) !== null) {
          this._showError("Tasks could not be loaded. Starting with an empty list.");
        }
      } catch (_e) {
        // Storage completely unavailable — warning banner handles this.
      }
    } else {
      this.tasks = Array.isArray(data) ? data : [];
    }
  },

  /**
   * Serialises the current tasks array to localStorage.
   * Returns false and shows an inline error if the write fails.
   * Requirements: 3.4, 3.5, 8.3, 8.5
   *
   * @returns {boolean}
   */
  _saveToStorage() {
    const ok = StorageService.write(this.STORAGE_KEY, this.tasks);
    if (!ok) {
      this._showError("The change could not be saved. Please try again.");
      return false;
    }
    return true;
  },

  /**
   * Displays an inline validation / error message below the task form.
   *
   * @param {string} message
   */
  _showError(message) {
    this._elements.errorMsg.textContent = message;
  },

  /** Clears the inline error message. */
  _clearError() {
    this._elements.errorMsg.textContent = "";
  },

  // ── Task 6.2 ────────────────────────────────────────────────────────────────

  /**
   * Validates task description text.
   *
   * @param {string} text
   * @param {number} maxLen
   * @returns {{ valid: boolean, reason?: string }}
   */
  _validate(text, maxLen) {
    if (text.trim().length === 0) {
      return { valid: false, reason: "Task description cannot be empty." };
    }
    if (text.trim().length > maxLen) {
      return {
        valid: false,
        reason: `Task description cannot exceed ${maxLen} characters.`,
      };
    }
    return { valid: true };
  },

  /**
   * Closes any currently open inline edit input in the task list.
   * Finds the first open edit input and triggers its cancel button.
   */
  _closeOpenEdits() {
    const openCancel = this._elements.container.querySelector(
      "button[data-action='cancel-edit']"
    );
    if (openCancel) openCancel.click();
  },

  /**
   * Builds and returns a `<li>` element for the given task.
   * Contains: checkbox, description span, Edit button, Delete button.
   * Requirements: 4.1, 4.2, 5.1, 5.4
   *
   * @param {{ id: string, description: string, completed: boolean, createdAt: number }} task
   * @returns {HTMLLIElement}
   */
  _renderTask(task) {
    const li = document.createElement("li");
    li.dataset.id = task.id;

    // ── Completion checkbox ────────────────────────────────────────────────
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Mark "${task.description}" as ${task.completed ? "incomplete" : "complete"}`);
    checkbox.addEventListener("change", () => this.toggleComplete(task.id));

    // ── Description span ───────────────────────────────────────────────────
    const span = document.createElement("span");
    span.textContent = task.description;
    if (task.completed) {
      span.classList.add("completed");
    }

    // ── Edit button ────────────────────────────────────────────────────────
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.textContent = "Edit";
    editBtn.setAttribute("aria-label", `Edit task: ${task.description}`);
    editBtn.addEventListener("click", () => {
      // Close any other open edit first (Requirement 4.2)
      this._closeOpenEdits();

      // Replace span + editBtn with an inline edit input
      const editInput = document.createElement("input");
      editInput.type = "text";
      editInput.value = task.description;
      editInput.maxLength = this.MAX_EDIT_LENGTH;
      editInput.setAttribute("aria-label", "Edit task description");

      const confirmBtn = document.createElement("button");
      confirmBtn.type = "button";
      confirmBtn.textContent = "Confirm";
      confirmBtn.dataset.action = "confirm-edit";

      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.textContent = "Cancel";
      cancelBtn.dataset.action = "cancel-edit";

      // Confirm handler
      confirmBtn.addEventListener("click", () => {
        this.editTask(task.id, editInput.value);
      });

      // Cancel handler — restore original display without changes
      cancelBtn.addEventListener("click", () => {
        li.replaceChild(span, editInput);
        li.replaceChild(editBtn, confirmBtn);
        li.removeChild(cancelBtn);
      });

      li.replaceChild(editInput, span);
      li.replaceChild(confirmBtn, editBtn);
      li.insertBefore(cancelBtn, confirmBtn.nextSibling);

      editInput.focus();
    });

    // ── Delete button ──────────────────────────────────────────────────────
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "Delete";
    deleteBtn.setAttribute("aria-label", `Delete task: ${task.description}`);
    deleteBtn.addEventListener("click", () => this.deleteTask(task.id));

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);

    return li;
  },

  /**
   * Clears and re-renders the entire task list from the in-memory tasks array.
   * Requirements: 3.6
   */
  _renderAll() {
    this._elements.container.innerHTML = "";
    this.tasks.forEach((task) => {
      this._elements.container.appendChild(this._renderTask(task));
    });
  },

  /**
   * Validates, creates, persists, and renders a new task.
   * Reverts the push if the storage write fails.
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
   *
   * @param {string} description
   */
  addTask(description) {
    const trimmed = (description || "").trim();
    const validation = this._validate(trimmed, this.MAX_DESCRIPTION_LENGTH);
    if (!validation.valid) {
      this._showError(validation.reason);
      return;
    }

    if (this.tasks.length >= this.MAX_TASKS) {
      this._showError(`You can have at most ${this.MAX_TASKS} tasks.`);
      return;
    }

    const task = {
      id: (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID()
        : Date.now().toString(),
      description: trimmed,
      completed: false,
      createdAt: Date.now(),
    };

    this.tasks.push(task);

    if (!this._saveToStorage()) {
      // Revert — storage write failed; error message already shown
      this.tasks.pop();
      return;
    }

    // Success
    this._elements.input.value = "";
    this._clearError();
    this._renderAll();
  },

  /**
   * Updates a task description in memory and storage.
   * Called by the inline edit confirm handler.
   * Requirements: 4.3, 4.4, 4.6, 8.3
   *
   * @param {string} id
   * @param {string} newDescription
   */
  editTask(id, newDescription) {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return;

    const trimmed = (newDescription || "").trim();
    const validation = this._validate(trimmed, this.MAX_EDIT_LENGTH);
    if (!validation.valid) {
      this._showError(validation.reason);
      return;
    }

    const originalDescription = this.tasks[index].description;
    this.tasks[index].description = trimmed;

    if (!this._saveToStorage()) {
      // Revert
      this.tasks[index].description = originalDescription;
      return;
    }

    this._clearError();
    this._renderAll();
  },

  /**
   * Flips a task's completed state, persists, and re-renders.
   * Reverts on storage failure.
   * Requirements: 5.2, 5.3, 5.6, 8.3
   *
   * @param {string} id
   */
  toggleComplete(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return;

    task.completed = !task.completed;

    if (!this._saveToStorage()) {
      // Revert
      task.completed = !task.completed;
      return;
    }

    this._renderAll();
  },

  /**
   * Removes a task from memory and storage, then re-renders.
   * Reverts on storage failure.
   * Requirements: 5.5, 5.6, 8.3
   *
   * @param {string} id
   */
  deleteTask(id) {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return;

    const removed = this.tasks.splice(index, 1);

    if (!this._saveToStorage()) {
      // Revert
      this.tasks.splice(index, 0, ...removed);
      return;
    }

    this._renderAll();
  },

  /**
   * Stores DOM element references, loads persisted tasks, renders them,
   * and wires the add-task form controls.
   * Requirements: 3.1, 3.6
   *
   * @param {{ container: HTMLElement, input: HTMLInputElement, submitBtn: HTMLButtonElement, errorMsg: HTMLElement }} elements
   */
  init(elements) {
    this._elements = elements;

    this._loadFromStorage();
    this._renderAll();

    // Submit button click
    elements.submitBtn.addEventListener("click", () => {
      this.addTask(elements.input.value);
    });

    // Enter key in input
    elements.input.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        this.addTask(elements.input.value);
      }
    });

    // Clear error when user starts typing
    elements.input.addEventListener("input", () => {
      this._clearError();
    });
  },
};

// ─── 6. QuickLinks ────────────────────────────────────────────────────────────
// URL shortcut buttons with localStorage persistence.
// Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 7.1, 7.2, 7.3

const QuickLinks = {
  MAX_LINKS: 50,
  MAX_LABEL_LENGTH: 50,
  STORAGE_KEY: "tldash_links",

  /** @type {Array<{ id: string, label: string, url: string }>} */
  links: [],

  /** @type {{ container: HTMLElement, labelInput: HTMLInputElement, urlInput: HTMLInputElement, submitBtn: HTMLButtonElement, errorMsg: HTMLElement }} */
  _elements: null,

  // ── Task 9.1 ────────────────────────────────────────────────────────────────

  /**
   * Reads the links array from localStorage. On null result (key absent or
   * parse error), initialises links to [] and shows an inline error if the
   * raw key was present (indicating a corrupt value, not a fresh install).
   * Requirements: 6.7, 6.8, 8.2
   */
  _loadFromStorage() {
    const data = StorageService.read(this.STORAGE_KEY);
    if (data === null) {
      this.links = [];
      try {
        if (localStorage.getItem(this.STORAGE_KEY) !== null) {
          this._showError("Links could not be loaded. Starting with an empty list.");
        }
      } catch (_e) {
        // Storage completely unavailable — warning banner handles this.
      }
    } else {
      this.links = Array.isArray(data) ? data : [];
    }
  },

  /**
   * Serialises the current links array to localStorage.
   * Returns false and shows an inline error if the write fails.
   * Requirements: 6.5, 7.3, 8.3, 8.5
   *
   * @returns {boolean}
   */
  _saveToStorage() {
    const ok = StorageService.write(this.STORAGE_KEY, this.links);
    if (!ok) {
      this._showError("The change could not be saved. Please try again.");
      return false;
    }
    return true;
  },

  /**
   * Displays an inline validation / error message below the link form.
   *
   * @param {string} message
   */
  _showError(message) {
    this._elements.errorMsg.textContent = message;
  },

  /** Clears the inline error message. */
  _clearError() {
    this._elements.errorMsg.textContent = "";
  },

  /**
   * Returns true only if `url` begins with "http://" or "https://".
   * Requirements: 6.2, 6.3
   *
   * @param {string} url
   * @returns {boolean}
   */
  _validateUrl(url) {
    return (
      typeof url === "string" &&
      (url.startsWith("http://") || url.startsWith("https://"))
    );
  },

  /**
   * Validates, creates, persists, and renders a new link.
   * Reverts the push if the storage write fails.
   * Requirements: 6.1, 6.2, 6.3, 6.5, 6.6, 6.7, 6.8
   *
   * @param {string} label
   * @param {string} url
   */
  addLink(label, url) {
    const trimmedLabel = (label || "").trim();

    if (trimmedLabel.length === 0) {
      this._showError("Link label cannot be empty.");
      return;
    }
    if (trimmedLabel.length > this.MAX_LABEL_LENGTH) {
      this._showError("Link label cannot exceed 50 characters.");
      return;
    }
    if (!this._validateUrl(url)) {
      this._showError("URL must start with http:// or https://.");
      return;
    }
    if (this.links.length >= this.MAX_LINKS) {
      this._showError("You can save at most 50 links.");
      return;
    }

    const link = {
      id: (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID()
        : Date.now().toString(),
      label: trimmedLabel,
      url: url,
    };

    this.links.push(link);

    if (!this._saveToStorage()) {
      // Revert — storage write failed; error message already shown
      this.links.pop();
      return;
    }

    // Success
    this._elements.labelInput.value = "";
    this._elements.urlInput.value = "";
    this._clearError();
    this._renderAll();
  },

  // ── Task 9.2 ────────────────────────────────────────────────────────────────

  /**
   * Builds and returns a container `<div>` for the given link.
   * Contains: a clickable button that opens the URL in a new tab, and a
   * delete button.
   * Requirements: 6.4, 7.1, 7.2
   *
   * @param {{ id: string, label: string, url: string }} link
   * @returns {HTMLDivElement}
   */
  _renderLink(link) {
    const container = document.createElement("div");
    container.classList.add("link-item");

    // ── Link button ────────────────────────────────────────────────────────
    const linkBtn = document.createElement("button");
    linkBtn.type = "button";
    linkBtn.textContent = link.label;
    linkBtn.setAttribute("aria-label", `Open link: ${link.label}`);
    linkBtn.addEventListener("click", () => {
      window.open(link.url, "_blank", "noopener");
    });

    // ── Delete button ──────────────────────────────────────────────────────
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "Delete";
    deleteBtn.setAttribute("aria-label", `Delete link: ${link.label}`);
    deleteBtn.addEventListener("click", () => this.deleteLink(link.id));

    container.appendChild(linkBtn);
    container.appendChild(deleteBtn);

    return container;
  },

  /**
   * Clears and re-renders the entire links list from the in-memory links array.
   * Requirements: 6.4
   */
  _renderAll() {
    this._elements.container.innerHTML = "";
    this.links.forEach((link) => {
      this._elements.container.appendChild(this._renderLink(link));
    });
  },

  /**
   * Removes a link from memory and storage, then re-renders.
   * Reverts on storage failure.
   * Requirements: 7.1, 7.2, 7.3
   *
   * @param {string} id
   */
  deleteLink(id) {
    const index = this.links.findIndex((l) => l.id === id);
    if (index === -1) return;

    const removed = this.links.splice(index, 1);

    if (!this._saveToStorage()) {
      // Revert — storage write failed; error message already shown
      this.links.splice(index, 0, ...removed);
      return;
    }

    this._renderAll();
  },

  /**
   * Stores DOM element references, loads persisted links, renders them,
   * and wires the add-link form controls.
   * Requirements: 6.1, 6.7
   *
   * @param {{ container: HTMLElement, labelInput: HTMLInputElement, urlInput: HTMLInputElement, submitBtn: HTMLButtonElement, errorMsg: HTMLElement }} elements
   */
  init(elements) {
    this._elements = elements;

    this._loadFromStorage();
    this._renderAll();

    // Submit button click
    elements.submitBtn.addEventListener("click", () => {
      this.addLink(elements.labelInput.value, elements.urlInput.value);
    });

    // Clear error when user starts typing in either input
    elements.labelInput.addEventListener("input", () => {
      this._clearError();
    });
    elements.urlInput.addEventListener("input", () => {
      this._clearError();
    });
  },
};

// ─── 7. init ──────────────────────────────────────────────────────────────────
// DOMContentLoaded entry point — wires all widgets and starts the clock.
// Requirements: 8.2, 9.1, 9.3, 9.4

document.addEventListener("DOMContentLoaded", () => {
  // ── Storage availability check ─────────────────────────────────────────────
  if (!StorageService.isAvailable()) {
    const banner = document.getElementById("storage-warning");
    if (banner) {
      banner.hidden = false;
      const dismissBtn = document.getElementById("storage-warning-dismiss");
      if (dismissBtn) {
        dismissBtn.addEventListener("click", () => {
          banner.hidden = true;
        });
      }
    }
  }

  // ── Greeting Widget ────────────────────────────────────────────────────────
  GreetingWidget.init({
    time: document.getElementById("greeting-time"),
    date: document.getElementById("greeting-date"),
    greeting: document.getElementById("greeting-message"),
  });

  // ── Focus Timer ────────────────────────────────────────────────────────────
  FocusTimer.init({
    display: document.getElementById("timer-display"),
    startBtn: document.getElementById("timer-start"),
    stopBtn: document.getElementById("timer-stop"),
    resetBtn: document.getElementById("timer-reset"),
  });

  // ── Task List ──────────────────────────────────────────────────────────────
  TaskList.init({
    container: document.getElementById("task-container"),
    input: document.getElementById("task-input"),
    submitBtn: document.getElementById("task-submit"),
    errorMsg: document.getElementById("task-error"),
  });

  // ── Quick Links ────────────────────────────────────────────────────────────
  QuickLinks.init({
    container: document.getElementById("links-container"),
    labelInput: document.getElementById("link-label-input"),
    urlInput: document.getElementById("link-url-input"),
    submitBtn: document.getElementById("link-submit"),
    errorMsg: document.getElementById("link-error"),
  });

  // ── Start the shared clock (drives GreetingWidget and FocusTimer) ──────────
  ClockService.start();
});
