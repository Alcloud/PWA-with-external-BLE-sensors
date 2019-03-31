(function() {
  'use strict';

  const GLUCOSE_CHAR = '00002a51-0000-1000-8000-00805f9b34fb'; //00002a51-0000-1000-8000-00805f9b34fb Glucose

  class GlucoseMeter {
    constructor() {
      this.device = null;
      this.server = null;
      this._characteristics = new Map();
    }

    connect() {
      return navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [0x1800, 0x1808]
      })
      .then(device => { 
        this.device = device;
        return device.gatt.connect();
      })
      .then(server => {
        this.server = server;
        return Promise.all([
          server.getPrimaryService(0x1808).then(service => {
            return Promise.all([
              this.cacheCharacteristic(service, GLUCOSE_CHAR),
            ])
          })
        ]);
      })
    }

    disconnect() {
      if (!this.device || !this.device.gatt) {
        return Promise.resolve();
      }
      return this.device.gatt.disconnect();
    }

    getDeviceName() {
      return this.device.gatt.getPrimaryService(0x1800)
      .then(service => service.getCharacteristic('gap.device_name'))
      .then(characteristic => characteristic.readValue())
      .then(data => {
        let decoder = new TextDecoder('utf-8');
        console.log('Name: ' + decoder.decode(data));
        return decoder.decode(data);
      });
    }

    getInitialGlucose() {
       return this.device.gatt.getPrimaryService(0x1808)
      .then(service => service.getCharacteristic(GLUCOSE_CHAR))
      .then(characteristic => characteristic.readValue())
      .then(data => data.getUint16(3, /*littleEndian=*/true));
    }

    getGlucose(value) {
      value = value.buffer ? value : new DataView(value);
      let glucose = value.getUint8(0);
      console.log('flags: ' + glucose);
      return glucose;
    }

    startNotificationsGlucose() {
      return this.startNotifications(GLUCOSE_CHAR);
    }

    startNotifications(characteristicUuid) {
      let characteristic = this._characteristics.get(characteristicUuid);
      // Returns characteristic to set up characteristicvaluechanged event
      return characteristic.startNotifications()
      .then(() => characteristic);
    }

    cacheCharacteristic(service, characteristicUuid) {
      return service.getCharacteristic(characteristicUuid)
        .then(characteristic => {
          this._characteristics.set(characteristicUuid, characteristic);
      });
    }
  }

  window.glucoseMeter = new GlucoseMeter();

})();