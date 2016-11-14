var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var err = null; // in case there were any problems

////////////////CHANGE THESE SETTINGS TO MATCH YOUR SETUP BEFORE RUNNING!!!!!!!!!!!!!//////////////////////////
////////////////CHANGE THESE SETTINGS TO MATCH YOUR SETUP BEFORE RUNNING!!!!!!!!!!!!!//////////////////////////
var name = "Christmas Tree Lights";
var UUID = "hap-nodejs:accessories:ChristmasTreeLight";
var USERNAME = "DF:DF:DF:DF:00:DF";

var MQTT_IP = '192.168.0.80'
var MQTT_State_Topic = '0327F4/switch/state'
var MQTT_Command_Topic = '0327F4/switch/switch'
////////////////CHANGE THESE SETTINGS TO MATCH YOUR SETUP BEFORE RUNNING!!!!!!!!!!!!!//////////////////////////
////////////////CHANGE THESE SETTINGS TO MATCH YOUR SETUP BEFORE RUNNING!!!!!!!!!!!!!//////////////////////////

// MQTT Setup
var mqtt = require('mqtt');
var options = {
  port: 1883,
  host: MQTT_IP,
  clientId: 'DF_ChristmasLight'
};

var client = mqtt.connect(options);


// here's a fake hardware device that we'll expose to HomeKit
var CHRISTMAS_LIGHT = {
    powerOn: false,
    setPowerOn: function(on) {
    console.log("Turning the Christmas Tree Lights %s!...", on ? "on" : "off");
    if (on) {
          client.publish(MQTT_Command_Topic, 'ON');
          CHRISTMAS_LIGHT.powerOn = on;
    } else {
          client.publish(MQTT_Command_Topic,'OFF');
          CHRISTMAS_LIGHT.powerOn = false;
    }
  },
    identify: function() {
    console.log("Identify the outlet!");
    }
}

// Generate a consistent UUID for our Temperature Sensor Accessory that will remain the same
// even when restarting our server. We use the `uuid.generate` helper function to create
// a deterministic UUID based on an arbitrary "namespace" and the string "temperature-sensor".
var outletUUID = uuid.generate(UUID);

// This is the Accessory that we'll return to HAP-NodeJS that represents our fake lock.
var outlet = exports.accessory = new Accessory(name, outletUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
outlet.username = USERNAME;
outlet.pincode = "031-45-154";

// Add the actual TemperatureSensor Service.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKitTypes.js`
outlet
  .getService(Service.AccessoryInformation)
  .setCharacteristic(Characteristic.Manufacturer, "DF_Sonoff")
  .setCharacteristic(Characteristic.Model, "ESP_Sonoff")
  .setCharacteristic(Characteristic.SerialNumber, "DF0327F4")
  .getCharacteristic(Characteristic.CurrentTemperature)

// listen for the "identify" event for this Accessory
outlet.on('identify', function(paired, callback) {
  CHRISTMAS_LIGHT.identify();
  callback(); // success
});

// Add the actual outlet Service and listen for change events from iOS.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKitTypes.js`
outlet
  .addService(Service.Outlet, name) // services exposed to the user should have "names" like "Fake Light" for us
  .getCharacteristic(Characteristic.On)
  .on('set', function(value, callback) {
    if (value != CHRISTMAS_LIGHT.powerOn) {
        CHRISTMAS_LIGHT.setPowerOn(value);
    }
    callback(); // Our fake Outlet is synchronous - this value has been successfully set
  });

// We want to intercept requests for our current power state so we can query the hardware itself instead of
// allowing HAP-NodeJS to return the cached Characteristic.value.
outlet
  .getService(Service.Outlet)
  .getCharacteristic(Characteristic.On)
  .on('get', function(callback) {

    // this event is emitted when you ask Siri directly whether your light is on or not. you might query
    // the light hardware itself to find this out, then call the callback. But if you take longer than a
    // few seconds to respond, Siri will give up.

    var err = null; // in case there were any problems

    if (CHRISTMAS_LIGHT.powerOn) {
      console.log("Are we on? Yes.");
      callback(err, true);
    }
    else {
      console.log("Are we on? No.");
      callback(err, false);
    }
  }); 

    client.subscribe(MQTT_State_Topic);
    client.on('message', function(topic, message) {
    CHRISTMAS_LIGHT.powerOn = (message.toString() == 'ON' ? true : false);

outlet
    .getService(Service.Outlet)
    .setCharacteristic(Characteristic.On, CHRISTMAS_LIGHT.powerOn);
});




