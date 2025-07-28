export interface Domain {
  name: string;
  values: [number, number, number, number]; // [xmin, xmax, ymin, ymax]
}

/**
 * Encapsulates all WebGL rendering logic for a single canvas.
 */
export class WebGLRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly gl: WebGLRenderingContext;
  private program: WebGLProgram | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private readonly domain: Domain;
  
  private baseVertexShader: string = '';
  private baseFragmentShader: string = '';
  
  constructor(canvas: HTMLCanvasElement, displaySize: number = 400) {
    this.canvas = canvas;
    const context = this.canvas.getContext('webgl2');
    if (!context) {
      throw new Error('WebGL2 is not supported in this browser.');
    }
    this.gl = context;
    // console.log(this.gl.getParameter(this.gl.SHADING_LANGUAGE_VERSION));
    // --> GLSL ES 3.0
    
    // Determine domain based on canvas ID
    this.domain = canvas.id === 'finite-canvas'
      ? { name: 'Finite Domain', values: [-2, 2, -2, 2] }
      : { name: 'Infinity Neighborhood', values: [-0.125, 0.125, -0.125, 0.125] };
    
    this.setupCanvasForHighDPI(displaySize);
    this.createBuffers();
  }
  
  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
  
  public getDomain(): Domain {
    return this.domain;
  }
  
  private setupCanvasForHighDPI(desiredDisplaySize: number): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = desiredDisplaySize * dpr;
    this.canvas.height = desiredDisplaySize * dpr;
    this.canvas.style.width = `${desiredDisplaySize}px`;
    this.canvas.style.height = `${desiredDisplaySize}px`;
  }
  
  private createBuffers(): void {
    const gl = this.gl;
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  }
  
  public setShaders(vertexSrc: string, fragmentSrc: string): void {
    this.baseVertexShader = vertexSrc;
    this.baseFragmentShader = fragmentSrc;
  }
  
  public updateFunctionShader(glslFunc: string): void {
    const fragmentSrc = this.baseFragmentShader.replace(
      '#include <function>',
      glslFunc
    );
    this.program = this.createProgram(this.baseVertexShader, fragmentSrc);
  }
  
  public draw(isInfinityPlot: boolean = false): void {
    const { gl, program, positionBuffer } = this;
    if (!program || !positionBuffer) {
      console.error("Cannot draw: WebGL program or buffer not initialized.");
      return;
    }
    
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.useProgram(program);
    
    // Set up vertex position attribute
    const posLocation = gl.getAttribLocation(program, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(posLocation);
    gl.vertexAttribPointer(posLocation, 2, gl.FLOAT, false, 0, 0);
    
    // Set uniforms
    gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), gl.canvas.width, gl.canvas.height);
    gl.uniform4fv(gl.getUniformLocation(program, 'u_domain'), this.domain.values);
    gl.uniform1i(gl.getUniformLocation(program, 'u_is_infinity_plot'), isInfinityPlot ? 1 : 0);
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  
  private createProgram(vsSource: string, fsSource: string): WebGLProgram | null {
    const gl = this.gl;
    const vertexShader = this.compileShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return null;
    
    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    return program;
  }
  
  private compileShader(type: number, source: string): WebGLShader | null {
    const gl = this.gl;
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
}
