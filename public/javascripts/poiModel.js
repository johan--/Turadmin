/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    var apiUri = function () {
        return "/restProxy/steder";
    };

    ns.Poi = Backbone.Model.extend({
        idAttribute: "_id",

        changed : false,

        deleted: false,

        urlRoot: function () {
            return apiUri();
        },

        defaults : {
            navn: "",
            geojson: {},
            lisens: "CC BY-NC 3.0 NO",
            status: "Kladd",
            privat: {
                opprettet_av: {
                    id: "someId"
                }
            }
        },
        initialize: function (attributes, options) {
            this.on("change", function () {
                this.changed = true;
            });
            this.on("change:geojson", function () {
                if (this.hasPosition() && this.getMarker() === undefined) {
                    this.createMarker(this.get("geojson"));
                }
            });
        },

        hasChanged: function () {
            return !!this.changed;
        },

        resetHasChanged: function () {
            this.changed = false;
        },

        isDeleted: function () {
            return !!this.get("deleted") && this.get("deleted");
        },

        getGeoJson: function () {
            return _.clone(this.get("geojson"));
        },

        getMarker: function () {
            return this.marker;
        },

        hasMarker: function () {
            return !!this.marker;
        },

        hasPosition: function () {
            var geojson = this.get("geojson");
            return !!geojson && !!geojson.coordinates;
        },

        deletePoi: function () {
            this.set("deleted", true);
            this.trigger("deletePoi");
        },

        createMarker: function () {
            var icon = new L.icon({
                iconUrl: 'images/poi/map-icon-image.png',
                iconRetinaUrl: 'images/poi/map-icon-image@2x.png',
                iconSize: [26, 32],
                iconAnchor: [13, 32],
                popupAnchor: [-0, -30]
            });
            var marker = new L.Marker([this.getGeoJson().coordinates[1], this.getGeoJson().coordinates[0]], {draggable: true});
            this.marker = marker;
            marker.setIcon(icon);
            this.trigger('registerPopup', {model: this, templateId: "#poiPopupTemplate"});
            marker.on("dragend", function () {
                var lat = marker.getLatLng().lat;
                var lng = marker.getLatLng().lng;
                this.updateGeojson(lat, lng);
            }, this);
            this.trigger("poi:markerCreated", this);
        },

        updateGeojson: function (lat, lng) {
            var geoJson = this.getGeoJson();
            geoJson.coordinates = [lng, lat];
            this.set("geojson", geoJson);
        }
    });

}(DNT));
