/* globals google.maps */

var isArrayWithItems = require( './utils/is-array-with-items.js' )
var isPosition = require( './utils/is-position.js' )
var deafultTileStyle = require( './tile-style.json' )
var isObject = require( './utils/is-object.js' )
var isNumber = require( './utils/is-number.js' )
var Marker = require( './marker.js' )

module.exports = Map;

// TODO: Add docs based including description of options
function Map ( options ) {
  if ( ! ( this instanceof Map ) ) return new Map( options )

  // TODO: Ensure there is a container to mount the map on to.
  //       Throw an error or log out need for a container otherwise.
  // The element that contains to the Google Maps instance.
  var container = options.container || document.querySelector( '.map' )
  
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
   * - If a `center` or `zoom` are not provided, then the map bounds will be defined
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
    if ( ! renderOptions ) renderOptions = {}
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

    // Update map based on `renderOptions`
    if ( renderOptions.center || renderOptions.zoom ) {
      // set map bounds based on center &| zoom
      if ( renderOptions.center ) {
        if ( isPosition( renderOptions.center ) ) {
          mapInstance.setCenter( renderOptions.center )
        }
        else {
          var renderCenterErrorMessage = 'Could not set the map center.' +
            '\nThe `map.render` function accepts an object with a `center` key,' +
            '\nwhose value should be a object, with two keys: `lat` & `lng` that' +
            '\nare the latitude & longitude values that will be used to center' +
            '\nthe map.'
          throw new Error( renderCenterErrorMessage )
        }
      }
      else {
        // set bounds based on data
        mapInstance.fitBounds( getFeatureBounds( features ), fitBoundsPadding )
      }
      if ( renderOptions.zoom ) {
        if ( isNumber( renderOptions.zoom ) ) {
          mapInstance.setZoom( renderOptions.zoom )
        }
        else {
          var renderZoomErrorMessage = 'Could not set the zoom level.' +
            '\nThe `map.render` function accepts an object with `zoom` key,'
            '\n'
          throw new Error( renderZoomErrorMessage )
        }
      }
    }
    else {
      // set map bounds based on data
      if ( isArrayWithItems( features ) ) {
        mapInstance.fitBounds( getFeatureBounds( features ), fitBoundsPadding )
      }
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
    markerOptions = Object.assign( { map: mapInstance }, markerOptions )
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
