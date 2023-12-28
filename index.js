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
	this.statep = config['statep'] || null;
	this.inversed = config['inversed'] == null ? 1 : config['inversed'];
	this.activeTime = config['active-time'] || 500; // in milliseconds
	this.service = new Service.Switch(this.name);
	
	// ouput pins
	this.pinOn = config['pin-on'];
	this.pinOff = config['pin-off'];
	// interrupt pins
	this.inPinOn = config['in-pin-on'];
	this.inPinOff = config['in-pin-off'];
	

	// output pins
	var relaypOn = new Gpio(this.pinOn, 'out');
	var relaypOff = new Gpio(this.pinOff, 'out');

	// input pins for manually closing and opening
	var inpOn = new Gpio(this.inPinOn, 'in', 'rising', {debounceTimeout: 100});
	var inpOff = new Gpio(this.inPinOff, 'in', 'rising', {debounceTimeout: 100});

	let cbFunc = (on, val) => {
		if (val == false) return;
		if(on){
			relaypOn.writeSync(this.inversed);
			clearTimeout(currentTO)
			currentTO = switchPin(relaypOff, this.pinOff, this.inversed, this.activeTime, this.log);
		} else {	
			relaypOff.writeSync(this.inversed);
			clearTimeout(currentTO)
			currentTO = switchPin(relaypOn, this.pinOn, this.inversed, this.activeTime, this.log); 
		}
	}

	inpOn.watch((_,val) =>  cbFunc(true, val))
	inpOff.watch((_,val) =>  cbFunc(false, val))

	// opening or closing at startup
	if(this.statep != null){
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


