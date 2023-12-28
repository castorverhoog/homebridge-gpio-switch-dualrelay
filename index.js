var Gpio = require('onoff').Gpio;
var Service, Characteristic;
var currentTO = null

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory('homebridge-gpio-switch-dualrelay', 'GPIOSwitchDualRelay', GPIOAccessory);
};

const switchPin = (pin, pinNo, inv, time, log) => {
	let timeout
	log("writing "+(inv ^ 1) + " to gpio pin "+ pinNo);
	pin.write(inv ^ 1)
		.then(() => {
			timeout = setTimeout(() => {
				pin.write(inv);
				log("writing "+inv + " to gpio pin "+ pinNo);
				}, time)
		})
		.catch(err => console.log(err));
	return timeout
};

function GPIOAccessory(log, config) {
	this.log = log;
	this.name = config['name'];
	this.pinOn = config['pin-on'];
	this.pinOff = config['pin-off'];
	this.statep = config['statep'] || null;
	this.inversed = config['inversed'] || 1;
	this.activeTime = config['active-time'] || 500; // in milliseconds
	this.service = new Service.Switch(this.name);

	var relaypOn = new Gpio(this.pinOn, 'out');
	var relaypOff = new Gpio(this.pinOff, 'out');

	
	if(this.stapep != null){
		if(this.statep===true){
			relaypOff.writeSync(this.inversed);
			clearTimeout(currentTO)
			currentTO = switchPin(relaypOn, this.pinOn, this.inversed, this.activeTime, this.log); 
		}else{
			relaypOn.writeSync(this.inversed);
			clearTimeout(currentTO)
			currentTO = switchPin(relaypOff, this.pinOff, this.inversed, this.activeTime, this.log);
		}	
	}else{
		relaypOff.writeSync(this.inversed);
		relaypOn.writeSync(this.inversed);
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
		relayOff.writeSync(this.inversed);
		clearTimeout(currentTO)
		currentTO = switchPin(relayOn, this.pinOn, this.inversed, this.activeTime, this.log); 
		this.state = true;
	}else{
		relayOn.writeSync(this.inversed);
		clearTimeout(currentTO)
		currentTO = switchPin(relayOff, this.pinOff, this.inversed, this.activeTime, this.log);
		this.state = false;
	}
	callback(null);
}


