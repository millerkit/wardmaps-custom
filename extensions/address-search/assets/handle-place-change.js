function simulateFormPost(address, lat, lon, locality, state) {
  const url = new URL(window.location.href);
  url.searchParams.set("address", address);
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lon);
  url.searchParams.set("locality", locality);
  url.searchParams.set("state", state);
  window.history.pushState(null, "", url.toString());
}

function reduceAddressComponents(addressComponents) {
  return addressComponents.reduce(
    (acc, curr) => (
      (acc[curr.types[0]] = {
        longText: curr.longText,
        shortText: curr.shortText,
      }),
      acc
    ),
    {},
  );
}

async function handlePlaceChange(newAddress, location, rawAddressComponents) {
  if (newAddress && location && rawAddressComponents) {
    // get the lat and lon
    const lat = location.lat();
    const lon = location.lng();

    // set city and state
    const addressComponents = reduceAddressComponents(rawAddressComponents);
    const locality = addressComponents.locality.longText;
    const state = addressComponents.administrative_area_level_1.shortText;

    // "post" the form to the current page
    simulateFormPost(newAddress, lat, lon, locality, state);

    // and perform the search
    showLoading();
    await performSearch(lat, lon, locality, state).finally((value) => {
      hideLoading();
    });
  }
}
