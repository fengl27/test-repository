var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
var width = canvas.width;
var height = canvas.height;
function rect(x, y, w, h) {
    ctx.fillRect(x, y, w, h);
}
function fill(r, g, b) {
    ctx.fillStyle = "rgb(" + [r,g,b].join(",") + ")";
}
function background(r, g, b) {
    var currFill = ctx.fillStyle;
    fill(r, g, b);
    rect(0, 0, width, height);
    ctx.fillStyle = currFill;
}