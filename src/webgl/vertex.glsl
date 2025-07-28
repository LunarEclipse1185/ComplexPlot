// vertex.glsl
attribute vec4 a_position;

void main() {
    // Pass the vertex position directly to the output.
    gl_Position = a_position;
}
