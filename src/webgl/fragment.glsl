// fragment.glsl
precision highp float;

// Uniforms provided by the Renderer
uniform vec2 u_resolution;
uniform vec4 u_domain; // (xmin, xmax, ymin, ymax)
uniform bool u_is_infinity_plot;

// These are custom syntax processed in renderer.ts
// Include the complex math library
#include <complex>
// Include the dynamically generated function from the parser
#include <function>

// HSL to RGB color space conversion
vec3 hsl2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
}

void main() {
    // Map pixel coordinates to the complex plane domain
    vec2 st = gl_FragCoord.xy / u_resolution;
    vec2 z_domain = vec2(
        u_domain.x + st.x * (u_domain.y - u_domain.x),
        u_domain.z + st.y * (u_domain.w - u_domain.z)
    );

    // For the infinity plot, the domain represents 1/z.
    // We must handle the pole at the origin and the circular boundary.
    if (u_is_infinity_plot) {
        // Discard fragments outside the circular domain for a clean look
        if (dot(z_domain, z_domain) > 0.125 * 0.125) {
            discard;
        }
        // Handle the pole at z_domain = 0 (which is z = infinity)
        if (z_domain.x == 0.0 && z_domain.y == 0.0) {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // f(infinity) -> white
            return;
        }
    }

    // If it's the infinity plot, we evaluate f(1/z_domain).
    // Otherwise, we evaluate f(z_domain).
    vec2 z = u_is_infinity_plot ? c_inv(z_domain) : z_domain;
    vec2 fz = F_Z(z);

    // --- Domain Coloring ---
    // Hue is determined by the argument (angle) of f(z)
    float hue = (atan(fz.y, fz.x) / (2.0 * PI)) + 0.5;


    //float lightness = log(dot(fz, fz)) / log(10.0) / 2.0;
    //lightness = clamp(lightness, 0.5, 1.0);
    float lightness = 0.5;

    float saturation = 0.9;

    vec3 rgb = hsl2rgb(vec3(hue, saturation, lightness));
    gl_FragColor = vec4(rgb, 1.0);
}
