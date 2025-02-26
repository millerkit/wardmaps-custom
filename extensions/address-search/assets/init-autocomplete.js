// this code adapted from
// https://developers.google.com/maps/documentation/javascript/examples/places-autocomplete-addressform#maps_places_autocomplete_addressform-javascript

// let latField;
// let lonField;
// let localityField;
// let stateField;
let searchForm;
let addressField;
let lastValidatedAddress;
let mainDiv;
let autocompletePlace;

async function getPlaceDetails(placesService, placeId, PlacesServiceStatus) {
  return placesService.getDetails(
    {
      placeId: placeId,
      fields: ["formatted_address", "address_components", "geometry"],
    },
    async (placeResult, status) => {
      if (status === PlacesServiceStatus.OK && placeResult) {
        // console.log(`got 1st place prediction handlePlaceChange with result=${placeResult.formatted_address}`)
        await handlePlaceChange(placeResult);
      }
    },
  );
}

function tryGettingPlaceFromQuery(
  placesService,
  addressFieldValue,
  PlacesServiceStatus,
) {
  // console.log(`calling findPlaceFromQuery with partial address=${addressFieldValue}`)
  placesService.findPlaceFromQuery(
    { query: addressFieldValue, fields: ["place_id"], locationBias: "IP_BIAS" },
    (results, status) => {
      if (status === PlacesServiceStatus.OK && results.length) {
        const firstPlace = results[0];
        getPlaceDetails(placesService, firstPlace, PlacesServiceStatus);
      } else {
        // no results. leave the bad address in the address field, show no results,
        // and "post" bad address to the same page
        setSearchResultsHeader(0);
        simulateFormPost(addressFieldValue, "", "", "", "");
      }
    },
  );
}

async function initAutocomplete() {
  // latField = document.getElementById("lat");
  // lonField = document.getElementById("lon");
  // localityField = document.getElementById("locality");
  // stateField = document.getElementById("state");

  addressField = document.getElementById("addressField");
  searchForm = document.getElementById("search-form");
  mainDiv = document.getElementById("main-div");

  // Request needed libraries.
  // eslint-disable-next-line no-undef
  const {
    Autocomplete,
    PlacesService,
    AutocompleteService,
    PlacesServiceStatus,
  } = await google.maps.importLibrary("places");

  // construct a placesService object
  const placesService = new PlacesService(document.getElementById("hiddenDiv"));

  // construct a new AutocompleteService
  const autocompleteService = new AutocompleteService();

  // construct an autocomplete object
  // Create the autocomplete object, restricting the search predictions to
  // addresses in the US and Canada.
  const autocomplete = new Autocomplete(addressField, {
    componentRestrictions: { country: ["us", "ca"] },
    fields: ["formatted_address", "address_components", "geometry"],
    types: ["address"],
  });
  addressField.focus();

  // When the user selects an address from the drop-down, populate the
  // address fields in the form.
  autocomplete.addListener("place_changed", async () => {
    autocompletePlace = autocomplete.getPlace();
    if (autocompletePlaceHasChanged()) {
      await handlePlaceChange(autocompletePlace);
    }
  });

  // if the user submits the form (i.e., hits return) before selecting an autocomplete suggestion,
  // then select the first place in the autocomplete list
  searchForm.onsubmit = async () => {
    const addressFieldValue = addressField.value
      ? addressField.value.trim()
      : null;
    // console.log(`searchForm.onsubmit addressFieldValue = ${addressFieldValue}`)
    if (addressFieldPlaceHasChanged(addressFieldValue)) {
      // addressField has something, but the value doesn't match the last google validated address (or there is no last validated address)

      // if we have an autocomplete result from the last search, use that

      autocompleteService.getPlacePredictions(
        { input: addressFieldValue, locationBias: "IP_BIAS" },
        async (results, status) => {
          if (status === PlacesServiceStatus.OK && results.length) {
            // console.log(`Got a prediction.`)
            await getPlaceDetails(
              placesService,
              results[0].place_id,
              PlacesServiceStatus,
            );
          }
        },
      );

      // } else {
      // 	// run a query and return the 1st result
      // 	tryGettingPlaceFromQuery(placesService, addressFieldValue, PlacesServiceStatus);
      // }
      return false;
    }
  };
}

function autocompletePlaceHasChanged() {
  const address = autocompletePlace ? autocompletePlace.formatted_address : "";
  if (address && address !== lastValidatedAddress) {
    // console.log("----------------------")
    // console.log(`autocompletePlaceHasChanged: address=${address}, lastValidatedAddress=${lastValidatedAddress}`)
    // console.log(`handlePlaceChange with result=${address}`)
    return true;
  }

  return false;
}

function addressFieldPlaceHasChanged(newAddress) {
  if (newAddress && newAddress !== lastValidatedAddress) {
    // console.log("----------------------")
    // console.log(`addressFieldPlaceHasChanged: newAddress=${newAddress}, lastValidatedAddress=${lastValidatedAddress}`)
    return true;
  }
  return false;
}

function simulateFormPost(address, lat, lon, locality, state) {
  const url = new URL(window.location.href);
  url.searchParams.set("address", address);
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lon);
  url.searchParams.set("locality", locality);
  url.searchParams.set("state", state);
  window.history.pushState(null, "", url.toString());
}

function getAddressComponents(newPlace) {
  return newPlace.address_components.reduce(
    (acc, curr) => (
      (acc[curr.types[0]] = {
        long_name: curr.long_name,
        short_name: curr.short_name,
      }),
      acc
    ),
    {},
  );
}

async function handlePlaceChange(newPlace) {
  // the autocomplete result should always give us formatted_address, geometry, and address_components,
  // but I'm not 100% sure of that.
  if (
    newPlace.formatted_address &&
    newPlace.geometry &&
    newPlace.address_components
  ) {
    const newAddress = newPlace.formatted_address;
    lastValidatedAddress = newAddress;
    // console.log(`set lastValidatedAddress to ${lastValidatedAddress}`)

    // set the formatted address to the value from autocomplete
    // console.log(`set addressField.value to ${newAddress}`)
    addressField.value = newAddress;

    // get the lat and lon
    const lat = newPlace.geometry.location.lat();
    const lon = newPlace.geometry.location.lng();

    // set city and state
    const addressComponents = getAddressComponents(newPlace);
    const locality = addressComponents.locality.long_name;
    const state = addressComponents.administrative_area_level_1.short_name;

    // "post" the form to the current page
    simulateFormPost(newAddress, lat, lon, locality, state);

    // and perform the search
    showLoading();
    await performSearch(lat, lon, locality, state).finally((value) => {
      hideLoading();
    });
  }
}

initAutocomplete().then((value) => {
  // console.log('initAutocomplete');
});
