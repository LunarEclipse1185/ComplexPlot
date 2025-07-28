import { UIManager } from './ui';
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
    
    // Initialize renderers for both canvases
    this.finiteRenderer = this.createRenderer(this.uiManager.elements.finiteCanvas);
    this.infinityRenderer = this.createRenderer(this.uiManager.elements.infinityCanvas);
    
    // The Expression class now manages parsing, validation, and code generation
    this.expression = new Expression();
    
    this.addEventListeners();
    this.uiManager.drawLegends();
    
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
    
    // Setup mouse interactions for both canvases to display info
    this.uiManager.setupCanvasInteraction(
      this.finiteRenderer.getCanvas(),
      this.finiteRenderer.getDomain(),
      (z, isInfinityPlot) => this.getFunctionValueAt(z, isInfinityPlot)
    );
    this.uiManager.setupCanvasInteraction(
      this.infinityRenderer.getCanvas(),
      this.infinityRenderer.getDomain(),
      (z, isInfinityPlot) => this.getFunctionValueAt(z, isInfinityPlot)
    );
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
    // For the infinity plot, the input z from the UI is actually 1/z_domain
    const evalZ = isInfinityPlot ? Complex.inv(z) : z;
    return this.expression.evaluate(evalZ);
  }
}
