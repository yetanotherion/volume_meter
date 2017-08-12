/* https://webaudio.github.io/web-audio-api/*/
/* https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Basic_concepts_behind_Web_Audio_API
   downmixed -> assuming the mic is stereo,
   output.M = 0.5 * (input.L + input.R) */
/* x[k] = down-mixed time domain (waveform) data
/* b[k] = 128 * (1 + x[k]) */
function backToTimeDomainData(value) {
    return value / 128 - 1;
}

/**
 * Compute the rms (root mean square) of all measured
   down-mixed time domain datas (see above).
 */
function getRmsVolume(analyser, array) {
    analyser.getByteTimeDomainData(array);
    const length = array.length;
    let total = 0;
    for (let i = 0; i < length; i++) {
        var value = backToTimeDomainData(array[i]);
        total += value * value;
    }
    return Math.sqrt(total / length);
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
        plottedWindowSize: 100,
        delay: [],
        formatData: function(x, y) {
            return [x,y];
        },
        manageDataWindow: function() {
            if (this.data.length > this.plottedWindowSize) {
                const toRemove = this.data.length - this.plottedWindowSize
                this.data = this.data.slice(toRemove, this.data.length);
            }
        },
        pushData: function() {
            var currTime = new Date().getTime();
            var prevIndex = this.data.length - 1;
            if (prevIndex > 0) {
                var delay = currTime - this.data[prevIndex][0]
                this.delay.push(this.formatData(currTime, delay));
            }
            this.manageDataWindow();
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
