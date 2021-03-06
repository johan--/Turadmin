/**
 * Copyright (c) $year, Den Norske Turistforening (DNT)
 *
 * https://github.com/Turistforeningen/turadmin
 */

define(function (require, exports, module) {
    "use strict";

    // Dependencies
    var $ = require('jquery'),
        _ = require('underscore'),
        Backbone = require('backbone'),
        Template = require('text!templates/pictures/edit.html'),
        User = require('models/user'),
        user = new User();

    require('select2');
    require('backbone-stickit');
    require('backbone-validation');


    // Module
    return Backbone.View.extend({

        template: _.template(Template),

        className: 'picture picture-edit sortable col-sm-4 col-md-4 col-lg-3',

        bindings: {
            '[name="beskrivelse"]': {
                observe: 'beskrivelse',
                setOptions: {
                    validate: true
                }
            },
            '[name="foto-fotograf-navn"]': 'fotografNavn',
            '[name="foto-fotograf-epost"]': 'fotografEpost'
        },

        events: {
            'click [data-action="init-position-picture"]': 'positionPicture',
            'click [data-action="show-position-picture"]': 'showPicturePosition',
            'click [data-toggle-current-user-is-fotograf]': 'toggleCurrentUserIsFotograf',
            'click [data-toggle-commercial-license]': 'toggleCommercialLicense',
            'click [data-action="do-delete"]': 'deletePicture',
            'picturesortstop': 'onPictureSortStop',
            'pictureDropped': 'pictureIndexChanged'
        },

        allFotoTags: ['action', 'ake', 'akrobatikk', 'aksjon', 'aktiv', 'anorakk', 'appelsin', 'august', 'balanse', 'barn', 'blid', 'bre', 'breklatring', 'brevandring', 'briller', 'brodder', 'bærtur', 'bål', 'bålmat', 'båt', 'camp', 'cover', 'dagstur', 'dame', 'damer', 'dessert', 'detaljbilde', 'dnt', 'dnt-hytte', 'dnt ung', 'dråper', 'dugnad', 'dyr', 'elv', 'energi', 'eng', 'familie', 'fellestur', 'festival', 'fiske', 'fjell', 'fjellflørting', 'fjellski', 'fjelltopp', 'fjelltur', 'fjord', 'fjortis', 'flagg', 'flørting', 'fottur', 'fred', 'friluftsliv', 'gapahuk', 'gassbrenner', 'glad', 'glede', 'gps', 'grave', 'grottetur', 'gruppebilde', 'gutt', 'gutter', 'gård', 'hav', 'heia', 'helgetur', 'himmel', 'historie', 'historikk', 'hjelm', 'hopp', 'hund', 'husdyr', 'hverdagstur', 'hygge', 'hytte', 'hyttebok', 'hytteguide', 'hyttekos', 'hytter', 'hyttesamler', 'hytte til hytte', 'hyttetur', 'hyttevert', 'høst', 'høstaktiviteter', 'høstferie', 'høstfjellet', 'høsttur', 'innsjø', 'instruktør', 'interiør', 'is', 'isbre', 'isklatring', 'isøks', 'jente', 'jenter', 'jubel', 'jul', 'kaffe', 'kajakk', 'kajakkpadling', 'kajakktur', 'kake', 'kaldt', 'karabin', 'kart', 'kiting', 'kjærester', 'kjærlighet', 'klart', 'klatre', 'klatrekurs', 'klatresko', 'klatretau', 'klatring', 'klem', 'klipper', 'klær', 'kompass', 'kopp', 'kos', 'kurs', 'kveld', 'kvinne', 'kvinner', 'kvist', 'kvisteløype', 'kyss', 'kyst', 'landskap', 'langrenn', 'langrute', 'langtur', 'latter', 'le', 'leder', 'leir', 'leirliv', 'lek', 'leke', 'logo', 'lommelykttur', 'lykt', 'lys', 'løp', 'løpe', 'løype', 'maling', 'mann', 'mat', 'matlaging', 'menn ', 'menneske', 'merke', 'merking', 'middag', 'mobiltelefon', 'mor', 'morgen', 'mose', 'musikk', 'måltid', 'månelyst', 'natt', 'natur', 'naturen', 'nordlys', 'norge', 'norsk', 'nyttår', 'nærhet', 'nærmiljø', 'nærtur', 'opptur', 'orientering', 'padle', 'padling', 'par', 'partnere', 'pause', 'pinnebrød', 'planlegging', 'portrett', 'publikum', 'pulk', 'påkledning', 'regn', 'reise', 'robåt', 'rullestol', 'ryggsekk', 'rødekors', 'sekk', 'selvbetjent', 'sender/mottaker', 'senior', 'sikkerhet', 'sikkerhetsutstyr', 'siluett', 'singel', 'ski', 'skihopp', 'skilek', 'skilt', 'skilting', 'skiløype', 'skisko', 'skitur', 'skiutstyr', 'skog', 'skogtur', 'skole', 'skolehytter', 'skoletur', 'skred', 'skredfare', 'skredsøker', 'skredutstyr', 'smarttelefon', 'smil', 'sne', 'snekring', 'snø', 'snøhuletur', 'snøskred', 'sol', 'solbriller', 'solnedgang', 'soloppgang', 'sommer', 'sopptur', 'sosialt', 'sovepose', 'sovesal', 'spade', 'spill', 'spor', 'staver', 'stearinlys', 'steinhytte', 'stemning', 'sti', 'stier', 'stillenatur', 'stillhet', 'stjerner', 'sykkel', 'sykkeltur', 'symboler', 'sæter', 'søkestang', 'telefon', 'telt', 'tenåring', 'terreng', 'tid', 'tilrettelegging', 'tinder', 'tinderangling', 'tog', 'toget', 'topp', 'topptur', 'trilletur', 'trygg', 'tur', 'turbo', 'turdag', 'turfølge', 'turglad', 'turglede', 'turinfo', 'turistforeningshytte', 'turisthytte', 'turlag', 'turleder', 'turledere', 'turmat', 'turpartnere', 'turplanlegging', 'turskilt', 'turutstyr', 'tyttebær', 'tåke', 'ubetjent', 'ung', 'ungdom', 'ut', 'ute', 'uteaktiviteter', 'utsikt', 'utstyr', 'vandring', 'vann', 'varde', 'varding', 'vei', 'veivalg', 'venner', 'vennetur', 'vertskap', 'vidde', 'villmark', 'vind', 'vindsekk', 'vinter', 'vinteraktivitet', 'vinteraktiviteter', 'vinterbekledning', 'vinterferie', 'vinterfjellet', 'vintermerking', 'vinterruter', 'vintertur', 'vintervett', 'vær', 'vår', 'vårskitur', 'x-ung', 'yatzy', 'årstid'],

        initialize: function (options) {

            // TODO: Map... Add some logic to set up a new map if one is not passed as an option
            this.map = options.map;

            this.model.on('change:isPositioned', this.render, this);
            _.bindAll(this, 'deletePicture', 'positionPicture', 'showPicturePosition');
        },

        positionPicture: function (e) {
            var picture = this.model;
            this.map.positionModel(picture, $.proxy(this.onPositionPicture, this));
        },

        onPositionPicture: function (picture, latLng) {
            picture.set('geojson', {type: 'Point', coordinates: latLng.reverse()});
        },

        showPicturePosition: function () {
            var picture = this.model;
            this.map.showModelPosition(picture);
        },

        toggleCurrentUserIsFotograf: function (e) {

            var currentUserIsFotograf = $(e.currentTarget).prop('checked') ? true : false;

            if (currentUserIsFotograf) {
                this.setCurrentUserAsFotograf();
                this.$('.form-group-fotograf').addClass('hidden');
            } else {
                this.model.set('fotografNavn', '');
                this.model.set('fotografEpost', '');
                this.$('.form-group-fotograf').removeClass('hidden');
            }

        },

        toggleCommercialLicense: function (e) {
            var hasCommercialLicense = $(e.currentTarget).prop('checked') ? true : false;
            this.model.setCommercialLicense(hasCommercialLicense);
        },

        deletePicture: function (e) {
            // Remove model (from collection)
            this.model.remove();

            // Remove view
            this.remove();
        },

        pictureIndexChanged: function (event, index) {
            //Trig event to tell picturesView.js instance which model has a new index
            this.$el.trigger('updatePictureIndexes', [this.model, index]);
        },

        // onPictureSortStop: function (e, index) {
        //     // Trig event to tell picturesView.js instance which model has a new index
        //     this.$el.trigger('updatePictureIndexes', [this.model, index]);
        // },

        setCurrentUserAsFotograf: function () {
            var currentUser = user;
            this.model.set('fotografNavn', currentUser.get('navn'));
            this.model.set('fotografEpost', currentUser.get('epost'));
        },

        currentUserIsFotograf: function () {
            var currentUserNavn = user.get('navn');
            var fotograf = this.model.get('fotografNavn');
            return (currentUserNavn === fotograf);
        },

        onPhotoTagsChange: function (e) {
            var tags = e.val;
            this.model.set('tags', tags);
        },

        render: function () {

            if (this.model.isDeleted()) {
                this.remove();

            } else {
                var json = this.model.toJSON();
                json.hasCommercialLicense = this.model.hasCommercialLicense();
                var html = this.template(json);
                this.$el.html(html);

                this.stickit(); // Uses view.bindings and view.model to setup bindings
                Backbone.Validation.bind(this);

                this.$('input[name="foto-tags"]')
                    .select2({placeholder: 'Tagger', tags: this.allFotoTags, tokenSeparators: [',', ' ']})
                    .select2('val', this.model.get('tags'))
                    .on('change', $.proxy(this.onPhotoTagsChange, this));

                if (this.currentUserIsFotograf()) {
                    this.$('.form-group-fotograf').addClass('hidden');
                    this.$('[name="foto-jeg-har-tatt-bildet"]').prop('checked', true);
                }


                // Set up popover help
                this.$('.form-group-license [data-toggle-help-popover]').popover({
                    content: [
                        '<p><strong>Fri bruk:</strong> Bildet kan benyttes til alle formål mot kreditering (<a href="https://creativecommons.org/licenses/by-sa/4.0/deed.no">CC BY-SA 4.0</a>).</p>',
                        '<p><strong>Ikke fri bruk:</strong> Bildet kan ikke benyttes til kommersielle formål, men kan ellers benyttes av alle mot kreditering (<a href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.no">CC BY-NC-SA 4.0</a>).</p>',
                        '<a data-action="close">Lukk</a>'].join(''),
                    html: true,
                    placement: 'top',

                }).on('show.bs.popover', function () {
                    // If any other popovers are visible, hide them
                    $('.popover').each(function () {
                        $(this).popover('hide');
                    });

                }).on('shown.bs.popover', function () {
                    // Hide the popover if close link inside it is clicked
                    $(this).nextAll('.popover').first().find('a[data-action="close"]').on('click', $.proxy(function (e) {
                        $(this).popover('hide');
                    }, this));
                });
            }

            return this;
        },

        remove: function() {
            // Remove the validation binding
            // See: http://thedersen.com/projects/backbone-validation/#using-form-model-validation/unbinding
            Backbone.Validation.unbind(this);
            return Backbone.View.prototype.remove.apply(this, arguments);
        }

    });

});
