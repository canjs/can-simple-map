var QUnit = require('steal-qunit');
var SimpleMap = require('./can-simple-map');
var canSymbol = require('can-symbol');
var canReflect = require('can-reflect');
var Observation = require("can-observation");
var ObservationRecorder = require("can-observation-recorder");
var dev = require("can-log/dev/dev");

QUnit.module('can-simple-map');

QUnit.test("sets constructor name", function(assert) {
	var map = new SimpleMap();
	assert.equal(map.constructor.name, "SimpleMap");
});

QUnit.test("instantiates and gets events", 2, function() {
	var map = new SimpleMap({ age: 29 });

	map.on('age', function(ev, newVal, oldVal) {
		QUnit.equal(oldVal, 29);
		QUnit.equal(newVal, 30);
	});

	map.attr('age', 30);
});

QUnit.test("trying to read constructor from refs scope is ok", function(){
	var map = new SimpleMap();
	var construct = new Observation(function(){
		return map.attr("constructor");
	});
	canReflect.onValue(construct, function(){});


	equal(canReflect.getValue(construct), SimpleMap);
});

QUnit.test("get set and serialize", function(){
	var map = new SimpleMap();
	map.set("foo","bar");
	QUnit.equal(map.get("foo"), "bar");
	QUnit.deepEqual(map.get(), {foo: "bar"});

	map.set({zed: "ted"});

	QUnit.deepEqual(map.get(), {foo: "bar", zed: "ted"});

	QUnit.deepEqual(map.serialize(), {foo: "bar", zed: "ted"});

	var deepMap = new SimpleMap({a: "b"});

	map.set("deep", deepMap);


	QUnit.deepEqual(map.serialize(), {foo: "bar", zed: "ted", deep: {a: "b"}});
});

QUnit.test("serialize and get are observable",2, function(){

	var map = new SimpleMap();
	var c1 = new Observation(function(){
		return map.serialize();
	});
	var c2 = new Observation(function(){
		return map.get();
	});

	canReflect.onValue(c1, function(newValue){
		QUnit.deepEqual(newValue, {foo:"bar"}, "updated serialize");
	});

	canReflect.onValue(c2, function(newValue){
		QUnit.deepEqual(newValue, {foo:"bar"}, "updated get");
	});

	map.set("foo","bar");

});

test("works with can-reflect", 8, function(){
	var b = new SimpleMap({ "foo": "bar" });
	// var c = new (SimpleMap.extend({
	// 	"baz": canCompute(function(){
	// 		return b.attr("foo");
	// 	})
	// }))({ "foo": "bar", thud: "baz" });

	QUnit.equal( canReflect.getKeyValue(b, "foo"), "bar", "get value");

	var handler = function(newValue){
		QUnit.equal(newValue, "quux", "observed new value");

		// Turn off the "foo" handler but "thud" should still be bound.
		canReflect.offKeyValue(b, "foo", handler);
	};
	QUnit.ok(!canReflect.isValueLike(b), "isValueLike is false");
	QUnit.ok(canReflect.isMapLike(b), "isMapLike is true");
	QUnit.ok(!canReflect.isListLike(b), "isListLike is false");

	QUnit.ok( !canReflect.keyHasDependencies(b, "foo"), "keyHasDependencies -- false");

	canReflect.onKeyValue(b, "foo", handler);
	// Do a second binding to check that you can unbind correctly.
	canReflect.onKeyValue(b, "baz", handler);

	b.attr("foo", "quux");

	QUnit.equal( canReflect.getKeyValue(b, "foo"), "quux", "bound value");
	// sanity checks to ensure that handler doesn't get called again.
	b.attr("foo", "thud");
	b.attr("baz", "quux");

});

QUnit.test("can-reflect setKeyValue", function(){
	var a = new SimpleMap({ "a": "b" });

	canReflect.setKeyValue(a, "a", "c");
	QUnit.equal(a.attr("a"), "c", "setKeyValue");
});

QUnit.test("can-reflect getKeyDependencies", function() {
	var a = new SimpleMap({ "a": "a" });

	ok(!canReflect.getKeyDependencies(a, "a"), "No dependencies before binding");

});

QUnit.test("registered symbols", function() {
	var a = new SimpleMap({ "a": "a" });

	ok(a[canSymbol.for("can.isMapLike")], "can.isMapLike");
	equal(a[canSymbol.for("can.getKeyValue")]("a"), "a", "can.getKeyValue");
	a[canSymbol.for("can.setKeyValue")]("a", "b");
	equal(a.attr("a"), "b", "can.setKeyValue");

	function handler(val) {
		equal(this, a);
		equal(val, "c", "can.onKeyValue");
	}

	a[canSymbol.for("can.onKeyValue")]("a", handler);
	a.attr("a", "c");

	a[canSymbol.for("can.offKeyValue")]("a", handler);
	a.attr("a", "d"); // doesn't trigger handler
});

QUnit.test("initialization does not cause Observation.add", function(){
	ObservationRecorder.start();
	var m = new SimpleMap();
	m = new SimpleMap({first: "second"});
	var observationRecord = ObservationRecorder.stop();

	QUnit.equal(observationRecord.keyDependencies.size , 0, "no key deps");
	QUnit.equal(observationRecord.valueDependencies.size , 0, "no value deps");
});

QUnit.test("log all property changes", function(assert) {
	var map = new SimpleMap();
	var done = assert.async();

	map.log();

	var changed = [];
	var log = dev.log;
	dev.log = function() {
		changed.push(JSON.parse(arguments[2]));
	};

	map.set("foo","bar");
	map.set({zed: "ted"});

	var deepMap = new SimpleMap({a: "b"});
	map.set("deep", deepMap);

	assert.expect(1);
	setTimeout(function() {
		dev.log = log;
		assert.deepEqual(changed, ["foo", "zed", "deep"], "should log all properties");
		done();
	});
});

QUnit.test("log single property changes", function(assert) {
	var map = new SimpleMap();
	var done = assert.async();

	map.log("foo");

	var changed = [];
	var log = dev.log;
	dev.log = function() {
		changed.push(JSON.parse(arguments[2]));
	};

	map.set("foo", "bar");
	map.set("bar", "bar");
	map.set("baz", "baz");

	assert.expect(1);
	setTimeout(function() {
		dev.log = log;
		assert.deepEqual(changed, ["foo"], "should only log 'foo' changes");
		done();
	});
});

QUnit.test("log multiple property changes", function(assert) {
	var map = new SimpleMap();
	var done = assert.async();

	map.log("foo");
	map.log("qux");

	var changed = [];
	var log = dev.log;
	dev.log = function() {
		changed.push(JSON.parse(arguments[2]));
	};

	map.set("foo", "foo");
	map.set("bar", "bar");
	map.set("baz", "baz");
	map.set("qux", "qux");

	assert.expect(1);
	setTimeout(function() {
		dev.log = log;
		assert.deepEqual(changed, ["foo", "qux"], "should log onlt foo and qux");
		done();
	});
});

QUnit.test("don't dispatch events for sets that don't change", 2, function(){
	var map = new SimpleMap({foo: "bar"});
	canReflect.onKeyValue(map, "foo", function(newVal, oldVal){
		QUnit.equal(newVal, "BAR");
		QUnit.equal(oldVal,"bar");
	});
	map.attr("foo","bar");
	map.attr("foo","BAR");
});

require("can-reflect-tests/observables/map-like/instance/on-get-set-delete-key")("", function(){
	return new SimpleMap();
});
