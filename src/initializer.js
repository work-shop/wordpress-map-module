/* globals google.maps */
var deepmerge = require( 'deepmerge' )
var makeMap = require( './index.js' )

module.exports = Initializer;

// TODO: Add docs based including description of options
function Initializer ( options ) {
  if ( ! ( this instanceof Initializer ) ) return new Initializer( options )

  var selector = options.selector;

  if ( ! selector ) {
    throw new Error( 'Map module initialization requires a selector to be defined in its options.' )
  }

  var defaultMapInitializingOptions = options.map || {}
  var defaultMapMarkerOptions = options.marker || {}
  defaultMapMarkerOptions.popup = defaultMapMarkerOptions.popup || {}

  var mapElements = document.querySelectorAll( selector )
  var mapInstances = [];

  for (var i = 0; i < mapElements.length; i++) {
    var mapElement = mapElements[ i ]
    try {
      var mapOptionsVariable = mapElement.dataset.options;
      var mapOptions = window[ mapOptionsVariable ]
    } catch ( error ) {
      var errorMessage = 'Could not initialzie map.\n' +
        'The map element has no `data-options` varible defined.\n'+
        'The value for `data-options` should be the variable on `window` ' +
        'that contains an object that defines options for initializing the map.\n' +
        'Valid options include:\n'+
        '- `map`: an object to extend the default map configuration with.\n' +
        '- `data`: an array of objects to render on the map.\n'+
        '- `render`: an object with { center: { lat, lng }, zoom } that defines the' +
        ' center point and zoom level for the map.'
      throw new Error( errorMessage )
    }

    var instanceMapInitializationOptions = mapOptions.map || {}
    var mapInitializingOptions = Object.assign(
      { container: mapElement },
      defaultMapInitializingOptions,
      instanceMapInitializationOptions
    )

    var currentMap = makeMap( mapInitializingOptions )

    if ( mapOptions.data ) {
      currentMap.data( mapOptions.data )
      var mapData = currentMap.data()
      mapData = mapData.map( function ( mapFeatureDatum ) {
        if ( mapFeatureDatum.marker ) {
          mapFeatureDatum.marker = deepmerge( defaultMapMarkerOptions, mapFeatureDatum.marker )
        }
        return mapFeatureDatum;
      } )
      currentMap.data( mapData )
    }
    if ( mapOptions.render ) {
      currentMap.render( mapOptions.render )
    }
    else {
      currentMap.render()
    }

    mapInstances.push( currentMap );

  }

  return mapInstances;
}
