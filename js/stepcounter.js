(function() {
  'use strict';

  const REALTIME_STEPS_CHAR = '00002a53-0000-1000-8000-00805f9b34fb'; 

  class Stepcounter {
    constructor() {
      this.device = null;
      this.server = null;
      this._characteristics = new Map();
    }
    connect() {
      return navigator.bluetooth.requestDevice({filters:[{services:[ 0x1814 ]}]})
      .then(device => {
        this.device = device;
        return device.gatt.connect();
      })
      .then(server => {
        this.server = server;
        return Promise.all([
          server.getPrimaryService(0x1814).then(service => {
            return Promise.all([
              this._cacheCharacteristic(service, REALTIME_STEPS_CHAR),
              this._cacheCharacteristic(service, '00002a54-0000-1000-8000-00805f9b34fb'),
            ])
          })
        ]);
      })
    }

    /* Steps Rate Service */
    startNotificationsStepRateMeasurement() {
      return this._startNotifications(REALTIME_STEPS_CHAR);
    }
    stopNotificationsStepRateMeasurement() {
      return this._stopNotifications(REALTIME_STEPS_CHAR);
    }
    parseStepRate(value) {
      // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
      value = value.buffer ? value : new DataView(value);
      let flags = value.getUint8(0);
      console.log('flags: ' + flags);
      let rate16Bits = flags & 0x1;
      let result = {};

      result.stepRate = value.getUint32(6, /*littleEndian=*/true);
      console.log('Total Distance: ' + result.stepRate);
      result.energyExpended = value.getUint16(1, /*littleEndian=*/true);
      console.log('Instantaneous Speed: ' + result.energyExpended);

      return result;
    }

    /* Utils */

    _cacheCharacteristic(service, characteristicUuid) {
      return service.getCharacteristic(characteristicUuid)
      .then(characteristic => {
        this._characteristics.set(characteristicUuid, characteristic);
      });
    }
    _readCharacteristicValue(characteristicUuid) {
      let characteristic = this._characteristics.get(characteristicUuid);
      return characteristic.readValue()
      .then(value => {
        // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
        value = value.buffer ? value : new DataView(value);
        return value;
      });
    }
    _writeCharacteristicValue(characteristicUuid, value) {
      let characteristic = this._characteristics.get(characteristicUuid);
      return characteristic.writeValue(value);
    }
    //returns a Promise to the BluetoothRemoteGATTCharacteristic instance when there is an active notification on it.
    _startNotifications(characteristicUuid) {
      let characteristic = this._characteristics.get(characteristicUuid);
      // Returns characteristic to set up characteristicvaluechanged event
      // handlers in the resolved promise.
      return characteristic.startNotifications()
      .then(() => characteristic);
    }
    _stopNotifications(characteristicUuid) {
      let characteristic = this._characteristics.get(characteristicUuid);
      // Returns characteristic to remove characteristicvaluechanged event
      // handlers in the resolved promise.
      return characteristic.stopNotifications()
      .then(() => characteristic);
    }
  }

  window.stepcounter = new Stepcounter();

})();