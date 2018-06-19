var $ = require( 'jquery' )
var map = require( '../src/index.js' )
var apiData = require( './wordpress-api-sample.json' )

// Wait for the Google Maps API to be load ( `window.google.maps` )
$( window ).on('load', function () {

  // Initialize a map without data to the default coordinates & zoom level
  map( {
    container: document.querySelector( '#map-default' )
  } ).render()

  // Initialize a map with some markers, and default popup styling
  var locationData = apiData.filter( apiDataHasLatLng ).map( apiDataToFeatureObject )
  map( {
    container: document.querySelector( '#map-data-added' )
  } ).data( locationData )
     .render()

  // Remove features from the map after adding them
  map( {
    container: document.querySelector( '#map-data-removed' )
  } ).data( locationData )
     .render()
     .removeFeatures()
} )

function apiDataHasLatLng ( entry ) {
  return $.isPlainObject( entry.acf ) &&
         $.isPlainObject( entry.acf.location_address ) &&
         $.isNumeric( entry.acf.location_address.lat ) &&
         $.isNumeric( entry.acf.location_address.lng )
}

function apiDataToFeatureObject ( entry ) {
  return {
    // `marker` object is passed into `google.maps.Marker`
    marker: {
      title: entry.acf.location_address.address,
      position: {
        lat: entry.acf.location_address.lat,
        lng: entry.acf.location_address.lng,
      },
      // `infoWindow` object is passed into `google.maps.InfoWindow`
      infoWindow: {
        content: `<div class="info-window-content">
          <p>${ entry.acf.location_address.address }</p>
          ${ entry.acf.location_description }
        </div>`
      },
    },
  }
}
