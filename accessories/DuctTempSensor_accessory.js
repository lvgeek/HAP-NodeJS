var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;

var Temp = 0.0;

////////////////CHANGE THESE SETTINGS TO MATCH YOUR SETUP BEFORE RUNNING!!!!!!!!!!!!!//////////////////////////
////////////////CHANGE THESE SETTINGS TO MATCH YOUR SETUP BEFORE RUNNING!!!!!!!!!!!!!//////////////////////////
var name = "Duct Temp Sensor";
var UUID = "hap-nodejs:accessories:DuctTemp";
var USERNAME = "DF:DF:DF:DF:DF:01";

var MQTT_IP = '192.168.0.80'
var tempTopic = '/house/duct'
////////////////CHANGE THESE SETTINGS TO MATCH YOUR SETUP BEFORE RUNNING!!!!!!!!!!!!!//////////////////////////
////////////////CHANGE THESE SETTINGS TO MATCH YOUR SETUP BEFORE RUNNING!!!!!!!!!!!!!//////////////////////////

// MQTT Setup
var mqtt = require('mqtt');
var options = {
  port: 1883,
  host: MQTT_IP,
  clientId: 'DF_DuctTempSensor'
};
var client = mqtt.connect(options);
client.subscribe(tempTopic);
client.on('message', function(topic, message) {
//  console.log(parseFloat(message));
  Temp = ((parseFloat(message) - 32) / 1.8);  
});

// here's the temperature sensor device that we'll expose to HomeKit
var TEMP_SENSOR = {

  getTemperature: function() { 
//    console.log("Getting the current temperature!");
    return parseFloat(Temp); 
  }
}

// Generate a consistent UUID for our Temperature Sensor Accessory that will remain the same
// even when restarting our server. We use the `uuid.generate` helper function to create
// a deterministic UUID based on an arbitrary "namespace" and the string "temperature-sensor".
var sensorUUID = uuid.generate(UUID);

// This is the Accessory that we'll return to HAP-NodeJS that represents our fake lock.
var sensor = exports.accessory = new Accessory(name, sensorUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
sensor.username = USERNAME;
sensor.pincode = "031-45-154";

// Add the actual TemperatureSensor Service.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKitTypes.js`
sensor
  .addService(Service.TemperatureSensor)
  .setCharacteristic(Characteristic.Manufacturer, "ESP01-DAF")
  .setCharacteristic(Characteristic.Model, "ESP01-DS18B20")
  .setCharacteristic(Characteristic.SerialNumber, "DF0000002")
  .getCharacteristic(Characteristic.CurrentTemperature)
  .on('get', function(callback) {
    
    // return our current value
    callback(null, TEMP_SENSOR.getTemperature());
  });

// temperature reading every 2 seconds
setInterval(function() {
  
  TEMP_SENSOR.getTemperature();
  
  // update the characteristic value so interested iOS devices can get notified
  sensor
    .getService(Service.TemperatureSensor)
    .setCharacteristic(Characteristic.CurrentTemperature, TEMP_SENSOR.currentTemperature);
  
}, 2000);

