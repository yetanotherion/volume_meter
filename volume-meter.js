/**
 * https://webaudio.github.io/web-audio-api/#widl-AnalyserNode-getByteFrequencyData-void-Uint8Array-array
 * getByte -> value between 0 and 255.
 * getFloat -> dB
 * getTime -> waveform
 * getFrequency -> after fft https://webaudio.github.io/web-audio-api/#current-frequency-data
 * https://stackoverflow.com/questions/24083349/understanding-getbytetimedomaindata-and-getbytefrequencydata-in-web-audio
 */

/**
 * Compute the rms (root mean square) of all measured samples
 * given in array. The unit of measured samples is a byte between 0-255, (
 * mapping to (-1, 1), -1 being minDb and +1 maxDb.
 */
var i = 0;
function getRmsVolume(analyser, array) {
    analyser.getByteTimeDomainData(array);
    const length = array.length;
    let total = 0;
    for (let i = 0; i < length; i++) {
        total += array[i] * array[i];
    }
    return Math.sqrt(total / length);
}

/**
 * Return an object with the getRmsVolume method.
 */
function createAudioMeter(audioContext, mediaStreamSource) {
    var analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    var array = new Uint8Array(analyser.frequencyBinCount);
    mediaStreamSource.connect(analyser);
    return {analyser: analyser,
            array: array,
            getRmsVolume: function () {
                return getRmsVolume(this.analyser, this.array);
            },
           };
}

/**
 * Creates an audioMeter and starts measuring samples.
 * Returns an object with a stop method.
 */
function start(audioContext, mediaStreamSource) {
    var meter = createAudioMeter(audioContext, mediaStreamSource);
    var meterRunner = {
        ended: false,
        meter: meter,
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
        var volume = meterRunner.meter.getRmsVolume();
        meterRunner.rafId = window.requestAnimationFrame(measureLoop);
    }
    measureLoop();
    return meterRunner;
}
