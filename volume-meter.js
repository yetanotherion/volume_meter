/**
 * https://webaudio.github.io/web-audio-api/#widl-AnalyserNode-getByteFrequencyData-void-Uint8Array-array
 * getByte: value between 0 and 255.
 * getFloat: dB
 * getTime: waveform
 * getFrequency: after fft https://webaudio.github.io/web-audio-api/#current-frequency-data
 * https://stackoverflow.com/questions/24083349/understanding-getbytetimedomaindata-and-getbytefrequencydata-in-web-audio
 */

/**
 * Compute the rms (root mean square) of all measured samples
 * given in array. The unit of measured samples in dB units.
 */
function getRmsVolume(analyser, array) {
    analyser.getFloatTimeDomainData(array);
    const length = array.length;
    let total = 0;
    for (let i = 0; i < length; i++) {
        total += array[i] * array[i];
    }
    return Math.sqrt(total / length);
}

/**
 * Returns an object with the getRmsVolume method.
 */
function createAudioMeter(audioContext, mediaStreamSource) {
    var analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    var array = new Float32Array(analyser.frequencyBinCount);
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
    var meterRunner = {
        ended: false,
        meter: meter,
        i: -1,
        plotEvery: 25,
        data: [],
        pushData: function() {
            this.data.push({date: new Date().getTime(),
                            volume: this.meter.getRmsVolume()});
        },
        measureAndPlotIfNeeded: function() {
            this.pushData();
            this.i += 1;
            if (this.i % this.plotEvery == 0) {
                plotData(this.data);
                this.i = 0;
            }
        },
        stop: function () {
            this.ended = true;
            if (this.rafId != null) {
                window.cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
        },
        rafId: null
    };

    function measureLoop() {
        if (meterRunner.ended) return;
        meterRunner.measureAndPlotIfNeeded();
        meterRunner.rafId = window.requestAnimationFrame(measureLoop);
    }
    measureLoop();
    return meterRunner;
}
