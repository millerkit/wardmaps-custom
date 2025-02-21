function debounce(fn, wait) {
	let t;
	return function (...args) {
		clearTimeout(t);
		t = setTimeout(function () {
			return fn.apply(this, args);
		}, wait);
	}
}

class CustomSearchForm extends HTMLElement {
	constructor() {
		super();
		this.input = this.querySelector('input[type="search"]');
		this.resetButton = this.querySelector('button[type="reset"]');

		if (this.input) {
			this.input.form.addEventListener('reset', this.onFormReset.bind(this));
			this.input.addEventListener(
					'input',
					debounce((event) => {
						this.onChange(event);
					}, 300).bind(this)
			);
		}
	}

	toggleResetButton() {
		const resetIsHidden = this.resetButton.classList.contains('hidden');
		if (this.input.value.length > 0 && resetIsHidden) {
			this.resetButton.classList.remove('hidden');
		} else if (this.input.value.length === 0 && !resetIsHidden) {
			this.resetButton.classList.add('hidden');
		}
	}

	onChange() {
		this.toggleResetButton();
	}

	shouldResetForm() {
		return !document.querySelector('[aria-selected="true"] a');
	}

	onFormReset(event) {
		// Prevent default so the form reset doesn't set the value gotten from the url on page load
		event.preventDefault();
		// Don't reset if the user has selected an element on the predictive search dropdown
		if (this.shouldResetForm()) {
			this.input.value = '';
			this.input.focus();
			this.toggleResetButton();
		}
	}
}

class AddressSearchForm extends CustomSearchForm {

	constructor() {
		super();
		this.allSearchInputs = document.querySelectorAll('input[type="search"]');
		this.resetButton = this.querySelector('button[type="reset"]');
		this.setupEventListeners();
	}

	setupEventListeners() {
		let allSearchForms = [];
		this.allSearchInputs.forEach((input) => allSearchForms.push(input.form));
		this.input.addEventListener('focus', this.onInputFocus.bind(this));
		if (allSearchForms.length < 2) return;

		allSearchForms.forEach((form) => form.addEventListener('reset', this.onFormReset.bind(this)));
		allSearchForms.forEach((form) => form.addEventListener('submit', this.onFormSubmit.bind(this)));

		this.allSearchInputs.forEach((input) => input.addEventListener('input', this.onInput.bind(this)));
	}

	onFormSubmit(event) {
		// console.log("address-search-form.js onFormSubmit")
		event.preventDefault();
	}

	onFormReset(event) {
		super.onFormReset(event);
		if (super.shouldResetForm()) {
			this.keepInSync('', this.input);
		}
	}

	onInput(event) {
		const target = event.target;
		this.keepInSync(target.value, target);
	}

	onInputFocus() {
		const isSmallScreen = window.innerWidth < 750;
		if (isSmallScreen) {
			this.scrollIntoView({behavior: 'smooth'});
		}
	}

	keepInSync(value, target) {
		this.allSearchInputs.forEach((input) => {
			if (input !== target) {
				input.value = value;
			}
		});
	}
}

customElements.define('address-search-form', AddressSearchForm);

