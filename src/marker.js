/* globals google.maps */

var isPosition = require( './utils/is-position.js' )
var isObject = require( './utils/is-object.js' )
var deepmerge = require( 'deepmerge' )

module.exports = Marker;

/**
 * Marker creates a google.maps.Marker, and return an interface for
 * removing, and rendering the Marker. Optionally, if there is a
 * `popup` key within the `options` object, that will be used as the
 * options to create an OverlayPopup that will be attached this marker.
 *
 * The options passed into the google.maps.Marker class has the
 * [options outlined here.]{@link https://developers.google.com/maps/documentation/javascript/reference/marker#MarkerOptions}
 *
 * The options.icon property gets passed into the google.maps.Icon interface
 * which has [options outlined here.]{@link https://developers.google.com/maps/documentation/javascript/reference/marker#Icon}
 *
 * The `api` object that is returned includes 4 functions:
 * - `instance`: returns the unerlying google.maps.Marker object.
 * - `options`: returns the original object used to create the marker.
 * - `render`: creates the marker feature on the map.
 * - `remove`: removes the marker feature from the map.
 * 
 * @param {object} options
 * @param {object} options.map  The google.maps.Map instance to create in. Required.
 * @param {object} options.position     The position object of the marker. Required.
 * @param {number} options.position.lat The latitude of the marker.
 * @param {number} options.position.lng The longitude of the marker.
 * @param {object} options.popup  The options to use to initialize the [popup]{@link ./overlay-popup.js}.
 * @return {object} api  The methods available to the created marker.
 */
function Marker ( options ) {
  if ( ! ( this instanceof Marker ) ) return new Marker( options )

  if ( ! validateOptions( options ) ) {
    var errorMessage = 'Could not initialize Marker.' +
      '\nMarker requires the following keys in its options:' +
      '\n\t- `map`: A google.maps.Map instance' +
      '\n\t- `position`: An object that includes a `lat` & `lng` key of ' +
      '\n\t              latitude & longitude values for the marker.' +
      '\n\t              These keys can be supplied as floats or strings.'

    throw new Error( errorMessage )
  }

  var marker;
  var markerListeners = []
  var popup;

  var api = {
    instance: function () { return marker },
    options: options,
    render: render,
    remove: remove,
  }

  return api;

  /**
   * Renders the marker to the map, and adds any event listeners
   * that are defined in the marker options.
   * 
   * @return {object} api  A reference to the API.
   */
  function render () {
    if ( ! marker ) {
      marker = new google.maps.Marker( mergeWithDefaults( options ) )
    }

    if ( options.popup && ! popup ) {
      var WSPopup = require( './overlay-popup.js' )
      popup = new WSPopup( Object.assign( { marker: marker }, options.popup ) )
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
    markerListeners = []

    if ( popup ) {
      popup.remove()
      popup = null;
    }

    return api;

    function removeListener ( listener ) {
      listener.remove()
    }
  }
}


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
  if ( ! isObject( markerOptions ) ) return false;

  var hasPosition = isPosition( markerOptions.position )
  var hasMap = markerOptions.hasOwnProperty( 'map' ) &&
               markerOptions.map instanceof google.maps.Map;

  return hasPosition && hasMap;
}

function mergeWithDefaults ( options ) {
  var map = options.map;
  delete options.map;
  var mergedOptions = deepmerge( defaultOptions(), options )
  mergedOptions.map = map;
  if ( options.icon.url ) delete mergedOptions.icon.path;
  return mergedOptions;
}

function defaultIconOptions () {
  return {
    // modern pictograms `pin.svg` body path
    path: 'M12.2857143,0.428571429 C5.42857143,0.428571429 0,5.85714286 0,12.6428571 C0,17.3571429 1.92857143,19.6428571 6.07142857,25.5 C11.0714286,32.8571429 12.0714286,39.0714286 12.0714286,39.0714286 C12.2142857,39.5714286 12.6428571,39.5714286 12.7857143,39.0714286 C12.7857143,39.0714286 13.5,32.8571429 18.6428571,25.5 C21,22 24.7142857,17.3571429 24.7142857,12.6428571 C24.7142857,5.85714286 19.0714286,0.428571429 12.2857143,0.428571429 Z M12.4285714,17.7142857 C9.92857143,17.7142857 7.78571429,15.5 7.78571429,12.8571429 C7.78571429,10.2142857 9.92857143,8.14285714 12.4285714,8.14285714 C15.0714286,8.14285714 17.1428571,10.2142857 17.1428571,12.8571429 C17.1428571,15.5 15.0714286,17.7142857 12.4285714,17.7142857 Z',
    fillColor: '#f79941',
    fillOpacity: 1,
    strokeColor: '#f79941',
    strokeWeight: 0,
    size: new google.maps.Size( 25, 40 ),
    origin: new google.maps.Point( 0, 0 ),
    anchor: new google.maps.Point( 12.5, 40 ),
  }
}

function defaultOptions () {
  return {
    popup: {
      pointer: '10px',
    },
    icon: defaultIconOptions(),
  }
}

// --- Utilities ---

function isEmptyArray ( value ) {
  return value && Array.isArray( value ) && value.length === 0;
}
