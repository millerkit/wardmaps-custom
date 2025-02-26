function setGridSize() {
  // eslint-disable-next-line no-undef
  const gridDiv = document.getElementById("snize-search-results-grid-mode");
  gridDiv.className = "";
  const screenWidth = screen.width;
  const gridBreakpoints = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400,
  };

  if (screenWidth > gridBreakpoints.xxl) {
    gridDiv.classList.add("snize-five-columns");
  } else if (screenWidth >= gridBreakpoints.xl) {
    gridDiv.classList.add("snize-four-columns");
  } else if (screenWidth >= gridBreakpoints.lg) {
    gridDiv.classList.add("snize-three-columns");
  } else if (screenWidth >= gridBreakpoints.md) {
    gridDiv.classList.add("snize-two-columns");
  } else if (screenWidth >= gridBreakpoints.sm) {
    gridDiv.classList.add("snize-one-column");
  }
}

function hideLoading() {
  toggleSpinner(false);
  toggleResultsGrayedOut(false);
}

function showLoading() {
  toggleSpinner(true);
  toggleResultsGrayedOut(true);
}

function toggleSpinner(show) {
  const spinner = document.getElementById("spinner");
  const spinnerIsHidden = spinner.classList.contains("hidden");
  if (show) {
    spinner.classList.remove("hidden");
  } else if (!spinnerIsHidden) {
    spinner.classList.add("hidden");
  }
}

function toggleResultsGrayedOut(turnToGray) {
  const resultsDiv = document.getElementById(
    "snize-search-results-main-content",
  );
  const resultsAreGrayedOut =
    resultsDiv.classList.contains("loading_background");
  if (turnToGray && !resultsAreGrayedOut) {
    resultsDiv.classList.add("loading_background");
  } else {
    resultsDiv.classList.remove("loading_background");
  }
}

async function onPageLoad() {
  setGridSize();

  const params = new URLSearchParams(window.location.search);

  const address = params.get("address");
  if (address) {
    const addressField = document.getElementById("addressField");
    addressField.value = address;
  }
  const lat = params.get("lat");
  const lon = params.get("lon");
  const locality = params.get("locality");
  const state = params.get("state");

  // console.log(`lat=${lat}, lon=${lon}, locality=${locality}, state=${state}`);

  if (lat && lon && locality && state) {
    showLoading();
    await performSearch(lat, lon, locality, state).finally((value) => {
      hideLoading();
    });
  }
}

onPageLoad().then((value) => {
  // console.log('onPageLoad');
});
