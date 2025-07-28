import { UIManager } from './uiManager.ts';
import { WebGLRenderer } from './webgl/renderer';
import { Expression } from './math/parser/expression';
import { Complex } from './math/complex';

// Import shader source code using Vite's raw import syntax
import vertexShaderSource from './webgl/vertex.glsl?raw';
import fragmentShaderSource from './webgl/fragment.glsl?raw';
import complexShaderLibrary from './webgl/complex.glsl?raw';

/**
 * Main orchestrator for the Complex Function Visualizer application.
 * This class connects the UI, parsing logic, and WebGL rendering.
 */
export class App {
  private uiManager: UIManager;
  private finiteRenderer: WebGLRenderer;
  private infinityRenderer: WebGLRenderer;
  private expression: Expression;
  
  private debounceTimeout: number | undefined;
  
  constructor() {
    this.uiManager = new UIManager();
    
    this.finiteRenderer = this.createRenderer(this.uiManager.elements.finiteCanvas);
    this.infinityRenderer = this.createRenderer(this.uiManager.elements.infinityCanvas);
    
    // The Expression class now manages parsing, validation, and code generation
    this.expression = new Expression();
    
    this.addEventListeners();
    this.uiManager.drawLegends();
    
    this.uiManager.updateAxisMarkers(this.finiteRenderer.getDomain());
    this.uiManager.updateAxisMarkers(this.infinityRenderer.getDomain());
    
    // Perform the initial drawing with the default function "z"
    this.updateAndRedraw();
  }
  
  /**
   * Creates and configures a WebGLRenderer instance for a given canvas.
   * @param canvas The HTMLCanvasElement to render to.
   * @returns A configured WebGLRenderer instance.
   */
  private createRenderer(canvas: HTMLCanvasElement): WebGLRenderer {
    const renderer = new WebGLRenderer(canvas);
    const fullFragmentShader = fragmentShaderSource.replace(
      '#include <complex>',
      complexShaderLibrary
    );
    renderer.setShaders(vertexShaderSource, fullFragmentShader);
    return renderer;
  }
  
  /**
   * Sets up all necessary event listeners for user interaction.
   */
  private addEventListeners(): void {
    // Listen for input on the function text field
    this.uiManager.elements.funcInput.addEventListener('input', () => {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = setTimeout(() => this.updateAndRedraw(), 150);
    });
    
    // Setup interactions for the finite plot
    this.uiManager.setupCanvasInteraction(
      this.finiteRenderer,
      (z, isInfinityPlot) => this.getFunctionValueAt(z, isInfinityPlot),
      (panDelta) => this.handlePan(this.finiteRenderer, panDelta),
      (zoomData) => this.handleZoom(this.finiteRenderer, zoomData)
    );
    
    // Setup interactions for the infinity plot
    this.uiManager.setupCanvasInteraction(
      this.infinityRenderer,
      (z, isInfinityPlot) => this.getFunctionValueAt(z, isInfinityPlot),
      (panDelta) => this.handlePan(this.infinityRenderer, panDelta),
      (zoomData) => this.handleZoom(this.infinityRenderer, zoomData)
    );
  }
  
  private handlePan(renderer: WebGLRenderer, panDelta: { dx: number; dy: number }): void {
    const domain = renderer.getDomain();
    domain.values[0] -= panDelta.dx;
    domain.values[1] -= panDelta.dx;
    domain.values[2] -= panDelta.dy;
    domain.values[3] -= panDelta.dy;
    
    renderer.draw(domain.name === 'Infinity Neighborhood');
    this.uiManager.updateAxisMarkers(domain);
  }
  
  private handleZoom(renderer: WebGLRenderer, zoomData: { factor: number; x: number; y: number }): void {
    const domain = renderer.getDomain();
    const [xmin, xmax, ymin, ymax] = domain.values;
    
    const width = xmax - xmin;
    const height = ymax - ymin;
    
    // Determine the complex coordinate under the mouse
    const mouseRe = xmin + zoomData.x * width;
    const mouseIm = ymin + (1 - zoomData.y) * height;
    
    const newWidth = width * zoomData.factor;
    const newHeight = height * zoomData.factor;
    
    // Adjust domain to keep the point under the mouse stationary
    domain.values[0] = mouseRe - zoomData.x * newWidth;
    domain.values[1] = mouseRe + (1 - zoomData.x) * newWidth;
    domain.values[2] = mouseIm - (1 - zoomData.y) * newHeight;
    domain.values[3] = mouseIm + zoomData.y * newHeight;
    
    renderer.draw(domain.name === 'Infinity Neighborhood');
    this.uiManager.updateAxisMarkers(domain);
  }
  
  /**
   * The core update loop: parses input, updates shaders, and redraws canvases.
   */
  private updateAndRedraw(): void {
    const funcStr = this.uiManager.getFunctionString();
    
    try {
      // The Expression object handles parsing and code generation internally
      this.expression.parse(funcStr);
      
      // If parsing succeeds, update the renderers with the new GLSL code
      const glslCode = this.expression.getGlslCode();
      this.finiteRenderer.updateFunctionShader(glslCode);
      this.infinityRenderer.updateFunctionShader(glslCode);
      
      // Clear any previous error messages
      this.uiManager.clearError();
      
    } catch (error) {
      // If parsing fails, display the error and do not redraw
      this.uiManager.displayError((error as Error).message);
      return; // Stop execution if there's a parse error
    }
    
    // Render the scenes on both canvases
    this.finiteRenderer.draw();
    this.infinityRenderer.draw(true); // true indicates this is the infinity plot
  }
  
  /**
   * Calculates the value of the current function for the info panel.
   * @param z The complex number input.
   * @param isInfinityPlot Whether the value comes from the infinity plot.
   * @returns The resulting complex number.
   */
  private getFunctionValueAt(z: Complex, isInfinityPlot: boolean): Complex {
    const evalZ = isInfinityPlot ? Complex.inv(z) : z;
    return this.expression.evaluate(evalZ);
  }
}
