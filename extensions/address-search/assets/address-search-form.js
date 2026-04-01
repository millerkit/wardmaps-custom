function debounce(fn, wait) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(function () {
      return fn.apply(this, args);
    }, wait);
  };
}

class AddressSearchForm extends HTMLElement {
  constructor() {
    super();
    // Select the primary search input and reset button from within this element
    this.input = this.querySelector('input[type="search"]');
    this.resetButton = this.querySelector('button[type="reset"]');

    // Also select all search inputs from the document (for syncing)
    this.allSearchInputs = document.querySelectorAll('input[type="search"]');

    if (this.input) {
      // Listen for form reset on the input's form
      this.input.form.addEventListener("reset", this.onFormReset.bind(this));

      // Listen for input changes with debouncing
      this.input.addEventListener(
        "input",
        debounce((event) => {
          this.onChange(event);
        }, 300).bind(this),
      );

      // Listen for focus to scroll into view on small screens
      this.input.addEventListener("focus", this.onInputFocus.bind(this));
    }

    // Setup additional event listeners if multiple search forms exist
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Create an array of forms for every search input
    let allSearchForms = [];
    this.allSearchInputs.forEach((input) => allSearchForms.push(input.form));

    // If there is only one form, nothing further to sync
    if (allSearchForms.length < 2) return;

    // For each form, add listeners for reset and submit events
    allSearchForms.forEach((form) =>
      form.addEventListener("reset", this.onFormReset.bind(this)),
    );
    allSearchForms.forEach((form) =>
      form.addEventListener("submit", this.onFormSubmit.bind(this)),
    );

    // For each search input, listen for input events to keep forms in sync
    this.allSearchInputs.forEach((input) =>
      input.addEventListener("input", this.onInput.bind(this)),
    );
  }

  // Toggles the visibility of the reset button based on input length
  toggleResetButton() {
    const resetIsHidden = this.resetButton.classList.contains("hidden");
    if (this.input.value.length > 0 && resetIsHidden) {
      this.resetButton.classList.remove("hidden");
    } else if (this.input.value.length === 0 && !resetIsHidden) {
      this.resetButton.classList.add("hidden");
    }
  }

  onChange() {
    this.toggleResetButton();
  }

  // Determines if the form should be reset by checking if any predictive search option is selected
  shouldResetForm() {
    return !document.querySelector('[aria-selected="true"] a');
  }

  // Handler for form reset events
  onFormReset(event) {
    // Prevent default so that resetting doesn't override URL-provided values
    event.preventDefault();
    // Only reset if no predictive search option is selected
    if (this.shouldResetForm()) {
      this.input.value = "";
      this.input.focus();
      this.toggleResetButton();
      // If there are multiple inputs, ensure all are reset
      this.keepInSync("", this.input);
    }
  }

  // Prevent form submission and potentially other side effects
  onFormSubmit(event) {
    event.preventDefault();
  }

  // Sync the value of all search inputs to match the input that triggered the event
  onInput(event) {
    const target = event.target;
    this.keepInSync(target.value, target);
  }

  // When an input gains focus on small screens, scroll the element into view
  onInputFocus() {
    const isSmallScreen = window.innerWidth < 750;
    if (isSmallScreen) {
      this.scrollIntoView({ behavior: "smooth" });
    }
  }

  // Update all search inputs (except the one that triggered the event) with the given value
  keepInSync(value, target) {
    this.allSearchInputs.forEach((input) => {
      if (input !== target) {
        input.value = value;
      }
    });
  }
}

customElements.define("address-search-form", AddressSearchForm);
