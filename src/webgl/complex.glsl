// complex.glsl - GLSL library for complex number operations

const float PI = 3.14159265359;
const float E = 2.71828182845;

// Basic Arithmetic
vec2 c_add(vec2 a, vec2 b) { return a + b; }
vec2 c_sub(vec2 a, vec2 b) { return a - b; }
vec2 c_mul(vec2 a, vec2 b) { return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x); }
vec2 c_inv(vec2 z) { float d = dot(z, z); return vec2(z.x, -z.y) / d; }
vec2 c_div(vec2 a, vec2 b) { return c_mul(a, c_inv(b)); }

// Exponentiation: c_pow(z, p) = z^p
vec2 c_pow(vec2 z, vec2 p) {
    float r = length(z);
    if (r == 0.0) return vec2(0.0);
    float theta = atan(z.y, z.x);
    float log_r = log(r);

    float new_mag = pow(r, p.x) * exp(-p.y * theta);
    float new_angle = p.x * theta + p.y * log_r;

    return new_mag * vec2(cos(new_angle), sin(new_angle));
}

// --- Transcendental Functions ---

// c_exp(z) = e^z = e^x * (cos(y) + i*sin(y))
vec2 c_exp(vec2 z) {
    return exp(z.x) * vec2(cos(z.y), sin(z.y));
}

// c_log(z) = ln(z) = ln|z| + i*arg(z)
vec2 c_log(vec2 z) {
    return vec2(log(length(z)), atan(z.y, z.x));
}

// c_sqrt(z) = z^(1/2)
vec2 c_sqrt(vec2 z) {
    return c_pow(z, vec2(0.5, 0.0));
}

// why are these two not built in?
// https://docs.gl/el3/cosh
float sinh(float x) {
    return (exp(x) - exp(-x)) / 2.0;
}
float cosh(float x) {
    return (exp(x) + exp(-x)) / 2.0;
}

// c_sin(z) = sin(x)cosh(y) + i*cos(x)sinh(y)
vec2 c_sin(vec2 z) {
    return vec2(sin(z.x) * cosh(z.y), cos(z.x) * sinh(z.y));
}

// c_cos(z) = cos(x)cosh(y) - i*sin(x)sinh(y)
vec2 c_cos(vec2 z) {
    return vec2(cos(z.x) * cosh(z.y), -sin(z.x) * sinh(z.y));
}

vec2 c_sinh(vec2 z) {
    return vec2(sinh(z.x) * cos(z.y), cosh(z.x) * sin(z.y));
}

vec2 c_cosh(vec2 z) {
    return vec2(cosh(z.x) * cos(z.y), sinh(z.x) * sin(z.y));
}

