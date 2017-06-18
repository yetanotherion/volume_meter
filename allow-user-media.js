function gotStream(stream) {
    alert('You can go back to using the extension');
}

window.onload = function() {
    loadUserMedia(gotStream);
}
