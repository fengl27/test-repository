const canvas = document.getElementById("gl-canvas");
const gl = canvas.getContext("webgl2");

canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
})
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);//tells webgl how to convert from clip space (-1 to +1) to pixel pixel screen space


var vaos = {};//idk ok??
var thingLocations = {
    image: {},
    rect: {}
};
var buffers = {};
var programs = {};
var transforms = [];
var images = new Map();
var imageTextures = new Map();
const rectModel = new Float32Array([//1x1 square
    0, 0, 1, 0, 0, 1,
    1, 0, 1, 1, 0, 1
]);
function initialize(gl) {
    //INIT :D
    if(!gl) {
        alert("you suck >:0");
        return;
    }

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    //SHADERS :D

    //you can get these strings with any string getting method
    
    //you're not allowed to have line breaks before #version 300 es :(
    

    

    //shader/program making
    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    programs.image = createProgram(gl, vertexShader, fragmentShader);

    //attribute stuff (in initialization of course)
    thingLocations.image.positionAttribLocation =   gl.getAttribLocation(programs.image, "a_position");//0

    thingLocations.image.texCoord =                 gl.getAttribLocation(programs.image, "a_texCoord");//1
    thingLocations.image.texScale =                 gl.getAttribLocation(programs.image, "a_texScale");//2
    thingLocations.image.depth =                    gl.getAttribLocation(programs.image, "a_depthCoord");//3
    thingLocations.image.translation =              gl.getAttribLocation(programs.image, "a_translation");//4
    thingLocations.image.scale =                    gl.getAttribLocation(programs.image, "a_scale");      //5
    thingLocations.image.opacity =                  gl.getAttribLocation(programs.image, "a_opacity");      //6

    thingLocations.image.resolutionUniformLocation =gl.getUniformLocation(programs.image, "u_resolution");
    thingLocations.image.imageLocation =            gl.getUniformLocation(programs.image, "u_image");

    buffers.positionBuffer = gl.createBuffer();// "Attributes get their data from buffers so we need to create a buffer"
    buffers.transformBuffer = gl.createBuffer();

    /*
    //set the position buffer :D
    var positions = [//it might be upside down
        10, 10,
        210, 310,
        410, 10,
        500, 10,
        800, 10,
        800, 310
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);//put it onto the position buffer using the bind point from earlier
    //STATIC_DRAW means webgl can do optimization by assuming we probably aren't going to change the position buffer much later
    */

    //vertex array object
    
    vaos.image = gl.createVertexArray();//make a vao
    gl.bindVertexArray(vaos.image);//start editing this vao apparently
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positionBuffer);
    gl.vertexAttribPointer(
        thingLocations.image.positionAttribLocation, //what attribute
        2,                      //what size
        gl.FLOAT,               //what type
        false,                  //should or shouldn't normalize
        0,                      //0 stride means move forwards size * sizeof(type) (basically make them do the math so i don't get confused)
        0                       //0 means start at beginning of buffer (0 offset)
    );
    gl.enableVertexAttribArray(thingLocations.image.positionAttribLocation);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.transformBuffer);
    //x, y, w, h, ix, iy, iw, ih, depth, o
    gl.vertexAttribPointer(
        thingLocations.image.translation, //what attribute
        2,                      //what size
        gl.FLOAT,               //what type
        false,                  //should or shouldn't normalize
        40,                      //0 stride means move forwards size * sizeof(type) (basically make them do the math so i don't get confused)
        0                       //0 means start at beginning of buffer (0 offset)
    );
    gl.vertexAttribPointer(
        thingLocations.image.scale, //what attribute
        2,                      //what size
        gl.FLOAT,               //what type
        false,                  //should or shouldn't normalize
        40,                      //0 stride means move forwards size * sizeof(type) (basically make them do the math so i don't get confused)
        8                       //0 means start at beginning of buffer (0 offset)
    );
    gl.vertexAttribPointer(
        thingLocations.image.texCoord, //what attribute
        2,                      //what size
        gl.FLOAT,               //what type
        false,                  //should or shouldn't normalize
        40,                      //0 stride means move forwards size * sizeof(type) (basically make them do the math so i don't get confused)
        16                       //0 means start at beginning of buffer (0 offset)
    );
    gl.vertexAttribPointer(
        thingLocations.image.texScale, //what attribute
        2,                      //what size
        gl.FLOAT,               //what type
        false,                  //should or shouldn't normalize
        40,                      //0 stride means move forwards size * sizeof(type) (basically make them do the math so i don't get confused)
        24                       //0 means start at beginning of buffer (0 offset)
    );
    gl.vertexAttribPointer(
        thingLocations.image.depth, //what attribute
        1,                      //what size
        gl.FLOAT,               //what type
        false,                  //should or shouldn't normalize
        40,                      //0 stride means move forwards size * sizeof(type) (basically make them do the math so i don't get confused)
        32                       //0 means start at beginning of buffer (0 offset)
    );
    gl.vertexAttribPointer(
        thingLocations.image.opacity, //what attribute
        1,                      //what size
        gl.FLOAT,               //what type
        false,                  //should or shouldn't normalize
        40,                      //0 stride means move forwards size * sizeof(type) (basically make them do the math so i don't get confused)
        36                       //0 means start at beginning of buffer (0 offset)
    );
    gl.enableVertexAttribArray(thingLocations.image.translation);//undisablenable
    gl.enableVertexAttribArray(thingLocations.image.scale);
    gl.enableVertexAttribArray(thingLocations.image.texCoord);
    gl.enableVertexAttribArray(thingLocations.image.texScale);
    gl.enableVertexAttribArray(thingLocations.image.depth);
    gl.enableVertexAttribArray(thingLocations.image.opacity);
    
    gl.vertexAttribDivisor(thingLocations.image.translation, 1);//let gl know this is instancing stuff stuff
    gl.vertexAttribDivisor(thingLocations.image.scale, 1);
    gl.vertexAttribDivisor(thingLocations.image.texCoord, 1);
    gl.vertexAttribDivisor(thingLocations.image.texScale, 1);
    gl.vertexAttribDivisor(thingLocations.image.depth, 1);
    gl.vertexAttribDivisor(thingLocations.image.opacity, 1);
    
    
    //stuff
    /*
    here i set the size to 2 because vec2
    (attribs default to 0, 0, 0, 1 if you don't give enough number)
    */

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);//tells webgl how to convert from clip space (-1 to +1) to pixel pixel screen space

    /*
    for(var i = 0; i < 50; i ++) {
        setRect(gl, Math.random() * gl.canvas.width, Math.random() * gl.canvas.height, 50, 50);

        //set uniforms
        gl.uniform4f(thingLocations.image.colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);
        gl.uniform2f(thingLocations.image.resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

        //stuff
        gl.bindVertexArray(vao);//bind the vao


        gl.drawArrays(gl.TRIANGLES, 0, 6);//primitive type, offset, count
        //count is 3 because you need 1 count per point
        //because we're drawing triangles as the primitive type every 3 points webgl will draw a triangle automatically

    }
    */
}
function initializeRect(gl) {
    const vertexShaderSource =`#version 300 es

    // an attribute is an input (in) to a vertex shader.
    // It will receive data from a buffer
    in vec2 a_position;
    in vec4 a_color;
    in vec2 a_translation;
    in vec2 a_scale;
    in float a_depth;
    out vec4 a_color_out;
    out float a_opacity_out;

    uniform vec2 u_resolution;//uniforms are constant across things
    
    // all shaders have a main function
    void main() {
        vec2 zeroToOne = (a_position * a_scale + a_translation) / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;
    
        // gl_Position is a special variable a vertex shader
        // is responsible for setting
        gl_Position = vec4(clipSpace * vec2(1,-1), a_depth, 1);
        a_color_out = a_color;
    }
    `;//from https://webgl2fundamentals.org/webgl/lessons/webgl-fundamentals.html

    const fragmentShaderSource = `#version 300 es
 
    // fragment shaders don't have a default precision so we need
    // to pick one. highp is a good default. It means "high precision"
    precision highp float;
    
    in vec4 a_color_out;
    in float a_opacity_out;

    // we need to declare an output for the fragment shader
    out vec4 outColor;
    
    void main() {
        // Just set the output to a_color
        outColor = a_color_out;
    }
    `;//also from https://webgl2fundamentals.org/webgl/lessons/webgl-fundamentals.html

    

    //shader/program making
    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    programs.rect = createProgram(gl, vertexShader, fragmentShader);

    //attribute stuff (in initialization of course)
    thingLocations.rect.position = gl.getAttribLocation(programs.rect, "a_position");
    thingLocations.rect.resolutionUniformLocation = gl.getUniformLocation(programs.rect, "u_resolution");
    thingLocations.rect.color = gl.getAttribLocation(programs.rect, "a_color");
    thingLocations.rect.translation = gl.getAttribLocation(programs.rect, "a_translation");
    thingLocations.rect.scale = gl.getAttribLocation(programs.rect, "a_scale");
    thingLocations.rect.depth = gl.getAttribLocation(programs.rect, "a_depth");

    //vertex array object
    vaos.rect = gl.createVertexArray();
    gl.bindVertexArray(vaos.rect);

    //do the vertex attribute pointering thing
    gl.enableVertexAttribArray(thingLocations.rect.position);//turn it on so webgl knows it's not just being constant right now
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positionBuffer);//bind things are like global variables for webgl, the bind point here is gl.ARRAY_BUFFER (i think)
    gl.vertexAttribPointer(
        thingLocations.rect.position, //what attribute
        2,                      //what size
        gl.FLOAT,               //what type
        false,                  //should or shouldn't normalize
        8,                      //0 stride means move forwards size * sizeof(type) (basically make them do the math so i don't get confused)
        0                       //0 means start at beginning of buffer (0 offset)
    );


    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.transformBuffer);

    gl.enableVertexAttribArray(thingLocations.rect.translation);//turn them on
    gl.enableVertexAttribArray(thingLocations.rect.scale);
    gl.enableVertexAttribArray(thingLocations.rect.color);
    gl.enableVertexAttribArray(thingLocations.rect.depth);
    
    gl.vertexAttribPointer(
        thingLocations.rect.translation,
        2,
        gl.FLOAT,
        false,
        32,
        0
    );
    gl.vertexAttribPointer(
        thingLocations.rect.scale,
        2,
        gl.FLOAT,
        false,
        32,
        8
    );
    gl.vertexAttribPointer(
        thingLocations.rect.color, //what attribute
        3,                      //what size
        gl.FLOAT,               //what type
        false,                  //should or shouldn't normalize
        32,                      //0 stride means move forwards size * sizeof(type) (basically make them do the math so i don't get confused)
        16                       //0 means start at beginning of buffer (0 offset)
    );
    gl.vertexAttribPointer(
        thingLocations.rect.depth, //what attribute
        1,                      //what size
        gl.FLOAT,               //what type
        false,                  //should or shouldn't normalize
        32,                      //0 stride means move forwards size * sizeof(type) (basically make them do the math so i don't get confused)
        28                       //0 means start at beginning of buffer (0 offset)
    );
    gl.vertexAttribDivisor(thingLocations.rect.translation, 1);//let gl know this is instancing stuff stuff
    gl.vertexAttribDivisor(thingLocations.rect.scale, 1);
    gl.vertexAttribDivisor(thingLocations.rect.color, 1);
    gl.vertexAttribDivisor(thingLocations.rect.depth, 1);
    /*
    here i set the size to 2 because vec2
    (attribs default to 0, 0, 0, 1 if you don't give enough number)
    one float is 4 bytes!!!!!
    */

    /*
    for(var i = 0; i < 50; i ++) {
        setRect(gl, Math.random() * gl.canvas.width, Math.random() * gl.canvas.height, 50, 50);

        //set uniforms
        gl.uniform4f(thingLocations.rect.colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);
        gl.uniform2f(thingLocations.rect.resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

        //stuff
        gl.bindVertexArray(vao);//bind the vao


        gl.drawArrays(gl.TRIANGLES, 0, 6);//primitive type, offset, count
        //count is 3 because you need 1 count per point
        //because we're drawing triangles as the primitive type every 3 points webgl will draw a triangle automatically

    }
    */
}
function background(gl, r, g, b) {
    gl.clearColor(r / 255, g / 255, b / 255, 1);//pretty background color
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);//the color buffer bit is just a bitshifted singular 1 that tells the gl.clear to clear the color buffer
}
function setRect(gl, x, y, w, h) {
    let x2 = x + w;
    let y2 = y + h;

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x, y, x2, y, x, y2,
        x2, y, x2, y2, x, y2
    ]), gl.STATIC_DRAW);
}


function drawRect(x, y, w, h, r, g, b, depth) {
    transforms.push(x, y, w, h, r/255, g/255, b/255, depth/100);
}
function drawAllRects(gl) { 
    gl.depthMask(true);
    if(!transforms.length) return;//no rects to draw
    gl.useProgram(programs.rect);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positionBuffer);//set the model :)
    gl.bufferData(gl.ARRAY_BUFFER, rectModel, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.transformBuffer);//set the transforms
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(transforms), gl.STATIC_DRAW);

    gl.bindVertexArray(vaos.rect);

    gl.uniform2f(thingLocations.rect.resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, transforms.length / 8);

    transforms = []; 
    gl.depthMask(false);
}

function drawImg(image, ix, iy, iw, ih, x, y, w, h, depth=0, opacity=0.5) {
    if(!image) return;

    //console.log(depth, image.name);
    depth = depth / 100;

    if(!images.has(image)) {
        images.set(image, []);
    }
    images.get(image).push(x, y, w, h, ix, iy, iw, ih, depth, opacity);
    /*
    if(!image) return;//make sure it's loaded
    if(isCool) {gl.depthMask(true);}

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texCoordBuffer);
    setRect(gl, ix, iy, iw, ih);

    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + 0);//the 0 is the texture #
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    //pain image loop stuff
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    //upload img into texture
    var mipLevel = 0;               // the largest mip
    var internalFormat = gl.RGBA;   // format we want in the texture
    var srcFormat = gl.RGBA;        // format of data we are supplying
    var srcType = gl.UNSIGNED_BYTE; // type of data we are supplying
    gl.texImage2D(gl.TEXTURE_2D,
        mipLevel,
        internalFormat,
        srcFormat,
        srcType,
        image);
    
    gl.useProgram(programs.image);
    
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positionBuffer);
    setRect(gl, x, y, w, h);

    gl.bindVertexArray(vaos.image);//bind the vao

    //set uniforms
    gl.uniform2f(thingLocations.image.resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(thingLocations.image.depthUniformLocation, depth);
    gl.uniform1i(thingLocations.image.imageLocation, 0);//the 0 is for texture unit 0 (the 0 from earlier)

    gl.drawArrays(gl.TRIANGLES, 0, 6);//primitive type, offset, count

    if(isCool) {gl.depthMask(false);}
    */
}
function getTexture(image, gl) {
    if(imageTextures.has(image)) {
        //let texture = imageTextures.get(image);
        gl.bindTexture(gl.TEXTURE_2D, imageTextures.get(image));
        //return texture;
    }
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    //pain image loop stuff
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    //upload img into texture
    var mipLevel = 0;               // the largest mip
    var internalFormat = gl.RGBA;   // format we want in the texture
    var srcFormat = gl.RGBA;        // format of data we are supplying
    var srcType = gl.UNSIGNED_BYTE; // type of data we are supplying
    gl.texImage2D(gl.TEXTURE_2D,
        mipLevel,
        internalFormat,
        srcFormat,
        srcType,
        image);
    imageTextures.set(image, texture);
    //return texture;
}
function drawAllImages(gl) {
    if(images.size === 0) return;

    gl.useProgram(programs.image);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positionBuffer);//set the model *yawn*
    gl.bufferData(gl.ARRAY_BUFFER, rectModel, gl.STATIC_DRAW);

    gl.bindVertexArray(vaos.image);
    
    //set uniforms
    gl.uniform2f(thingLocations.image.resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    
    gl.activeTexture(gl.TEXTURE0);//the 0 is the texture #
    for(var [image, transformData] of images) {
        //get the texture
        var texture = getTexture(image, gl);
        
        //set the transforms
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.transformBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(transformData), gl.DYNAMIC_DRAW);

        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, transformData.length / 10);//primitive type, offset, count
    }
    images.clear();
}
function createShader(gl, type, source) {
    const name = type === gl.VERTEX_SHADER? "vertex shader": "frag shader (not frag bomb)";
    console.log("i create shader " + name);//i really hope source is the string from earlier
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if(success) {
        //yippie :D
        console.log(name + " now exists successfully :D");
        return shader;
    }

    console.log("info ", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);//no memory leaks i hope
}
function createProgram(gl, vertShader, fragShader) {
    console.log("making a program with some vertex and fragment shaders");
    var program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);//wow
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if(success) {
        console.log("success successed program exists");
        return program;
    }

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);//no memory leaks i hope more
}


function main() {
    initialize(gl);
    initializeRect(gl);


    var image = new Image();
    image.src = "square.jpg";
    var image2 = new Image();
    image2.src = "sadbanana.jpeg";
    window.setTimeout(() => {
        console.log("I DRAW STUFF");
        if(!image) return;//make sure it's loaded
        /*
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texCoordBuffer);
        setRect(gl, ix, iy, iw, ih);
        */
        /*
        var texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + 0);//the 0 is the texture #
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        //pain image loop stuff
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        //upload img into texture
        var mipLevel = 0;               // the largest mip
        var internalFormat = gl.RGBA;   // format we want in the texture
        var srcFormat = gl.RGBA;        // format of data we are supplying
        var srcType = gl.UNSIGNED_BYTE; // type of data we are supplying
        gl.texImage2D(gl.TEXTURE_2D,
            mipLevel,
            internalFormat,
            srcFormat,
            srcType,
            image);
        */
        /*
        gl.activeTexture(gl.TEXTURE0);
        getTexture(image);

        gl.useProgram(programs.image);
        
        
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positionBuffer);//set the model *yawn*
        gl.bufferData(gl.ARRAY_BUFFER, rectModel, gl.STATIC_DRAW);

        //set the transforms
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.transformBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            //x, y, w, h, ix, iy, iw, ih, depth
            10, 10, 100, 100, 0, 0, 1, 1, 1
        ]), gl.STATIC_DRAW);

        gl.bindVertexArray(vaos.image);//bind the vao

        //set uniforms
        gl.uniform2f(thingLocations.image.resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
        gl.uniform1i(thingLocations.image.imageLocation, 0);//the 0 is for texture unit 0 (the 0 from earlier)

        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, 1);//primitive type, offset, count
        */
        drawRect(0, 0, 600, 400, 255, 255, 0, 1);
        drawImg(image, 0, 0, 1, 1, 10, 10, 100, 100, 0, 0.5);
        drawImg(image2, 0, 0, 1, 1, 120, 10, 100, 100, 0, 0.5);
        drawAllRects(gl);
        drawAllImages(gl);
        /*
        background(gl, 48, 48, 54);
        drawWeirdImage(gl, image, 0, -2, 2, 2, 10, 10, 300, 200, 0);
        drawImg(gl, image, 0, 0, 1, 1, 10, 400, 300, 300 * image.height/image.width, 0);
        drawRect(220, 10, 200, 200, 255, 255, 0, 0.5);
        drawRect(270, 60, 200, 200, 255, 0, 0, 1);

        drawAllRects();
        */
        /*
        console.log(image);

        console.log(thingLocations.image);
        
        gl.enableVertexAttribArray(thingLocations.image.positionAttribLocation);//turn it on so webgl knows it's not just being constant right now
        gl.enableVertexAttribArray(thingLocations.image.texCoordAttribLocation);//turn it on so webgl knows it's not just being constant right now

        //drawImg(gl, 10, 10, 300, 300, image);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0, 0, 1, 0, 0, 1,
            1, 0, 1, 1, 0, 1
        ]), gl.STATIC_DRAW);

        var texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + 0);//the 0 is the texture #
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        //pain image loop stuff
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        //upload img into texture
        var mipLevel = 0;               // the largest mip
        var internalFormat = gl.RGBA;   // format we want in the texture
        var srcFormat = gl.RGBA;        // format of data we are supplying
        var srcType = gl.UNSIGNED_BYTE; // type of data we are supplying
        gl.texImage2D(gl.TEXTURE_2D,
            mipLevel,
            internalFormat,
            srcFormat,
            srcType,
            image);
        
        gl.useProgram(programs.image);
        
        
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positionBuffer);
        setRect(gl, 0, 0, image.width, image.height);

        gl.bindVertexArray(vao);//bind the vao

        //set uniforms
        gl.uniform2f(thingLocations.image.resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
        gl.uniform1i(thingLocations.image.imageLocation, 0);//the 0 is for texture unit 0 (the 0 from earlier)




        gl.drawArrays(gl.TRIANGLES, 0, 6);//primitive type, offset, count
        */
    }, 500);
}

main();