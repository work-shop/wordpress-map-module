/* globals google.maps */

var isArrayWithItems = require( './utils/is-array-with-items.js' )
var isPosition = require( './utils/is-position.js' )
var deafultTileStyle = require( './tile-style.json' )
var isObject = require( './utils/is-object.js' )
var isNumber = require( './utils/is-number.js' )
var deepmerge = require( 'deepmerge' )
var Marker = require( './marker.js' )

module.exports = Map;

function conditionallySetCenter( renderOptions, mapInstance ) {
    if ( !isPosition( renderOptions.center ) ) {

        var renderCenterErrorMessage = 'Could not set the map center.' +
          '\nThe `map.render` function accepts an object with a `center` key,' +
          '\nwhose value should be a object, with two keys: `lat` & `lng` that' +
          '\nare the latitude & longitude values that will be used to center' +
          '\nthe map.'

        throw new Error( renderCenterErrorMessage )

    }

    mapInstance.setCenter( renderOptions.center )
}

function conditionallySetZoom( renderOptions, mapInstance ) {
    if ( !isNumber( renderOptions.zoom ) ) {

        var renderZoomErrorMessage = 'Could not set the zoom level.' +
          '\nThe `map.render` function accepts an object with `zoom` key,'
          '\n'

        throw new Error( renderZoomErrorMessage )

    }

    mapInstance.setZoom( renderOptions.zoom )
}

/**
 * Map object to create & manage a single map.
 *
 * The map will be initialized using the `options` object that is passed in.
 * The `container` key must be a DOM node that the map can be mounted to.
 * Any other keys in the `options` object will be passed to the Google Maps Map
 * class, which accepts the following [map options]{@link https://developers.google.com/maps/documentation/javascript/reference/3/map#MapOptions},
 * in addition to a `marker` key whose object value will be used as the basis
 * for extending [feature marker options]{@link ./marker.js}, and a `render` key
 * whose object will be used as the basis for extending theh `renderOptions`
 * passed into the `render` method.
 *
 * The `api` object that is returned includes four functions.
 *
 * - `mapInstance`: Takes no arguments, and returns the underlying Google Maps
 *                  map class instance.
 * - `data`: Given no arguments, this returns the current data object that will be used
 *           to render map features. Otherwise, given a single argument, this object will
 *           be stored as the source from which to render map features.
 * - `render`: Accepts an optional object that will define the center lng & lat as well as
 *             the zoom level to render the map at. The render function will use the current
 *             `data` object and use it to render map features. This is the opposite of the
 *             `removeFeatures` function.
 * - `removeFeatures`: Takes no arguments, and removes all of the features that are on the map.
 *                     This is the opposite of the `render` function.
 *
 * @param {object} options  The options to initialize the map with. Including [all google.maps.Map options]{@link https://developers.google.com/maps/documentation/javascript/reference/3/map#MapOptions}
 * @param {object} options.container  The DOM element to mount the map on to. Required.
 * @param {object} options.marker?    The default marker options to use when rendering [marker]{@link ./marker.js} features.
 * @param {object} options.render?    The default render options to use when rendering the map.
 * @return {object} api     The external API to be used by consumers of the module.
 */
function Map ( options ) {
  if ( ! ( this instanceof Map ) ) return new Map( options )

  // The element that contains to the Google Maps instance.
  var container = options.container || document.querySelector( '.map' )
  if ( ! container ) {
    var containerErrorMessage = 'Map must be initialized with a `container` ' +
      'DOM element to mount to.' +
      '\n\tMap( { container : DOMNode } )'
    throw new Error( containerErrorMessage )
  }

  delete options.container;

  // Pull the default marker options
  var defaultMarkerOptions = Object.assign( {}, options.marker )
  delete options.marker;

  // Pull the default render options
  var defaultRenderOptions = Object.assign( {}, options.render )
  delete options.render;

  // The global Google Maps instance for this initialization.
  var mapInstance = undefined;

  // The data that is displayed on the map as different feature objects
  var data = []
  // The feature objects that have been made for the map, ie `google.maps.Marker`
  var features;

  var opinionatedDefaultMapOptions = {
    // defaults to city zoom level
    zoom: options.zoom || 14,
    // defaults to Providence, RI coordinates
    center: options.center || { lat: 41.8240, lng: -71.4128 },
    // defaults to `Silver` styles as defined by`https://mapstyle.withgoogle.com/`
    styles: options.styles || deafultTileStyle,
    gestureHandling: options.gestureHandling || 'cooperative',
  }

  var fitBoundsPadding = options.fitBoundsPadding || {
    top: 100,
    right: 100,
    bottom: 100,
    left: 100,
  }

  var mapOptions = Object.assign( {}, opinionatedDefaultMapOptions, options )

  var api = {
    instance: function () { return mapInstance },
    render: render,
    data: getSetData,
    removeFeatures: removeFeatures,
  }

  return api;

  /**
   * - Render a map with the current `mapOptions`.
   * - Create map `features` based on the current `data`.
   *   - Currently supports rendering `marker` & `infoWindow` objects within `data`.
   * - If neither `center` nor `zoom` are provided, then the map bounds will be defined
   *   by the bounding box that encapsulates all of the features.
   *
   * @param {?object} renderOptions            Optional object
   * @param {?object} renderOptions.center     Optional object
   * @param {number} renderOptions.center.lat  The latitude to set the center of the map
   * @param {number} renderOptions.center.lng  The longitude to set the center of the map
   * @param {?number} renderOptions.zoom       The zoom level to set for the map
   * @return {object} api  Reference to this module's API.
   */
  function render ( renderOptions ) {
    if ( ! renderOptions ) renderOptions = defaultRenderOptions
    Object.assign( mapOptions, renderOptions )
    if ( ! mapInstance ) {
      mapInstance = new google.maps.Map( container, mapOptions )
    }

    if ( ! features ) {
      features = data.filter( isObject )
                     .filter( objectContainsKey( 'marker' ) )
                     .map( returnObjectKey( 'marker' ) )
                     .map( createMarker )
    }

    if ( renderOptions.center && renderOptions.zoom ) {
        // set both center and zoom.
        conditionallySetCenter( renderOptions, mapInstance );
        conditionallySetZoom( renderOptions, mapInstance );

    } else if ( renderOptions.center && !renderOptions.zoom ) {
        // set center, leaving zoom level at its previous state
        conditionallySetCenter( renderOptions, mapInstance );

    } else if ( !renderOptions.center && renderOptions.zoom ) {
        // set zoom, leaving current center at its previous state
        conditionallySetZoom( renderOptions, mapInstance );

    } else if ( isArrayWithItems( features ) ) {
        // neither center nor zoom specified, fit map bounds to features
        mapInstance.fitBounds( getFeatureBounds( features ), fitBoundsPadding )

    }

    return api;
  }

  /**
   * Get or set the map data.
   * Given an array of data (or an object that gets turned into an array)
   * create the appropriate underlying representation for that data.
   *
   * `newData` should be an object or array that represents features
   * to add to a map.
   *
   * @param  {?object} newData  An object or array of data to add to the map
   * @return {object}  api      Reference to this module's API.
   */
  function getSetData ( newData ) {
    if ( ! arguments.length ) return data;
    if ( isObject( newData ) ) newData = [ newData ]
    data = newData;
    return api;
  }

  /**
   * Remove all features from the map.
   *
   * @return {object} api  Reference to this module's API
   */
  function removeFeatures () {
    features.forEach( function ( feature ) {
      feature.remove()
    } )
    features = null;
    return api;
  }

  // Given options for a Marker, supply the underlying map instance,
  // initialize the Marker & render it.
  function createMarker ( markerOptions ) {
    markerOptions = Object.assign( { map: mapInstance }, deepmerge( defaultMarkerOptions, markerOptions ) )
    return Marker( markerOptions ).render()
  }
}

// --- Utilities ---

/**
 * Given an array of map features, determine the bounding box that includes
 * all of the points, and return the `bounds` object.
 *
 * bounds :  { north : Number, east : Number, south : Number, west : Number }
 *
 * @param  {object} features  Map feature objects
 * @return {object} bounds    Defines a box that includes all features
 */
function getFeatureBounds ( features ) {
  var bounds = { north: 0, east: 0, south: 0, west: 0 }
  for (var i = 0; i < features.length; i++) {
    var feature = features[ i ].instance()
    if ( typeof feature.getPosition === 'function' ) {
      var position = feature.getPosition()
      if ( i === 0 ) {
        bounds.north = position.lat()
        bounds.south = position.lat()
        bounds.east = position.lng()
        bounds.west = position.lng()
      }
      else {
        if ( position.lat() > bounds.north ) bounds.north = position.lat()
        if ( position.lat() < bounds.south ) bounds.south = position.lat()
        if ( position.lng() > bounds.east ) bounds.east = position.lng()
        if ( position.lng() < bounds.west ) bounds.west = position.lng()
      }
    }
  }
  return bounds;
}

function objectContainsKey ( key ) {
  return function doesObjectContainKey ( obj ) {
    return obj.hasOwnProperty( key )
  }
}

function returnObjectKey ( key ) {
  return function returnsKeyInObject ( obj ) {
    return obj[ key ]
  }
}
