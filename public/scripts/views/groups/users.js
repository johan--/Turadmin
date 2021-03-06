/*
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
        GroupModel = require('models/group'),
        Template = require('text!templates/groups/users.html'),
        state = require('state'),
        User = require('models/user'),
        user = new User();

    require('bootstrap');

    // Module
    return Backbone.View.extend({

        template: _.template(Template),

        el: '[data-view="group-users"]',

        bindings: {
            '[name="group-details-field-navn"]': {
                observe: 'navn',
                setOptions: {
                    validate: true
                }
            },
            '[name="group-user-field-navn"]': {
                observe: '_editing_user_navn',
                setOptions: {
                    validate: true
                }
            },
            '[name="group-user-field-epost"]': {
                observe: '_editing_user_epost',
                setOptions: {
                    validate: true
                }
            },
            '[name="group-user-field-new-passord"]': {
                observe: '_editing_user_passord',
                setOptions: {
                    validate: true
                }
            }
        },

        events: {
            'click [data-dnt-action="add-user"]': 'addUser',
            'click [data-dnt-action="edit-user"]': 'editUser',
            'click [data-dnt-action="save-user"]': 'saveUser',
            'click [data-dnt-action="save-group"]': 'saveGroup',
            'click [data-dnt-action="set-random-password"]': 'setRandomPassword',
            'click [data-dnt-action="remove-user"]': 'removeUser',
            'click [data-dnt-action="discard-user-changes"]': 'resetEditingUser'
        },

        initialize: function (options) {

            this.model = options.group || new GroupModel();

            this.editor = options.editor;

            // Bind these methods to this scope
            _.bindAll(this, 'addUser', 'editUser', 'saveUser', 'saveGroup', 'removeUser', 'render');

            this.model.on('change:_editing_user_index', this.render);

            this.user = user;
        },

        addUser: function () {
            var groupUsers = this.model.get('privat').brukere || [];

            this.model.set('_editing_user_index', groupUsers.length);
            this.model.set('_editing_user_navn', '');
            this.model.set('_editing_user_epost', '');
            this.model.set('_editing_user_passord', '');
        },

        editUser: function (e) {
            var userIndex = parseInt(e.target.getAttribute('data-dnt-index'), 10);

            var user = this.model.get('privat').brukere[userIndex];

            this.model.set('_editing_user_index', userIndex);
            this.model.set('_editing_user_navn', user.navn);
            this.model.set('_editing_user_epost', user.epost);
        },

        resetEditingUser: function () {
            this.model.unset('_editing_user_index');
            this.model.unset('_editing_user_navn');
            this.model.unset('_editing_user_epost');
            this.model.unset('_editing_user_passord');
        },

        generatePassword: function () {
            var length = 16;
            var charset = 'abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            var password = '';

            for (var i = 0, n = charset.length; i < length; ++i) {
                password += charset.charAt(Math.floor(Math.random() * n));
            }

            return password;
        },

        setRandomPassword: function () {
            var password = this.generatePassword();
            this.model.set('_editing_user_passord', password);
        },

        saveChanges: function () {
            var userIndex = this.model.get('_editing_user_index');
            var groupPrivate = this.model.get('privat') || {};
            var groupUsers = groupPrivate.brukere || [];
            var user;

            if (typeof userIndex === 'number') {
                if (userIndex < groupUsers.length) {
                    user = groupUsers[userIndex];
                    var passord = this.model.get('_editing_user_passord');
                    if (passord && passord.length) {
                        user.passord = passord;
                    }

                } else if (userIndex === groupUsers.length) {
                    user = {};
                    user.passord = this.model.get('_editing_user_passord');

                }

                user.navn = this.model.get('_editing_user_navn');
                user.epost = this.model.get('_editing_user_epost');

                groupUsers[userIndex] = user;
            }

            groupPrivate.brukere = groupUsers;
            this.model.set('privat', groupPrivate);
        },

        removeUser: function (e) {
            var userIndex = parseInt(e.target.getAttribute('data-dnt-index'), 10);
            var privat = this.model.get('privat');
            var removedUser = privat && privat.brukere && privat.brukere.splice(userIndex, 1) || [];
            this.render();
        },

        saveGroup: function (e) {
            this.model.save();
        },

        saveUser: function (e) {
            this.saveChanges();
            this.editor.save();
        },

        render: function () {

            var html = this.template({model: this.model.toJSON()});
            this.$el.html(html);

            // Set up view bindings and validation

            this.stickit(); // Uses view.bindings and view.model to setup bindings
            Backbone.Validation.bind(this);

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
