var Gpio = require('onoff').Gpio;
var Service, Characteristic;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory('homebridge-gpio-switch-dualrelay', 'GPIOSwitchDualRelay', GPIOAccessory);
};

function GPIOAccessory(log, config) {
    this.log = log;
    this.name = config['name'];
    this.pinOn = config['pin-on'];
    this.pinOff = config['pin-off'];
    this.statep = config['statep'];
    this.service = new Service.Switch(this.name);

    var relaypOn = new Gpio(this.pinOn, 'out');
    var relaypOff = new Gpio(this.pinOff, 'out');

    if(this.statep===true){
      relaypOn.writeSync(1);
      relaypOff.writeSync(0);
    }else{
      relaypOn.writeSync(0);
      relaypOff.writeSync(1);
    }

    if (!this.pinOn) throw new Error('You must provide a config value for pin-on.');
    if (!this.pinOff) throw new Error('You must provide a config value for pin-off.');

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
    var relayOn = new Gpio(this.pinOn, 'out');
    var relayOff = new Gpio(this.pinOff, 'out');
    if(on){
      relayOn.writeSync(1);
      relayOff.writeSync(0);
      this.state = true;
    }else{
      relayOn.writeSync(0);
      relayOff.writeSync(1);
      this.state = false;
    }
    this.log('writing ' + (on ? 'true' : 'false') + ' to gpio: ' + this.pinOn + 'and ' + (on ? 'false' : 'true') + ' to gpio: ' + this.pinOff);
		callback(null);
}
