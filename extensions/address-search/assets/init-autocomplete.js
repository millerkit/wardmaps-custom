// this code adapted from
// https://configure.mapsplatform.google/place-picker

let lastValidatedAddress;

function getAddressFieldDiv() {
  return document.getElementById("addressFieldDiv");
}

function getGmpxPlacePickerElement() {
  return document.querySelector("gmpx-place-picker");
}

function getGmpxContainerDiv(gmpxPlacePickerElement) {
  const shadowRoot = gmpxPlacePickerElement.shadowRoot;
  return shadowRoot.querySelector("div.container");
}

function getInputElement(gmpxPlacePickerElement) {
  if (!gmpxPlacePickerElement) {
    gmpxPlacePickerElement = getGmpxPlacePickerElement();
  }

  const shadowRoot = gmpxPlacePickerElement.shadowRoot;
  return shadowRoot.querySelector("input.pac-target-input");
}

function setStyles() {
  const gmpxPlacePickerElement = getGmpxPlacePickerElement();

  // set styles on the root element
  gmpxPlacePickerElement.style.setProperty("width", "100");
  gmpxPlacePickerElement.style.setProperty("display", "flex");
  gmpxPlacePickerElement.style.setProperty("flex-grow", "1");

  // set styles on the container div
  const containerDiv = getGmpxContainerDiv(gmpxPlacePickerElement);
  containerDiv.style.setProperty("display", "flex");
  containerDiv.style.setProperty("flex-grow", "1");
  containerDiv.style.setProperty(
    "font-family",
    "var(--typeBasePrimary), serif",
  );

  containerDiv.style.setProperty("font-style", "normal");
  containerDiv.style.setProperty("font-weight", "var(--font-body-weight)");
  containerDiv.style.setProperty(
    "font-family",
    "var(--typeBasePrimary), var(--typeBaseFallback)",
  );
  containerDiv.style.setProperty("font-size", "var(--typeBaseSize)");
  containerDiv.style.setProperty("letter-spacing", "var(--typeBaseSpacing)");
  containerDiv.style.setProperty("line-height", "var(--typeBaseLineHeight)");
  containerDiv.style.setProperty("-webkit-font-smoothing", "antialiased");
  containerDiv.style.setProperty("-webkit-text-size-adjust", "100%");
  containerDiv.style.setProperty("text-rendering", "optimizeSpeed");

  // set styles on the input element
  const inputElement = getInputElement(gmpxPlacePickerElement);
  inputElement.style.setProperty("display", "flex");
  inputElement.style.setProperty("flex-grow", "1");
  inputElement.style.setProperty("appearance", "none");
  inputElement.style.setProperty(
    "background-color",
    "rgb(var(--color-background))",
  );
  inputElement.style.setProperty("color", "rgb(var(--color-foreground))");

  inputElement.style.setProperty("border-radius", "var(--inputs-radius)");
  inputElement.style.setProperty("box-sizing", "border-box");
  inputElement.style.setProperty(
    "transition",
    "box-shadow var(--duration-short) ease",
  );
  inputElement.style.setProperty("height", "4.5rem");
  inputElement.style.setProperty(
    "min-height",
    "calc(var(--inputs-border-width) * 2)",
  );
  inputElement.style.setProperty(
    "min-width",
    "calc(7rem + (var(--inputs-border-width) * 2))",
  );
  inputElement.style.setProperty("position", "relative");
  inputElement.style.setProperty("border", "0");

  inputElement.style.setProperty(
    "padding-left",
    "calc(var(--gmpx-font-size-base, 0.875rem)* 2.5",
  );
  inputElement.style.setProperty(
    "padding-top",
    "calc(var(--gmpx-font-size-base, 0.875rem)* 0.75)",
  );
  inputElement.style.setProperty(
    "padding-bottom",
    "calc(var(--gmpx-font-size-base, 0.875rem)* 0.75)",
  );
  inputElement.style.setProperty(
    "padding-right",
    "calc(var(--gmpx-font-size-base, 0.875rem)* 0.75)",
  );

  // now that we've set the styles, un-hide the whole div
  const addressFieldDiv = getAddressFieldDiv();
  addressFieldDiv.style.setProperty("display", "flex");
}

async function initAutocomplete() {
  setStyles();

  const picker = document.querySelector("gmpx-place-picker");
  picker.addEventListener("gmpx-placechange", async (e) => {
    const place = e.target.value;

    // handle a new place selection
    if (place.formattedAddress && place.location && place.addressComponents) {
      if (place.formattedAddress !== lastValidatedAddress) {
        lastValidatedAddress = place.formattedAddress;
        await handlePlaceChange(
          place.formattedAddress,
          place.location,
          place.addressComponents,
        );
      }
    } else {
      console.error(
        "Could not get formattedAddress, location, and addressComponents from the place.",
      );
    }
  });

  // Handle a page load (i.e. see if the url has an address parameter that we need to show results for).
  // We have to put this code here instead of the actual onPageLoad event because we need to wait for the Google
  // autocomplete widget to be initialized above.
  await checkForAddressInUrl();
}

window.addEventListener("load", initAutocomplete);
