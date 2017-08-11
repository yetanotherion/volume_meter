/**
 * https://webaudio.github.io/web-audio-api/#widl-AnalyserNode-getByteFrequencyData-void-Uint8Array-array
 * getByte: value between 0 and 255.
 * getFloat: dB
 * getTime: waveform
 * getFrequency: after fft https://webaudio.github.io/web-audio-api/#current-frequency-data
 * https://stackoverflow.com/questions/24083349/understanding-getbytetimedomaindata-and-getbytefrequencydata-in-web-audio
 */


function smoothVolume(value) {
    return value / 255;
}

/**
 * Compute the rms (root mean square) of all measured samples
 * given in array. The unit of measured samples in dB units.
 */
function getRmsVolume(analyser, array) {
    analyser.getByteTimeDomainData(array);
    const length = array.length;
    let total = 0;
    for (let i = 0; i < length; i++) {
        total += array[i] * array[i];
    }
    return smoothVolume(Math.sqrt(total / length));
}


/**
 * Returns an object with the getRmsVolume method.
 */
function createAudioMeter(audioContext, mediaStreamSource) {
    var analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    var array = new Uint8Array(analyser.fftSize);
    mediaStreamSource.connect(analyser);
    return {analyser: analyser,
            array: array,
            getRmsVolume: function () {
                return getRmsVolume(this.analyser, this.array);
            },
           };
}

/**
 * Creates an audioMeter and starts measuring and displaying
 * measured volume samples.
 * The measuring and displaying can be stopped by calling stop() on the returned
 * object.
 */
function start(audioContext, mediaStreamSource) {
    var meter = createAudioMeter(audioContext, mediaStreamSource);
    var callEveryMs = 100;
    var meterRunner = {
        ended: false,
        meter: meter,
        i: -1,
        plotEvery: 10,
        data: [],
        delay: [],
        formatData: function(x, y) {
            return [x,y];
        },
        pushData: function() {
            var currTime = new Date().getTime();
            var prevIndex = this.data.length - 1;
            if (prevIndex > 0) {
                var delay = currTime - this.data[prevIndex][0]
                this.delay.push(this.formatData(currTime, delay));
            }
            this.data.push(this.formatData(currTime,
                                           this.meter.getRmsVolume()));
        },
        measureAndPlotIfNeeded: function() {
            this.pushData();
            this.i += 1;
            if (this.i % this.plotEvery == 0) {
                var views = chrome.extension.getViews({type: "popup"});
                for (var i = 0; i < views.length; i++) {
                    var view = views[i];
                    if (view.plotData) {
                        view.plotData(this.data, {"title": "volume",
                                                  "yAxisTitle": ""},
                                      "volume");
                        view.plotData(this.delay, {"title": "delay",
                                                   "yAxisTitle": "ms"},
                                      "delay");
                    }
                }
                this.i = 0;
            }
        },
        stop: function () {
            this.ended = true;
            if (this.refreshIntervalId != null) {
                clearInterval(this.refreshIntervalId);
                this.refreshIntervalId = null;
            }
        },
        refreshIntervalId: null,
    };
    this.refreshIntervalId = setInterval(function () {
        meterRunner.measureAndPlotIfNeeded();
    }, callEveryMs);
    return meterRunner;
}
