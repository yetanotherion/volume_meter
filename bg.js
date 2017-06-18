var meterRunner = null;

/* Mostly taken from https://github.com/cwilso/volume-meter */
window.onload = function() {
    loadUserMedia(gotStream);
}

function gotStream(stream) {
    // Create a new volume meter and connect it.
    mediaStreamSource = audioContext.createMediaStreamSource(stream);
    meterRunner = start(audioContext, mediaStreamSource);
}
