var joystick = new JoyStick("joystick-container");

window.setInterval(function() {
    var x = joystick.GetX();
    var y = joystick.GetY();
    keys[37] = x < -50;//l
    keys[39] = x > 50;//r
    keys[38] = y > 50;//u (apparently positive is up)
    keys[40] = y < -50;//d
}, 1000 / 60);