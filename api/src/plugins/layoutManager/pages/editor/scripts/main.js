// Get the token from the URL parameters
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

let layoutEditor;

window.onload = () => {
    layoutEditor = new LayoutEditor(document.querySelector('#sidebar'), document.querySelector('#viewport'));
    layoutEditor.setLayoutDimensions(24, 12);
}