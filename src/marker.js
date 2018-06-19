/* globals google.maps */

var isObject = require( './utils/is-object.js' )

module.exports = Marker;

/**
 * Create a google.maps.Marker with an optional google.maps.InfoWindow
 * that opens when the marker is clicked.
 * 
 * @param {object} options
 * @param {object} options.map  The google.maps.Map instance to create in. Required.
 * @param {object} options.position     The position object of the marker. Required.
 * @param {number} options.position.lat The latitude of the marker.
 * @param {number} options.position.lng The longitude of the marker.
 * @param {?object} options.infoWindow  Optional object to define a marker popup.
 * @return {object} api  The methods available to the created marker.
 */
function Marker ( options ) {
  if ( ! ( this instanceof Marker ) ) return new Marker( options )

  if ( ! validateOptions( options ) ) {
    var errorMessage = 'Could not initialize Marker.' +
      '\nMarker requires the following keys:' +
      '\n\t- `map`: A google.maps.Map instance' +
      '\n\t- `position`: An object that includes a `lat` & `lng` key of ' +
      '\n\t              latitude & longitude values for the marker.' +
      '\n\t              These keys can be supplied as floats or strings.'

    console.log( errorMessage )
    console.log( 'Was supplied with:' )
    console.log( options )
    return;
  }

  var marker;
  var markerListeners = []
  var infoWindow;

  var api = {
    instance: function () { return marker },
    options: options,
    render: render,
    remove: remove,
  }

  return api;

  /**
   * Validate options expects an object that contains keys that
   * will define a google.maps.Marker object.
   *
   * Additionally ensures that `lat` & `lng` values are floats
   * & not strings.
   * 
   * @param  {object} markerOptions
   * @return {object} markerOptions
   */
  function validateOptions ( markerOptions ) {
    var hasPosition = isObject( markerOptions ) &&
                      isObject( markerOptions.position )

    if ( ! hasPosition ) return false;

    markerOptions.position.lat = Number.parseFloat( markerOptions.position.lat )
    markerOptions.position.lng = Number.parseFloat( markerOptions.position.lng )

    var hasMap = markerOptions.hasOwnProperty( 'map' )

    var hasLat = ! Number.isNaN( markerOptions.position.lat )
    var hasLng = ! Number.isNaN( markerOptions.position.lng )

    return hasPosition && hasMap && hasLat && hasLng;
  }

  /**
   * Renders the marker to the map, and adds any event listeners
   * that are defined in the marker options.
   * 
   * @return {object} api  A reference to the API.
   */
  function render () {
    if ( ! marker ) {
      marker = new google.maps.Marker( options )
    }

    if ( options.infoWindow && ! infoWindow ) {
      infoWindow = new google.maps.InfoWindow( options.infoWindow )
      var markerClick = marker.addListener( 'click', function () {
        infoWindow.open( options.map, marker )
      } )
      markerListeners.push( markerClick )
    }

    if ( isObject( options.on ) && isEmptyArray( markerListeners ) ) {
      Object.keys( options.on ).forEach( function ( eventType ) {
        var eventHandler = options.on[ eventType ].bind( api )
        var eventListenerReference = marker.addListener( eventType, eventHandler )
        markerListeners.push( eventListenerReference )
      } )
    }

    return api;
  }

  /**
   * Remove the marker from the map, along with any listeners.
   * Reset the internal values to their original state, such
   * that `render` can reproduce them.
   * 
   * @return {object} This markers API.
   */
  function remove () {

    marker.setMap( null )
    markerListeners.forEach( removeListener )

    marker = null;
    infoWindow = null;
    markerListeners = []

    return api;

    function removeListener ( listener ) {
      listener.remove()
    }
  }
}

// --- Utilities ---

function isEmptyArray ( value ) {
  return value && Array.isArray( value ) && value.length === 0;
}
