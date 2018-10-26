var $ = require( 'jquery' )
var makeMap = require( '../src/index.js' )
var wordpressMapMaker = require( '../src/initializer.js' )
var apiData = require( './wordpress-api-sample.json' )

// Wait for the Google Maps API to be load ( `window.google.maps` )
$( window ).on('load', function () {

  // // Initialize a map without data to the default coordinates & zoom level
  // makeMap( {
  //   container: document.querySelector( '#map-default' )
  // } ).render()

  var initializerMaps = wordpressMapMaker( {
    selector: '.via-initializer',
    streetViewControl: false,
    styles: [
                {
                    'featureType': 'poi.business',
                    'stylers': [
                    {
                        'visibility': 'off'
                    }
                    ]
                },
                {
                    'featureType': 'poi.park',
                    'stylers': [
                    {
                        'visibility': 'on'
                    }
                    ]
                },
                {
                    'featureType': 'poi.park',
                    'elementType': 'labels.text',
                    'stylers': [
                    {
                        'visibility': 'off'
                    }
                    ]
                },
                {
                    'featureType': 'poi.school',
                    'stylers': [
                    {
                        'visibility': 'off'
                    }
                    ]
                },
                {
                    'featureType': 'road.arterial',
                    'elementType': 'labels.icon',
                    'stylers': [
                    {
                        'visibility': 'off'
                    }
                    ]
                },
                {
                    'featureType': 'road.highway',
                    'stylers': [
                    {
                        'color': '#ffffff'
                    }
                    ]
                },
                {
                    'featureType': 'road.highway',
                    'elementType': 'geometry.stroke',
                    'stylers': [
                    {
                        'color': '#e1e1e1'
                    }
                    ]
                }
            ],
    marker: {
      icon: {
        // fillColor: 'rgb(200, 10, 10)',
        fillColor: 'blue',
      },
      popup: {
        placement: 'left',
        pointer: '8px',
        on: {
          open: function () {
            console.log( 'opened:' + this._options.id )
          },
          close: function () {
            console.log( 'closed:' + this._options.id )
          }
        }
      }
    },
    render: {
      center: { lat: 41.8240, lng: -71.4128 },
      zoom: 17
    },
} );

  initializerMaps[0].data(
            [
                {
                    marker: {
                        position: { lat: 41.8240, lng: -71.4128 },
                        icon: { fillColor: '#6ba442' }
                    }
                },
                {
                    marker: {
                        position: { lat: 41.8244, lng: -71.4132 },
                        icon: { url: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png' }
                    }
                }

            ]
        ).removeFeatures().render( { zoom: 10 } ) ;

    setTimeout( function() {

        initializerMaps[0].render( { zoom: 5 }  );

    }, 1500);


  // Initialize a map with some markers, and default popup styling
  var locationData = apiData.filter( apiDataHasLatLng ).map( apiDataToFeatureObject )

  // // working with ws-popup
  // makeMap( {
  //   container: document.querySelector( '#map-with-ws-popup' )
  // } ).data( locationData )
  //     .render()
  //
  // // Remove features from the map after adding them
  // makeMap( {
  //   container: document.querySelector( '#map-data-removed' )
  // } ).data( locationData )
  //    .render()
  //    .removeFeatures()
} )

function apiDataHasLatLng ( entry ) {
  return $.isPlainObject( entry.acf ) &&
         $.isPlainObject( entry.acf.location_address ) &&
         $.isNumeric( entry.acf.location_address.lat ) &&
         $.isNumeric( entry.acf.location_address.lng )
}

function apiDataToFeatureObject ( entry, index ) {

  var feature = {
    // `marker` object is passed into `google.maps.Marker`
    marker: {
      title: entry.acf.location_address.address,
      position: {
        lat: +entry.acf.location_address.lat,
        lng: +entry.acf.location_address.lng,
      },
    },
  }

  if ( index % 2 === 0 ) {
    // `popup` powers the `src/overlay-popup.js`
    feature.marker.popup = {
      content: `<div>
        <p>${ entry.acf.location_address.address }</p>
        <p>${ entry.acf.location_description }</p>
      </div>`
    }
  }
  else {
    // `icon` powers the icon options for the marker.
    feature.marker.icon = {
      fillColor: 'rgb( 10, 10, 100 )'
    }
  }

  return feature;
}
