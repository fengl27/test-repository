const sliderContainer = document.getElementById("slider-container");

const canvas = document.getElementById("gl-canvas");
const gl = canvas.getContext("webgl2");

canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);

    main();
})
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);//tells webgl how to convert from clip space (-1 to +1) to pixel pixel screen space


var vaos = {};//idk ok??
var locations = {
    /*
    image: {},
    rect: {},
    goofy: {},
    convolve: {},
    grayscale: {},
    threshold: {},
    */
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
function setRect(gl, x, y, w, h) {
    let x2 = x + w;
    let y2 = y + h;

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x, y, x2, y, x, y2,
        x2, y, x2, y2, x, y2
    ]), gl.STATIC_DRAW);
}
function getTexture(image, gl, isDepressing) {
    if(imageTextures.has(image) && !isDepressing) {
        //let texture = imageTextures.get(image);
        gl.bindTexture(gl.TEXTURE_2D, imageTextures.get(image));
        return texture;
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
    return texture;
}



function setup(gl, vertShader, fragShader, locations, programs, buffers, thingName) {
    if(!locations[thingName]) {
        locations[thingName] = {};
    }
    var location = locations[thingName];
    /*
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    */
    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertShader);
    var fragShader = createShader(gl, gl.FRAGMENT_SHADER, fragShader);
    programs[thingName] = createProgram(gl, vertexShader, fragShader);

    //get attrib locations
    location.position = gl.getAttribLocation(programs[thingName], "a_position");
    location.texCoord = gl.getAttribLocation(programs[thingName], "a_texCoord");

    location.resolution = gl.getUniformLocation(programs[thingName], "u_resolution");
    location.kernel =     gl.getUniformLocation(programs[thingName], "u_kernel");
    location.col     =    gl.getUniformLocation(programs[thingName], "u_col");

    location.kernelX = gl.getUniformLocation(programs[thingName], "u_kernel_x");
    location.kernelY = gl.getUniformLocation(programs[thingName], "u_kernel_y");
    
    location.thing = gl.getUniformLocation(programs[thingName], "u_thing");
    location.phi = gl.getUniformLocation(programs[thingName], "u_phi");

    location.imageLocation = gl.getUniformLocation(programs[thingName], "u_image");
    location.image2Location = gl.getUniformLocation(programs[thingName], "u_image_2");

    if(!buffers.positionBuffer) {
        buffers.positionBuffer = gl.createBuffer();//make buffer
        buffers.texCoordBuffer = gl.createBuffer();//make buffer
    }

    //SET THE VAO
    vaos[thingName] = gl.createVertexArray();
    gl.bindVertexArray(vaos[thingName]);


    gl.enableVertexAttribArray(location.position);
    gl.enableVertexAttribArray(location.texCoord);

    //attrib, size, type, shouldNormalize, stride (move amt), start (offset)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positionBuffer);//bind buffer
    gl.vertexAttribPointer(location.position, 2, gl.FLOAT, false, 0, 0);

    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texCoordBuffer);//bind buffer
    gl.vertexAttribPointer(location.texCoord, 2, gl.FLOAT, false, 0, 0);

    //REMEMBER ONE FLOAT IS 4 BYTES

    //i call this like a million times
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);//tells webgl how to convert from clip space (-1 to +1) to pixel pixel screen space
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Ensure properties are configured before setting .src
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error(`Failed to load image at ${src}`));
    
    img.src = src; 
  });
};

function drawImage(image, x, y, w, h, thing, params) {
    gl.useProgram(programs[thing]);
    gl.bindVertexArray(vaos[thing]);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positionBuffer);//set the model *yawn*
    setRect(gl, x, y, w, h);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texCoordBuffer);
    setRect(gl, 0, 0, 1, 1);

    gl.uniform2f(locations[thing].resolution, gl.canvas.width, gl.canvas.height);

    if(params.kernelX) {
        gl.uniform1i(locations[thing].kernelX, params.kernelX);
        gl.uniform1i(locations[thing].kernelY, params.kernelY);
        params.kernel = padEnd(params.kernel, 121, 0);
    }
    if(params.kernel) gl.uniform1fv(locations[thing].kernel, params.kernel);
    if(params.thing !== undefined) {
        if(typeof params.thing === "number") {
            if(params.thingType === "int") {
                gl.uniform1i(locations[thing].thing, params.thing);
            }
            else {
                gl.uniform1f(locations[thing].thing, params.thing);
            }
        }
        else {
            gl["uniform" + params.thing.length + "f"](locations[thing].thing, ...params.thing);
        }
    };
    if(params.phi)   gl.uniform1f(locations[thing].phi  , params.phi);
    //set uniforms
    
    if(params.r) {
        gl.uniform3f(locations[thing].col, params.r, params.g, params.b);
    }
    //gl.activeTexture(gl.TEXTURE0);//the 0 is the texture #

    var texture1 = getTexture(image, gl, true);
    gl.uniform1i(locations[thing].imageLocation, 0);
      // Set each texture unit to use a particular texture.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    if(params.image2) {
        gl.activeTexture(gl.TEXTURE1);//the 0 is the texture #

        var texture2 = getTexture(params.image2, gl, true);
        gl.uniform1i(locations[thing].image2Location, 1);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texture2);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 6);//primitive type, offset, count
}
function background(gl, r, g, b) {
    gl.clearColor(r / 255, g / 255, b / 255, 1);//pretty background color
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);//the color buffer bit is just a bitshifted singular 1 that tells the gl.clear to clear the color buffer
}
function padEnd(array, minLength, fillValue = undefined) {
    return Object.assign(new Array(minLength).fill(fillValue), array);
}
function generateGaussian(size, arraySize) {
    if(!arraySize) {
        arraySize = size;
    }
    let std = (size - 1) * 0.4;
    //let std = (size - 1) / 6;
    let denominator = 2 * std * std;
    let halfSize = (arraySize - 1) / 2;
    let halfRealSize = (size - 1) / 2;
    let output = [];
    let sum = 0;
    for(var y = 0; y < arraySize; y ++) {
        let dstY = Math.abs(y - halfSize);
        for(var x = 0; x < arraySize; x ++) {
            let dstX = Math.abs(x - halfSize);
            if(dstX > halfRealSize || dstY > halfRealSize) output.push(0);
            else {
                let value = Math.exp(-(dstX * dstX + dstY * dstY) / denominator);
                output.push(value);
                sum += value;
            }
        }
    }
    for(var i = 0; i < output.length; i ++) {
        output[i] /= sum;//normalize to 1
    }
    return output;
};
function generate1DGaussian(size, arraySize, isOffsetted) {
    if(!arraySize) {
        arraySize = size;
    }
    let std = (size - 1) * 0.4 * (isOffsetted? 1.5: 1);
    //let std = (size - 1) / 6;
    let denominator = 2 * std * std;
    let halfSize = (arraySize - 1) / 2;
    let halfRealSize = (size - 1) / 2;
    let output = [];
    let sum = 0;
    for(var x = 0; x < arraySize; x ++) {
        let dstX = isOffsetted? x: Math.abs(x - halfSize);
        if(dstX > halfRealSize && !isOffsetted) output.push(0);
        else {
            let value = Math.exp(-dstX * dstX / denominator);
            output.push(value);
            sum += value;
        }
    }
    for(var i = 0; i < output.length; i ++) {
        output[i] /= sum;//normalize to 1
    }
    return output;
};
function arrayThing(arr1, arr2, func) {
    let out = [];
    for(var i = 0; i < arr1.length; i ++) {
        out.push(func(arr1[i], arr2[i]));
    }
    return out;
}
function generateSlider(name, value, min, max, step=0.005, inputName) {
    let idName = name.toLowerCase() + "-slider";
    let label1 = document.createElement("label");
    label1.for = idName;
    let label2 = document.createElement("label");
    label2.for = idName;
    let slider = document.createElement("input");
    slider.type = "range";
    slider.value = value;
    slider.min = min; slider.max = max;
    slider.step = step;
    slider.inputName = inputName;
    slider.oninput = (e) => {
        label2.textContent = e.target.value;
        inputs[e.target.inputName] = parseFloat(e.target.value);
    }
    slider.onchange = (e) => {
        main();
    }
    label1.textContent = name + ": ";
    label2.textContent = value;

    let gooberDiv = document.createElement("div");
    gooberDiv.appendChild(label2);
    gooberDiv.appendChild(slider);
    gooberDiv.style.float = "right";
    let sliderDiv = document.createElement("div");

    sliderDiv.appendChild(label1);
    sliderDiv.appendChild(gooberDiv);

    sliderContainer.appendChild(sliderDiv);
}
var inputs = {
    tao:            ["sharpness",           0.95,   0,  15,  0.005],
    gaussian1size:  ["blur 1 size",         5,      2,  15, 1],
    gaussian2size:  ["blur 2 size",         11,     2,  15, 1],
    threshold:      ["threshold",           0.3,    0,  1,  0.0025],
    phi:            ["threshold leniency",  350,    1,  800,5],
    sigmaC:         ["struct tensor blur size",5,   3,  11, 2],
    sigmaM:         ["parallel eigen blur size",5,  3,  25, 1],
    sigmaA:         ["antialiasing blur size",3,    3,  20, 1],
};
var assetNames = ["tree.png", "sadbanana.jpeg", "square.jpg", "sadburger.jpg", "logan.jpg", "white_noise.jpg"];
var assets = {};
function drawCanvasOntoTempCanvas(canvas) {
    let tempCanvas = document.createElement("canvas");
    let tempCtx = tempCanvas.getContext("2d");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
    return tempCanvas;
}
function getEigenvector(image) {
    var thing = drawCanvasOntoTempCanvas(canvas);
    var sobelX = [//sobel filter
        -1, 0, 1,
        -2, 0, 2,
        -1, 0, 1
    ];
    
    var sobelY = [//why does this work :(
         1,  2,  1,
         0,  0,  0,
        -1, -2, -1
    ];
    
    //var sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    drawImage(image, 0, 0, image.width, image.height, "convolve", {kernel: sobelX, kernelX: 3, kernelY: 3, thing: 0.5});
    
    var copy = drawCanvasOntoTempCanvas(canvas);
    drawImage(image, 0, 0, image.width, image.height, "convolve", {kernel: sobelY, kernelX: 3, kernelY: 3, thing: 0.5});
    drawImage(canvas, 0, 0, image.width, image.height, "tint", {thing: [1, 0, 0]});
    
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    drawImage(copy, 0, 0, image.width, image.height, "tint", {thing: [0, 1, 0]});
    gl.disable(gl.BLEND);
    
    drawImage(canvas, 0, 0, image.width, image.height, "structTensor", {});
    drawImage(canvas, 0, 0, image.width, image.height, "convolve", {thing: 0, kernel: generateGaussian(inputs.sigmaC), kernelX: inputs.sigmaC, kernelY: inputs.sigmaC});
    drawImage(canvas, 0, 0, image.width, image.height, "eigenvector", {});
    
    eigenvectors = drawCanvasOntoTempCanvas(canvas);
    return [eigenvectors, thing];
}
async function main() {
    if(assetNames.length) {
        for(var i = 0; i < assetNames.length; i ++) {
            assets[assetNames[i]] = await loadImage("assets/" + assetNames[i]);
        }
        assetNames = [];
        for(var i in inputs) {
            let value = inputs[i][1];
            generateSlider(...inputs[i], i);
            inputs[i] = value;
        }
    }
    var image = assets["logan.jpg"];
    let imageHeight = canvas.height - 20;
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.style.aspectRatio = image.width/image.height;
    gl.viewport(0, 0, image.width, image.height);
    /*
    var sobelX = [//sobel filter
        -1, 0, 1,
        -2, 0, 2,
        -1, 0, 1
    ];
    var sobelY = [//why does this work :(
         1,  2,  1,
         0,  0,  0,
        -1, -2, -1
    ];
    drawImage(image, 0, 0, image.width, image.height, "convolve", {kernel: sobelX, kernelX: 3, kernelY: 3, thing: 0.5});
    
    var copy = drawCanvasOntoTempCanvas(canvas);
    drawImage(image, 0, 0, image.width, image.height, "convolve", {kernel: sobelY, kernelX: 3, kernelY: 3, thing: 0.5});
    drawImage(canvas, 0, 0, image.width, image.height, "tint", {thing: [1, 0, 0]});
    
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    drawImage(copy, 0, 0, image.width, image.height, "tint", {thing: [0, 1, 0]});
    gl.disable(gl.BLEND);
    
    drawImage(canvas, 0, 0, image.width, image.height, "structTensor", {});
    drawImage(canvas, 0, 0, image.width, image.height, "convolve", {thing: 0, kernel: generateGaussian(inputs.sigmaC), kernelX: inputs.sigmaC, kernelY: inputs.sigmaC});
    drawImage(canvas, 0, 0, image.width, image.height, "eigenvector", {});
    
    eigenvectors = drawCanvasOntoTempCanvas(canvas);
    */
    var eigenvectors = getEigenvector(image)[0];
    
    drawImage(image, 0, 0, image.width, image.height, "perpEigenBlur", {image2: eigenvectors, thing: inputs.gaussian1size, thingType: "int", kernel: generate1DGaussian(inputs.gaussian1size*2+1)});
    
    blur1 = drawCanvasOntoTempCanvas(canvas);
    drawImage(image, 0, 0, image.width, image.height, "perpEigenBlur", {image2: eigenvectors, thing: inputs.gaussian2size, thingType: "int", kernel: generate1DGaussian(inputs.gaussian2size*2+1)});
    drawImage(blur1, 0, 0, image.width, image.height, "subtract", {image2: canvas, thing: inputs.tao});
    drawImage(canvas, 0, 0, image.width, image.height, "parallelEigenBlur", {image2: eigenvectors, thing: inputs.sigmaM, kernel: generate1DGaussian(inputs.sigmaM, false, true)});
    
    drawImage(canvas, 0, 0, image.width, image.height, "grayscale", {});
    drawImage(canvas, 0, 0, image.width, image.height, "threshold", {thing: inputs.threshold, phi: inputs.phi});

    var [eigenvectors, thing] = getEigenvector(canvas);
    drawImage(eigenvectors, 0, 0, image.width, image.height, "grayscale", {});
    drawImage(thing, 0, 0, image.width, image.height, "parallelEigenBlur", {image2: eigenvectors, thing: inputs.sigmaA, kernel: generate1DGaussian(inputs.sigmaA, false, true)});
    //drawImage(canvas, 0, 0, image.width, image.height, "grayscale", {});
    
    
    /*
    var kernel = arrayThing(generateGaussian(inputs.gaussian1size, 11), generateGaussian(inputs.gaussian2size, 11), (i, j) => {
        return ((1 + inputs.tao) * i - j * inputs.tao) * inputs.scalar;
    });

    drawImage(image, 0, 0, image.width, image.height, "convolve", {kernel: kernel, kernelX: 11, kernelY: 11, thing: 0});
    drawImage(canvas, 0, 0, image.width, image.height, "grayscale", {});
    drawImage(canvas, 0, 0, image.width, image.height, "threshold", {thing: inputs.threshold, phi: inputs.phi});
    */
    
    /*
    var copy = drawCanvasOntoTempCanvas(canvas);
    
    background(gl, 48, 48, 48);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    
    drawImage(sobelX, copy, 0, 0, image.width, image.height, 1, 0, 0, "goofy");
    drawImage(sobelY, copy, 0, 0, image.width, image.height, 0, 1, 0, "goofy");
    */
    /*
    kernel = [
        -1,-2,-1,
         0, 0, 0,
         1, 2, 1
    ];
    drawImage(kernel, image, 10, 10, imageHeight * image.width / image.height, imageHeight, 1, 0, 0);
    */
}

setup(gl, shaders.kaiVertexShader, shaders.convolve11x11FragmentShader, locations, programs, buffers, "convolve");
setup(gl, shaders.kaiVertexShader, shaders.grayscaleFragmentShader,     locations, programs, buffers, "grayscale");
setup(gl, shaders.kaiVertexShader, shaders.tintFragmentShader,          locations, programs, buffers, "tint");
setup(gl, shaders.kaiVertexShader, shaders.thresholdFragmentShader,     locations, programs, buffers, "threshold");
setup(gl, shaders.kaiVertexShader, shaders.eigenvectorFragmentShader,   locations, programs, buffers, "eigenvector");
setup(gl, shaders.kaiVertexShader, shaders.structTensorFragmentShader,  locations, programs, buffers, "structTensor");
setup(gl, shaders.kaiVertexShader, shaders.perpendicularEigenBlur,      locations, programs, buffers, "perpEigenBlur");
setup(gl, shaders.kaiVertexShader, shaders.parallelEigenBlur,      locations, programs, buffers, "parallelEigenBlur");
setup(gl, shaders.kaiVertexShader, shaders.subtractFragmentShader,      locations, programs, buffers, "subtract");
main();