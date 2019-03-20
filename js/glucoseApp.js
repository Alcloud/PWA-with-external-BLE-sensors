// connects to Glucose Meter and gets name value and amount of blood sugar
document.querySelector('#connect').addEventListener('click', function() {
  glucoseMeter.connect()
  .then(() => { 
    console.log(glucoseMeter.device);
    document.querySelector('#state').classList.remove('connecting');
    document.querySelector('#state').classList.add('connected');
    return glucoseMeter.getDeviceName().then(handleDeviceName)
    .then(() => glucoseMeter.getInitialGlucose().then(handleInitialGlucose))
    .then(() => glucoseMeter.startNotificationsGlucose().then(handleGlucose));
  })  
  .catch(error => {
    console.error('Argh!', error);
  });
});

function handleDeviceName(deviceName) {
  document.querySelector('.deviceName').value = "Device Name: " + deviceName;
}

function handleInitialGlucose(glucose) {
  document.querySelector('.glucose-amount').value = glucose + " mol/L";
  console.log('GlucoseMAIN: ' + glucose);
}

function handleGlucose(glucose) {
  glucose.addEventListener('characteristicvaluechanged', event => {
    var glucoseMeasurement = glucoseMeter.getGlucose(event.target.value);
    document.querySelector('.glucose-amount').value = glucoseMeasurement;
    console.log('glucoseMeasurementMAIN: ' + glucoseMeasurement);
  })
}

// service worker registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(function() { 
    console.log('Service Worker Registered'); 
  }).catch(function() {
    console.log('Service Worker registration failed');
  });
}
