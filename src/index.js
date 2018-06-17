var deafultTileStyle = require( './tile-style.json' )
var Marker = require( './marker.js' )

module.exports = Map;

// TODO: Add docs based including description of options
function Map ( options ) {
  if ( ! ( this instanceof Map ) ) return new Map( options )

  var container = options.container || document.querySelector( '.map' )
  
  var mapInstance = undefined;

  var opinionatedDefaultMapOptions = {
    // defaults to city zoom level
    zoom: options.zoom || 14,
    // defaults to Providence, RI coordinates
    center: options.center || { lat: 41.8240, lng: -71.4128 },
    // defaults to `Silver` styles as defined by`https://mapstyle.withgoogle.com/` 
    styles: options.styles || deafultTileStyle,
    gestureHandling: options.gestureHandling || 'cooperative',
  }

  var mapOptions = Object.assign( {}, opinionatedDefaultMapOptions, options )

  var api = {
    render: render,
    data: data,
  }

  return api;

  /**
   * Render a map with the current mapOptions.
   * 
   * @return {object}  Reference to this modules API.
   */
  function render () {
    if ( typeof mapInstance === 'undefined' ) {
      mapInstance = new google.maps.Map( container, mapOptions ) 
    }
    return api;
  }


  /**
   * Get or set the map data.
   * Given an array of data (or an object that gets turned into an array)
   * create the appropriate underlying representation for that data.
   *
   * Currently supports & assumes that the desired outcome is to
   * create a marker for each of the datum.
   * 
   * @param  {?object} x [description]
   * @return {[type]}   [description]
   */
  function data ( x ) {
    if ( ! arguments.length ) return mapInstance.data;
    // process data
    return api;
  }
}
