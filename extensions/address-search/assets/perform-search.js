const GRAPHQL_URL =
  "https://wardmapsgifts.myshopify.com/api/2024-04/graphql.json";
//const SHOPIFY_STOREFRONT_ACCESS_TOKEN = "b836553c495183c373b931a16da1ab3d"
const SHOPIFY_STOREFRONT_ACCESS_TOKEN = "edca82438eb0b0c37e4dd0bdb1581c69";

function setSearchResultsHeader(numOfResults) {
  const headerElement = document.getElementById("search-results-header-text");
  if (numOfResults) {
    headerElement.innerText = "Your Search Results";
  } else {
    headerElement.innerText = "No Search Results Found";
  }
}

function formatDecimal(num) {
  // Convert the number to a string
  let numStr = num.toString();

  // Check if the number has a decimal point
  if (numStr.includes(".")) {
    // Split the number into integer and decimal parts
    let parts = numStr.split(".");

    // If the decimal part has only one digit, add a zero to it
    if (parts[1].length === 1) {
      return parts[0] + "." + parts[1] + "0";
    }
  }

  // If there's no decimal point or the decimal part has more than one digit, return the original number
  return numStr;
}

async function getMapsForCityAndState(locality, state, cursor) {
  let cursorParam = "";
  if (cursor) {
    cursorParam = `, after:"${cursor}"`;
  }

  const query = `{
      products(query:"tag:${locality} ${state} AND tag:Address Searchable", first: 250${cursorParam}) {
        pageInfo {
					hasNextPage
          endCursor
        }
        edges {
          node {
            ... on Product {
              id
              handle
              title
              description
              descriptionHtml
              featuredImage {
                url
                altText
              }
              priceRange {
                minVariantPrice {
                  amount
                }
                maxVariantPrice {
                  amount
                }
              }
              geoPolygon: metafield(namespace: "custom", key: "geopolygon") {
                value
              }
            }
          }
        }
      }
  }`;

  try {
    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
      }),
    });

    const json = await response.json();

    const products = json.data.products.edges.map(({ node }) => ({
      id: node.id,
      title: node.title,
      description: node.description,
      handle: node.handle,
      imageUrl: node.featuredImage?.url,
      imageAlt: node.featuredImage?.altText,
      minPrice: formatDecimal(node.priceRange.minVariantPrice.amount),
      maxPrice: formatDecimal(node.priceRange.maxVariantPrice.amount),
      geoPolygon: node.geoPolygon?.value,
    }));

    return {
      hasNextPage: json.data.products.pageInfo.hasNextPage,
      endCursor: json.data.products.pageInfo.endCursor,
      products,
    };
  } catch (error) {
    console.error("Error:", error);
  }
}

function getMapsThatContainAddress(lon, lat, productsInLocality) {
  // create a point for the address's latitude and longitude
  const point = turf.point([lon, lat]);

  // get all the maps that contain the address
  return productsInLocality.filter((product) => {
    let isWithin = false;
    if (product.geoPolygon) {
      const geoJson = JSON.parse(product.geoPolygon);
      if (geoJson) {
        const coordinates = geoJson.features[0].geometry.coordinates[0];

        if (Array.isArray(coordinates)) {
          const polygon = turf.polygon(coordinates);

          isWithin = turf.booleanPointInPolygon(point, polygon);
          if (isWithin) {
            // console.log(JSON.stringify(`Address is within ${product.title}!`))
          }
        }
      }
    }

    return isWithin;
  });
}

function getResultsHtml(mapsThatContainAddress) {
  return mapsThatContainAddress.map(
    (product) => `
        <li class="snize-product" style="min-width: auto;"><a
                class="snize-view-link" data-no-instant="true"
                draggable="false" href="/products/${product.handle}">
          <div class="snize-item clearfix ">
            <div class="snize-thumbnail-wrapper">
            <span class="snize-thumbnail">
              <img alt="${product.imageAlt}" class="snize-item-image" loading="lazy"
                   src="${product.imageUrl}">
            </span>
            </div>
            <div class="snize-overhidden">
            <span class="snize-title" style="max-height: 2.8em; -webkit-line-clamp: 2;">
              ${product.title}
            </span>
              <span class="snize-description snize-hidden"></span>
              <div class="snize-price-list">
                <span class="snize-price money">$${product.minPrice}</span> - <span class="snize-price  money">$${product.maxPrice}</span>
              </div>
            </div>
          </div>
        </a>
        </li>
      `,
  );
}

async function performSearch(lat, lon, locality, state) {
  const headerText = document.getElementById("search-results-header-text");
  const resultList = document.getElementById("search-results-ul");
  const pageContentDiv = document.getElementById("page-content-div");

  // hide the header and blank out the results
  headerText.style.display = "none";
  resultList.innerHTML = "";
  pageContentDiv.style.display = "none";

  let mapsForCityAndState = [];
  let result = {
    hasNextPage: true,
    endCursor: null,
    products: [],
  };
  // paginate through the results
  while (result.hasNextPage) {
    // get the products in the city and state
    result = await getMapsForCityAndState(locality, state, result.endCursor);
    if (result) {
      mapsForCityAndState = mapsForCityAndState.concat(result.products);
    } else {
      result.hasNextPage = false;
    }
  }

  // of those city and state maps, get the ones that contain the address geo coordinates
  const mapsThatContainAddress = getMapsThatContainAddress(
    lon,
    lat,
    mapsForCityAndState,
  );

  // set the "No Search Results" or "Search Results" header depending on whether we got results
  setSearchResultsHeader(mapsThatContainAddress.length);

  // build the results html
  const productElements = getResultsHtml(mapsThatContainAddress);

  // show the "Search Results" header and the results
  headerText.style.display = "block";
  pageContentDiv.style.display = "block";
  resultList.innerHTML = productElements.join("");
}
