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
  var deafultRenderOptions = options.render || {}

  var mapElements = document.querySelectorAll( selector )
  var mapInstances = [];

  for (var i = 0; i < mapElements.length; i++) {
    var mapElement = mapElements[ i ]
    var mapOptionsVariable = mapElement.dataset.options;
    var mapOptions = window[ mapOptionsVariable ]
    if ( ! mapOptions ) {
      var mapOptions = {
        map: {},
        data: [],
        render: {},
      }
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

    currentMap.render( deepmerge( deafultRenderOptions, ( mapOptions.render || {} ) ) )

    mapInstances.push( currentMap );

  }

  return mapInstances;
}
