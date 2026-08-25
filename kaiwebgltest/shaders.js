const shaders = {
    kaiVertexShader: `#version 300 es

in vec2 a_position;
in vec2 a_texCoord;

uniform vec2 u_resolution;

out vec2 v_texCoord;

void main() {
    vec2 zero_to_two = (a_position / u_resolution) * 2.0;
    vec2 clip_space = zero_to_two - 1.0;

    gl_Position = vec4(clip_space * vec2(1, -1), 0, 1);
    
    v_texCoord = a_texCoord;
}
`,
    convolve11x11FragmentShader: `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

uniform sampler2D u_image;
uniform float u_kernel[121];
uniform int u_kernel_x;
uniform int u_kernel_y;
uniform float u_thing;

in vec2 v_texCoord;


// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
    vec2 onePixel = vec2(1) / vec2(textureSize(u_image, 0));//get the uv thing for one pixel

    // 2. Define your convolution kernel matrix (e.g., Sharpen Filter)

    // 3. Sample neighbors and accumulate weighted results
    vec3 col = vec3(u_thing);
    
    int halfX = u_kernel_x / 2;///rounds down because c++
    int halfY = u_kernel_y / 2;

    int id = 0;
    for(int x = 0; x < u_kernel_x; x++) {
        for(int y = 0; y < u_kernel_y; y++) {
            vec2 offset = vec2(float(x - halfX), float(y - halfY)) * onePixel;
            vec3 imageColor = texture(u_image, v_texCoord + offset).rgb;
            col += imageColor * u_kernel[id];
            id ++;
        }
    }
    
    outColor = vec4(col, 1);
}
`,
    grayscaleFragmentShader: `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

uniform sampler2D u_image;

in vec2 v_texCoord;


// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
    vec3 imageColor = texture(u_image, v_texCoord).rgb;
    outColor = vec4(vec3(dot(imageColor, vec3( 0.2125, 0.7154, 0.0721 ))), 1);
}`,
    thresholdFragmentShader: `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

uniform sampler2D u_image;
uniform float u_thing;
uniform float u_phi;

in vec2 v_texCoord;


// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
    float imageColor = texture(u_image, v_texCoord).r;
    if(imageColor > u_thing) {
        outColor = vec4(1, 1, 1, 1);
    }
    else {
        outColor = vec4(
            vec3(1.0 + tanh(
                (imageColor - u_thing) * u_phi
            )),
            1
        );    
    }
}`,
    tintFragmentShader: `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

uniform sampler2D u_image;
uniform vec3 u_thing;

in vec2 v_texCoord;


// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
    float imageColor = dot(texture(u_image, v_texCoord).rgb, vec3( 0.2125, 0.7154, 0.0721 ));
    outColor = vec4(u_thing * imageColor, 1);
}`,
    structTensorFragmentShader: `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

uniform sampler2D u_image;

in vec2 v_texCoord;


// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
    vec2 imageColor = texture(u_image, v_texCoord).rg - 0.5;
    float E = imageColor.x * imageColor.x;
    float F = imageColor.x * imageColor.y;
    float G = imageColor.y * imageColor.y;
    outColor = vec4(E/2.0+0.5, F/2.0+0.5, G/2.0+0.5, 1);
}`,
    eigenvectorFragmentShader: `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

uniform sampler2D u_image;

in vec2 v_texCoord;


// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
    vec3 imageColor = (texture(u_image, v_texCoord).rgb - 0.5) * 2.0;
    /*
    float E = imageColor.x;
    float F = imageColor.y;
    float G = imageColor.z;
    */
    float trace = imageColor.x + imageColor.z;//E + G
    float det = (imageColor.x * imageColor.z) - (imageColor.y * imageColor.y);//E * G - F * F
    float discriminant = sqrt(trace * trace - 4.0 * det);
    float eigenvalue = (trace + discriminant) / 2.0;
    outColor = vec4(0.5 + (eigenvalue - imageColor.x)/2.0, 0.5+imageColor.y/2.0, 0, 1);
}`,
    perpendicularEigenBlur: `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

uniform sampler2D u_image;
uniform sampler2D u_image_2;
uniform int u_thing;
uniform float u_kernel[31];

in vec2 v_texCoord;


// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
    vec2 onePixel = vec2(1) / vec2(textureSize(u_image, 0));//get the uv thing for one pixel
    vec3 color = vec3(0.0);
    vec2 eigenvect = texture(u_image_2, v_texCoord).rg - 0.5;
    vec2 perpVect = vec2(eigenvect.x, eigenvect.y) * onePixel * 2.0;
    vec2 pos = v_texCoord - float(u_thing) * perpVect;
    for(int i = -u_thing; i <= u_thing; i ++) {
        color += texture(u_image, pos).rgb * u_kernel[i + u_thing];
        pos += perpVect;
    }
    outColor = vec4(color, 1);
}
`,
    parallelEigenBlur: `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

uniform sampler2D u_image;
uniform sampler2D u_image_2;
uniform float u_thing;
uniform float u_kernel[50];

in vec2 v_texCoord;


// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
    vec2 onePixel = vec2(2) / vec2(textureSize(u_image, 0));//get the uv thing for one pixel
    vec3 color = vec3(0.0);
    vec2 pos = v_texCoord;
    int limit = 250;
    float num = 0.0;

    vec2 bounds = u_thing * onePixel;

    while(abs(pos.x - v_texCoord.x) < bounds.x && abs(pos.y - v_texCoord.y) < bounds.y && limit > 0) {
        vec2 eigenvect = texture(u_image_2, pos).rg - 0.5;
        ivec2 relativePos = ivec2(pos - v_texCoord);
        float gauss = u_kernel[relativePos.x + relativePos.y * 11];
        color += texture(u_image, pos).rgb * gauss;
        pos += eigenvect * onePixel;
        num += gauss;
        limit --;
    }
    limit = 250;
    pos = v_texCoord;
    while(abs(pos.x - v_texCoord.x) < bounds.x && abs(pos.y - v_texCoord.y) < bounds.y && limit > 0) {
        vec2 eigenvect = texture(u_image_2, pos).rg - 0.5;
        pos -= eigenvect * onePixel;
        ivec2 relativePos = ivec2(pos - v_texCoord);
        float gauss = u_kernel[abs(relativePos.x) + abs(relativePos.y)];
        color += texture(u_image, pos).rgb * gauss;
        num += gauss;
        limit --;
    }
    //outColor = vec4(v_texCoord.x, pos.x, 0, 1);
    //outColor = vec4(mod(pos * 10.0, 1.0), 0, 1);
    outColor = vec4(color / num, 1);
}
`,
    subtractFragmentShader: `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

uniform sampler2D u_image;
uniform sampler2D u_image_2;
uniform float u_thing;

in vec2 v_texCoord;


// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
    vec3 c1 = texture(u_image,   v_texCoord).rgb;
    vec3 c2 = texture(u_image_2, v_texCoord).rgb;
    outColor = vec4((c1 * (1.0 + u_thing) - c2 * u_thing), 1);
}
`
};