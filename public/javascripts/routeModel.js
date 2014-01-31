/*
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

var DNT = window.DNT || {};

(function (ns) {
    "use strict";

    var apiUri = function () {
        return "/restProxy/turer";
    };

    ns.Route = Backbone.Model.extend({
        idAttribute: "_id",

        urlRoot: function () {
            return apiUri();
        },

        isValid: function () {
            var geojson = this.get("geojson");
            return !_.isNull(geojson) && !_.isUndefined(geojson);
        },

        defaults : {
            geojson: null,
            retning: "AB",
            lisens: "CC BY-NC 3.0 NO",
            status: "Kladd",
            privat: {
                opprettet_av: {
                    id: "someId"
                }
            }
        },
        initialize: function () {
        }
    });

    ns.RouteCollection = Backbone.Collection.extend({
        url: function () {
            return apiUri();
        },
        model: ns.Route
    });
}(DNT));

