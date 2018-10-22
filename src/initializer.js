/* globals google.maps */

var deepmerge = require( 'deepmerge' )
var makeMap = require( './index.js' )

module.exports = Initializer;

/**
 * Initializer function used to create a series of maps each with the same
 * default options.
 *
 * The `options` that are passed in can be extended on a per map basis
 * using the HTML API. This is done by defining a `data-options` attribute
 * on the HTML element that is being set up as a map. The value of `data-options`
 * should be a string, which refers to the name of a global object that can be
 * used to extend the `options` passed into the Initializer.
 * 
 * @param {object} options  The default options.
 * @param {string} options.select   The selector used to capture map instances to initialize.
 * @param {?object} options.map     The default options for the map instantiation.
 * @param {?object} options.data    The default options for the map's `data` function. Every
 *                                  datum will extend this base data object.
 * @param {?object} options.render  The options to use for the maps first `render`. Use `options.map.render` for consistent default render options.
 * @return {object} mapInstances  An array of map module objects.
 */
function Initializer ( options ) {
  if ( ! ( this instanceof Initializer ) ) return new Initializer( options )

  var selector = options.selector;

  if ( ! selector ) {
    var selectorErrorMessage = 'Map module initialization requires a selector ' +
      'to be defined in its options.' +
      '\n\tInitializer( { container : SelectorString } )'
    throw new Error( selectorErrorMessage )
  }

  delete options.selector;

  var mapElements = document.querySelectorAll( selector )
  var mapInstances = [];

  for (var i = 0; i < mapElements.length; i++) {
    var mapElement = mapElements[ i ]
    var mapOptionsVariable = mapElement.dataset.options;
    var mapOptions = window[ mapOptionsVariable ]

    if ( ! mapOptions ) mapOptions = { map: {}, data: [], render: {} }

    var mapInitializingOptions = Object.assign(
      { container: mapElement },
      options,
      mapOptions.map || {}
    )

    var currentMap = makeMap( mapInitializingOptions )

    if ( mapOptions.data ) currentMap.data( mapOptions.data || [] )

    currentMap.render( mapOptions.render || {} )

    mapInstances.push( currentMap );

  }

  return mapInstances;
}
