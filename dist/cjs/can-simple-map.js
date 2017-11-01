/*can-simple-map@3.3.1#can-simple-map*/
var Construct = require('can-construct');
var canEvent = require('can-event');
var canBatch = require('can-event/batch/batch');
var assign = require('can-util/js/assign/assign');
var each = require('can-util/js/each/each');
var types = require('can-types');
var Observation = require('can-observation');
var canReflect = require('can-reflect');
var singleReference = require('can-util/js/single-reference/single-reference');
var CIDMap = require('can-util/js/cid-map/cid-map');
var SimpleMap = Construct.extend({
    setup: function (initialData) {
        this._data = {};
        this.attr(initialData);
    },
    attr: function (prop, value) {
        var self = this;
        if (arguments.length === 0) {
            Observation.add(this, '__keys');
            var data = {};
            each(this._data, function (value, prop) {
                Observation.add(this, prop);
                data[prop] = value;
            }, this);
            return data;
        } else if (arguments.length > 1) {
            var had = this._data.hasOwnProperty(prop);
            var old = this._data[prop];
            this._data[prop] = value;
            canBatch.start();
            if (!had) {
                canEvent.dispatch.call(this, '__keys', []);
            }
            canEvent.dispatch.call(this, prop, [
                value,
                old
            ]);
            canBatch.stop();
        } else if (typeof prop === 'object') {
            canReflect.eachKey(prop, function (value, key) {
                self.attr(key, value);
            });
        } else {
            if (prop !== 'constructor') {
                Observation.add(this, prop);
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
assign(SimpleMap.prototype, canEvent);
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
        Observation.add(this, '__keys');
        return Object.keys(this._data);
    },
    'can.assignDeep': function (source) {
        canBatch.start();
        canReflect.assignMap(this, source);
        canBatch.stop();
    },
    'can.updateDeep': function (source) {
        canBatch.start();
        canReflect.updateMap(this, source);
        canBatch.stop();
    },
    'can.onKeyValue': function (key, handler) {
        var translationHandler = function (ev, newValue, oldValue) {
            handler.call(this, newValue, oldValue);
        };
        singleReference.set(handler, this, translationHandler, key);
        this.addEventListener(key, translationHandler);
    },
    'can.offKeyValue': function (key, handler) {
        this.removeEventListener(key, singleReference.getAndDelete(handler, this, key));
    },
    'can.keyHasDependencies': function (key) {
        return false;
    },
    'can.getKeyDependencies': function (key) {
        return undefined;
    }
});
module.exports = SimpleMap;