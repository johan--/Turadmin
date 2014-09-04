/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    function createIconConfig() {
        return new L.icon({
            iconUrl: '/images/markers/21.png',
            iconRetinaUrl: '/images/markers/21@2x.png',
            iconSize: [26, 32],
            iconAnchor: [13, 32],
            popupAnchor: [-0, -30]
        });
    }

    function createGeojson(coordinates) {
        var geojson = {
            type: "Point",
            coordinates: [coordinates.layer._latlng.lng, coordinates.layer._latlng.lat],
            properties: {}
        };
        return geojson;
    }


    ns.RouteDrawView = Backbone.View.extend({
        el: '[data-view="route-draw"]',
        drawMarkerTool: undefined,
        draw: false,
        routeModel: undefined,
        modelToPosition: undefined,
        routingEnabled: true,
        snappingEnabled: true,

        events: {
            'click [data-toggle="route-draw-tool"]': 'toggleDraw',
            'click [data-route-draw-toggle-routing]': 'toggleRouting',
            'click [data-route-direction-option]': 'setRouteDirection',
            'click [data-action="route-draw-reset"]': 'routeDrawReset'
        },

        initialize: function () {
            this.poiCollection = this.model.get('poiCollection');
            this.pictureCollection = this.model.get("pictureCollection");
            this.routeModel = this.model.get("route");
            _.bindAll(this, 'startPicturePositioning', 'startPoiPositioning', 'zoomAndCenter', 'loadGpxGeometry', 'renderDrawButton', 'toggleRouting', 'showPicturePosition');
            this.routeModel.on("geojson:add", this.addGeoJsonToLayer);
            this.event_aggregator.on("map:loadGpxGeometry", this.loadGpxGeometry);
            this.event_aggregator.on("map:positionPicture", this.startPicturePositioning);
            this.event_aggregator.on("map:showPicturePosition", this.showPicturePosition);
            this.event_aggregator.on("map:positionPoi", this.startPoiPositioning);
            this.event_aggregator.on("map:showPopup", this.registerPopover);
            this.event_aggregator.on("map:zoomAndCenter", this.zoomAndCenter);

        },

        toggleDraw: function (e) {
            e.preventDefault();
            this.draw = !this.draw;
            this.mapView.routing.enable(this.draw);

            this.renderDrawButton();

            if (!this.draw) {
                this.setRouteModelGeoJsonFromMap();
            }
        },

        renderDrawButton: function () {
            var $drawButton = $('button[data-toggle="route-draw-tool"]');

            if (this.draw === true) {
                $drawButton.addClass('active');
                $drawButton.find('.buttonText').html('&nbsp;Avslutt inntegning');
            } else {
                var geojson = this.mapView.routing.getGeoJson();
                $drawButton.removeClass("active");
                var label = "&nbsp;Start inntegning";
                if (geojson.coordinates.length > 0) {
                    label = "&nbsp;Fortsett inntegning";
                }
                $drawButton.find(".buttonText").html(label);
                this.routeModel.set({geojson: geojson});
            }
        },

        setRouteModelGeoJsonFromMap: function () {
            var geojson = this.mapView.routing.getGeoJson();
            this.routeModel.set({geojson: geojson});
        },

        setRouteDirection: function (e) {
            e.preventDefault();
            var selectedDirection = $(e.currentTarget).attr('data-route-direction-option');
            this.routeModel.set('retning', selectedDirection);
            this.updateRouteDirectionSelect();
        },

        toggleRouting: function (e) {
            e.preventDefault();
            this.routingEnabled = !this.routingEnabled;
            this.mapView.routing.enableSnapping(this.routingEnabled);
            this.updateRoutingToggle();
        },

        updateRoutingToggle: function () {
            var routingEnabled = (this.routingEnabled) ? true : false;
            $('[data-route-draw-toggle-routing] input[type="checkbox"]').prop('checked', routingEnabled);
        },

        toggleSnapping: function (e) {
            e.preventDefault();
            this.snappingEnabled = !this.snappingEnabled;
            this.mapView.routing.enableSnapping(this.snappingEnabled);
        },

        updateRouteDirectionSelect: function () {
            var routeDirection = this.routeModel.get('retning') || '';
            $('[data-route-direction-option]').removeClass('active');
            $('[data-route-direction-option="' + routeDirection.toLowerCase() + '"]').addClass('active');

            var labelValue = (function (routeDirection) {
                var str = '';
                for ( var i = 0; i < (routeDirection.length); i++) {
                    str += routeDirection.charAt(i).toUpperCase() + '-';
                }
                str = str.substring(0, str.length - 1);
                return str;
            })(routeDirection);

            $('[data-route-direction-value-placeholder]').text(labelValue);
        },

        addOnDrawCreatedEventHandler: function () {
            this.mapView.map.on('draw:created', this.createPoiOrPositionPicture, this);
        },

        createPoiOrPositionPicture: function (coordinates) {
            console.log('mapView:createPoiOrPositionPicture');
            if (!!this.modelToPosition) {
                this.setupMarker(coordinates);
            }
        },

        setupMarker: function (coordinates) {
            var model = this.modelToPosition;
            delete this.modelToPosition;
            this.drawMarkerTool.disable();
            var geojson = createGeojson(coordinates);
            model.set('geojson', geojson);
            this.event_aggregator.trigger('map:markerIsCreated', model);
        },

        createDrawMarkerTool: function () {
            this.drawMarkerTool = new L.Draw.Marker(this.mapView.map, {
                icon: createIconConfig()
            });
        },

        moveMap: function (options, callback) {
            // Set the height of [data-container-for="map-and-controls"] to the height it already has,
            // as a style attribute, to avoid collapsing when moving map to modal.
            $('[data-container-for="map-and-controls"]').height($('[data-container-for="map-and-controls"]').height());
            $('[data-wrapper-for="map-and-controls"]').appendTo('#modal-map .modal-body');
            $('#modal-map').modal('show');

            $('#modal-map').on('hidden.bs.modal', $.proxy(function (e) {
                $('[data-wrapper-for="map-and-controls"]').appendTo($('[data-container-for="map-and-controls"]'));
                this.drawMarkerTool.disable();
            }, this));
        },

        startPicturePositioning: function (picture) {
            this.moveMap();
            if (!picture.hasMarker()) {
                this.modelToPosition = picture;
                this.drawMarkerTool.enable();
            }
        },

        showPicturePosition: function (picture) {

            var mapShowCallback = function (picture) {
                // this.mapView.map.panTo(picture.marker.getLatLng(), { animate: true }); // Using autoPan
                picture.marker.openPopup().update();
                $('#modal-map').off('shown.bs.modal'); // Remove event listener
            };

            var mapHideCallback = function (picture) {
                picture.marker.closePopup();
                $('#modal-map').off('hidden.bs.modal'); // Remove event listener
            };

            // Need to delay the popup showing until after the modal is shown, to prevent messed up popup layout.
            $('#modal-map').on('shown.bs.modal', $.proxy(mapShowCallback, this, picture));

            // Listen to modal hide event, to close popup
            $('#modal-map').on('hidden.bs.modal', $.proxy(mapHideCallback, this, picture));

            this.moveMap();

        },

        loadGpxGeometry: function (gpxGeometry) {
            var routeGeoJson = this.routeModel.get('geojson'),
                routeGeoJsonExists = !!routeGeoJson && !!routeGeoJson.coordinates && (routeGeoJson.coordinates.length > 0);

            if (routeGeoJsonExists === true) {
                this.routeDrawReset();
            }

            this.mapView.addGeoJsonToLayer(gpxGeometry);
            var geoJson = this.mapView.routing.getGeoJson();
            this.routeModel.set('geojson', geoJson);
        },

        startPoiPositioning: function (poi) {
            this.moveMap();
            this.modelToPosition = poi;
            this.drawMarkerTool.enable();
        },

        zoomAndCenter: function (latlng, zoomLevel) {
            if (!!latlng) {
                if (!zoomLevel) {
                    zoomLevel = 13;
                }
                this.mapView.map.setView(latlng, zoomLevel);
            }
        },

        routeDrawReset: function (e) {
            // Change draw state to false
            this.draw = false;

            // Enable routing by default when resetting route
            this.routingEnabled = true;

            var route = this.model.get('route');
            route.unset('geojson');

            var mapCenter = this.mapView.map.getCenter();
            var mapZoom = this.mapView.map.getZoom();

            this.mapView.remove();

            $('[data-container-for="map"]').html('<div data-view="map"></div>');

            this.initMap({
                model: route,
                mapCenter: mapCenter,
                mapZoom: mapZoom,
                pictures: this.pictureCollection,
                pois: this.poiCollection
            });

            this.showFindPlaceAndGpxUpload();
            this.renderDrawButton();
            this.updateRoutingToggle();
        },

        initMap: function (options) {
            this.mapView = new ns.MapView(options);
            this.mapView.render();

            this.addOnDrawCreatedEventHandler();

            this.createDrawMarkerTool();

            // TODO: Handle routing event in DNT.Routing?
            this.mapView.routing.routing.on('routing:routeWaypointEnd', this.setRouteModelGeoJsonFromMap, this);

        },

        render: function () {
            this.initMap({model: this.model.get('route'), pictures: this.pictureCollection, pois: this.poiCollection});

            this.updateRoutingToggle();
            this.updateRouteDirectionSelect();
            this.renderDrawButton();

            return this;
        },

        showFindPlaceAndGpxUpload: function () {
            this.$('.findplace-gpxupload-container').removeClass('hidden');
        },

        hideFindPlaceAndGpxUpload: function () {
            this.$('.findplace-gpxupload-container').addClass('hidden');
        }

    });

}(DNT));
