import { Complex } from './math/complex';
import type {Domain} from './webgl/renderer';

// A type for the callback function to get f(z)
type FunctionEvaluator = (z: Complex, isInfinityPlot: boolean) => Complex;

/**
 * Manages all direct interactions with the DOM.
 * This class isolates DOM querying and manipulation from the main application logic.
 */
export class UIManager {
  // A publicly accessible object holding references to key DOM elements.
  public readonly elements: {
    finiteCanvas: HTMLCanvasElement;
    infinityCanvas: HTMLCanvasElement;
    funcInput: HTMLInputElement;
    errorPanel: HTMLDivElement;
    infoLocation: HTMLSpanElement;
    infoZ: HTMLSpanElement;
    infoFz: HTMLSpanElement;
    infoMag: HTMLSpanElement;
    infoArg: HTMLSpanElement;
    argLegend: HTMLCanvasElement;
    magLegend: HTMLCanvasElement;
  };
  
  constructor() {
    // Query all required elements from the DOM once during initialization.
    this.elements = {
      finiteCanvas: this.getElementById<HTMLCanvasElement>('finite-canvas'),
      infinityCanvas: this.getElementById<HTMLCanvasElement>('infinity-canvas'),
      funcInput: this.getElementById<HTMLInputElement>('function-input'),
      errorPanel: this.getElementById<HTMLDivElement>('error-panel'),
      infoLocation: this.getElementById<HTMLSpanElement>('info-location'),
      infoZ: this.getElementById<HTMLSpanElement>('info-z'),
      infoFz: this.getElementById<HTMLSpanElement>('info-fz'),
      infoMag: this.getElementById<HTMLSpanElement>('info-mag'),
      infoArg: this.getElementById<HTMLSpanElement>('info-arg'),
      argLegend: this.getElementById<HTMLCanvasElement>('arg-legend'),
      magLegend: this.getElementById<HTMLCanvasElement>('mag-legend'),
    };
    
    this.clearInfoPanel();
  }
  
  /**
   * A typed wrapper around document.getElementById to reduce boilerplate and add safety.
   * @param id The ID of the element to find.
   * @returns The found element, cast to the specified type.
   * @throws If the element is not found in the DOM.
   */
  private getElementById<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`UI element with id "${id}" not found.`);
    }
    return element as T;
  }
  
  public getFunctionString(): string {
    return this.elements.funcInput.value;
  }
  
  public displayError(message: string): void {
    this.elements.funcInput.classList.add('error');
    this.elements.errorPanel.style.display = 'block';
    this.elements.errorPanel.textContent = message;
  }
  
  public clearError(): void {
    //this.elements.funcInput.classList.remove('error');
    this.elements.errorPanel.style.display = 'none';
    this.elements.errorPanel.textContent = '';
  }
  
  /**
   * Sets up mouse move and leave listeners for a canvas to update the info panel.
   * @param canvas The canvas element to attach listeners to.
   * @param domain The rendering domain of the canvas.
   * @param evaluate The callback function to compute f(z).
   */
  public setupCanvasInteraction(canvas: HTMLCanvasElement, domain: Domain, evaluate: FunctionEvaluator): void {
    canvas.addEventListener('mousemove', (e) => this.updateInfoPanel(e, canvas, domain, evaluate));
    canvas.addEventListener('mouseleave', () => this.clearInfoPanel());
  }
  
  private updateInfoPanel(event: MouseEvent, canvas: HTMLCanvasElement, domain: Domain, evaluate: FunctionEvaluator): void {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const sx = x / canvas.clientWidth;
    const sy = 1.0 - y / canvas.clientHeight; // Y is inverted in web coords
    
    const real = domain.values[0] + sx * (domain.values[1] - domain.values[0]);
    const imag = domain.values[2] + sy * (domain.values[3] - domain.values[2]);
    const z = new Complex(real, imag);
    
    const isInfinityPlot = domain.name === 'Infinity Neighborhood';
    if (isInfinityPlot && z.mag2() > 1/64) {
      this.clearInfoPanel();
      return;
    }
    const fz = evaluate(z, isInfinityPlot);
    
    const displayZ = isInfinityPlot ? Complex.inv(z) : z;
    
    this.elements.infoLocation.textContent = domain.name;
    this.elements.infoZ.textContent = this.formatComplex(displayZ, 4);
    this.elements.infoFz.textContent = this.formatComplex(fz, 4);
    this.elements.infoMag.textContent = fz.abs().toExponential(4);
    this.elements.infoArg.textContent = `${(fz.arg() / Math.PI).toFixed(4)} π rad`;
  }
  
  private clearInfoPanel(): void {
    this.elements.infoLocation.textContent = '—';
    this.elements.infoZ.textContent = '—';
    this.elements.infoFz.textContent = '—';
    this.elements.infoMag.textContent = '—';
    this.elements.infoArg.textContent = '—';
  }
  
  private formatComplex(c: Complex, digits: number): string {
    const sign = c.im < 0 ? '-' : '+';
    return `${c.re.toFixed(digits)} ${sign} ${Math.abs(c.im).toFixed(digits)}i`;
  }
  
  public drawLegends(): void {
    const argCtx = this.elements.argLegend.getContext('2d')!;
    const magCtx = this.elements.magLegend.getContext('2d')!;
    const { width, height } = this.elements.argLegend;
    
    // Argument/Hue Legend
    for (let i = 0; i < width; i++) {
      const hue = (i / width) * 360;
      argCtx.fillStyle = `hsl(${hue}, 90%, 50%)`;
      argCtx.fillRect(i, 0, 1, height);
    }
    
    // Modulus/Lightness Legend
    const gradient = magCtx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, "#f00");
    gradient.addColorStop(0.75, "#f00");
    gradient.addColorStop(1, "#fff");
    magCtx.fillStyle = gradient;
    magCtx.fillRect(0, 0, width, height);
  }
}
