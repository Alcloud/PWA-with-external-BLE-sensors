var canvas = document.querySelector('canvas');
var statusText = document.querySelector('#statusText');

statusText.addEventListener('click', function() {
  statusText.textContent = 'Just GO!';
  stepRates = [];
  stepcounter.connect()
  .then(() => stepcounter.startNotificationsStepRateMeasurement().then(handleStepRateMeasurement))
  .catch(error => {
    statusText.textContent = error;
  });
});

function handleStepRateMeasurement(stepRateMeasurement) {
  stepRateMeasurement.addEventListener('characteristicvaluechanged', event => {
    var stepRateMeasurement = stepcounter.parseStepRate(event.target.value);
    statusText.innerHTML = 'Geschwindigkeit: ' + stepRateMeasurement.energyExpended/256 + ' m/s ' 
    + ' Gesamtentweg: ' + stepRateMeasurement.stepRate/10 + ' m';
    stepRates.push(stepRateMeasurement.energyExpended/2);
    drawWaves();
  });
}

var stepRates = [];
var mode = 'bar';

canvas.addEventListener('click', event => {
  mode = mode === 'bar' ? 'line' : 'bar';
  drawWaves();
});

function drawWaves() {
  requestAnimationFrame(() => {
    canvas.width = parseInt(getComputedStyle(canvas).width.slice(0, -2)) * devicePixelRatio;
    canvas.height = parseInt(getComputedStyle(canvas).height.slice(0, -2)) * devicePixelRatio;

    var context = canvas.getContext('2d');
    var margin = 2;
    var max = Math.max(0, Math.round(canvas.width / 11));
    var offset = Math.max(0, stepRates.length - max);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#00796B';
    if (mode === 'bar') {
      for (var i = 0; i < Math.max(stepRates.length, max); i++) {
        var barHeight = Math.round(stepRates[i + offset ] * canvas.height / 200);
        context.rect(11 * i + margin, canvas.height - barHeight, margin, Math.max(0, barHeight - margin));
        context.stroke();
      }
    } else if (mode === 'line') {
      context.beginPath();
      context.lineWidth = 6;
      context.lineJoin = 'round';
      context.shadowBlur = '1';
      context.shadowColor = '#333';
      context.shadowOffsetY = '1';
      for (var i = 0; i < Math.max(stepRates.length, max); i++) {
        var lineHeight = Math.round(stepRates[i + offset ] * canvas.height / 200);
        if (i === 0) {
          context.moveTo(11 * i, canvas.height - lineHeight);
        } else {
          context.lineTo(11 * i, canvas.height - lineHeight);
        }
        context.stroke();
      }
    }
  });
}

window.onresize = drawWaves;

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    drawWaves();
  }
});
