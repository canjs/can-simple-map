/*can-simple-map@4.0.0-pre.0#can-simple-map*/
define([
    'require',
    'exports',
    'module',
    'can-construct',
    'can-event-queue',
    'can-queues',
    'can-util/js/each',
    'can-types',
    'can-observation-recorder',
    'can-reflect',
    'can-cid/map'
], function (require, exports, module) {
    var Construct = require('can-construct');
    var eventQueue = require('can-event-queue');
    var queues = require('can-queues');
    var each = require('can-util/js/each');
    var types = require('can-types');
    var ObservationRecorder = require('can-observation-recorder');
    var canReflect = require('can-reflect');
    var CIDMap = require('can-cid/map');
    var SimpleMap = Construct.extend({
        setup: function (initialData) {
            this._data = {};
            this.attr(initialData);
        },
        attr: function (prop, value) {
            var self = this;
            if (arguments.length === 0) {
                ObservationRecorder.add(this, '__keys');
                var data = {};
                each(this._data, function (value, prop) {
                    ObservationRecorder.add(this, prop);
                    data[prop] = value;
                }, this);
                return data;
            } else if (arguments.length > 1) {
                var had = this._data.hasOwnProperty(prop);
                var old = this._data[prop];
                this._data[prop] = value;
                queues.batch.start();
                if (!had) {
                    this.dispatch('__keys', []);
                }
                this.dispatch(prop, [
                    value,
                    old
                ]);
                queues.batch.stop();
            } else if (typeof prop === 'object') {
                canReflect.eachKey(prop, function (value, key) {
                    self.attr(key, value);
                });
            } else {
                if (prop !== 'constructor') {
                    ObservationRecorder.add(this, prop);
                    return this._data[prop];
                }
                return this.constructor;
            }
        },
        serialize: function () {
            return canReflect.serialize(this, CIDMap);
        },
        get: function () {
            return this.attr.apply(this, arguments);
        },
        set: function () {
            return this.attr.apply(this, arguments);
        }
    });
    eventQueue(SimpleMap.prototype);
    if (!types.DefaultMap) {
        types.DefaultMap = SimpleMap;
    }
    canReflect.assignSymbols(SimpleMap.prototype, {
        'can.isMapLike': true,
        'can.isListLike': false,
        'can.isValueLike': false,
        'can.getKeyValue': SimpleMap.prototype.get,
        'can.setKeyValue': SimpleMap.prototype.set,
        'can.deleteKeyValue': function (prop) {
            return this.attr(prop, undefined);
        },
        'can.getOwnEnumerableKeys': function () {
            ObservationRecorder.add(this, '__keys');
            return Object.keys(this._data);
        },
        'can.assignDeep': function (source) {
            queues.batch.start();
            canReflect.assignMap(this, source);
            queues.batch.stop();
        },
        'can.updateDeep': function (source) {
            queues.batch.start();
            canReflect.updateMap(this, source);
            queues.batch.stop();
        },
        'can.keyHasDependencies': function (key) {
            return false;
        },
        'can.getKeyDependencies': function (key) {
            return undefined;
        }
    });
    module.exports = SimpleMap;
});