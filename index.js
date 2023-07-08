var Gpio = require('onoff').Gpio;
var Service, Characteristic;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory('homebridge-gpio-switch-dualrelay', 'GPIOSWITCHDUALL', GPIOAccessory);
};

function GPIOAccessory(log, config) {
    this.log = log;
    this.name = config['name'];
    this.pin = config['pin'];
    this.pin2 = config['pin2'];
    this.statep = config['statop'];
    this.service = new Service.Switch(this.name);

    var relayp = new Gpio(this.pin, 'out');
    var relayp2 = new Gpio(this.pin2, 'out');

    if(this.statep===true){
      relayp.writeSync(1);
      relayp2.writeSync(1);
    }else{
      relayp.writeSync(0);
      relayp2.writeSync(0);
    }

    if (!this.pin) throw new Error('You must provide a config value for pin.');
    if (!this.pin2) throw new Error('You must provide a config value for pin2.');

    this.state = false;


    this.service
        .getCharacteristic(Characteristic.On)
        .on('get', this.getOn.bind(this))
        .on('set', this.setOn.bind(this));

}

GPIOAccessory.prototype.getServices = function() {
    return [this.service];
}

GPIOAccessory.prototype.getOn = function(callback) {
  callback(null, this.state);
}

GPIOAccessory.prototype.setOn = function(on, callback) {
    this.state = !on;
    var relay = new Gpio(this.pin, 'out');
    var relay2 = new Gpio(this.pin2, 'out');
    if(on){
      relay.writeSync(0);
      relay2.writeSync(0);
      this.state = true;
    }else{
      relay.writeSync(1);
      relay2.writeSync(1);
      this.state = false;
    }
    this.log('writing ' + (on ? 'true' : 'false') + ' to gpio: ' + this.pin + '-' + this.pin2);
		callback(null);
}
