import { Complex } from './math/complex';
import {type Domain, WebGLRenderer} from './webgl/renderer';

type FunctionEvaluator = (z: Complex, isInfinityPlot: boolean) => Complex;
type PanHandler = (panDelta: { dx: number; dy: number }) => void;
type ZoomHandler = (zoomData: { factor: number; x: number; y: number }) => void;

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
  private isDragging = false;
  private lastMousePosition = { x: 0, y: 0 };
  
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
    this.elements.funcInput.classList.remove('error');
    this.elements.errorPanel.style.display = 'none';
    this.elements.errorPanel.textContent = '';
  }
  
  public setupCanvasInteraction(
    renderer: WebGLRenderer,
    evaluate: FunctionEvaluator,
    onPan: PanHandler,
    onZoom: ZoomHandler
  ): void {
    const canvas = renderer.getCanvas();
    const domain = renderer.getDomain();
    
    // --- Panning Listeners ---
    canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMousePosition = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = 'grabbing';
    });
    
    canvas.addEventListener('mouseup', () => {
      this.isDragging = false;
      canvas.style.cursor = 'grab';
    });
    
    canvas.addEventListener('mouseleave', () => {
      this.isDragging = false;
      this.clearInfoPanel();
      canvas.style.cursor = 'default';
    });
    
    canvas.addEventListener('mouseenter', () => {
      canvas.style.cursor = 'grab';
    });
    
    // --- Combined Mouse Move for Panning and Info Panel ---
    canvas.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const dx = e.clientX - this.lastMousePosition.x;
        const dy = e.clientY - this.lastMousePosition.y;
        this.lastMousePosition = { x: e.clientX, y: e.clientY };
        
        const domainWidth = domain.values[1] - domain.values[0];
        const domainHeight = domain.values[3] - domain.values[2];
        
        // Convert pixel delta to domain delta
        const panDelta = {
          dx: dx * (domainWidth / canvas.clientWidth),
          dy: -dy * (domainHeight / canvas.clientHeight) // Y is inverted
        };
        onPan(panDelta);
      }
      this.updateInfoPanel(e, canvas, domain, evaluate);
    });
    
    // --- Zooming Listener ---
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault(); // Prevent page scroll
      const zoomFactor = e.deltaY < 0 ? 1 / 1.1 : 1.1; // Zoom in or out
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / rect.width;
      const mouseY = (e.clientY - rect.top) / rect.height;
      
      onZoom({ factor: zoomFactor, x: mouseX, y: mouseY });
    });
  }
  
  public updateAxisMarkers(domain: Domain): void {
    const [xmin, xmax, ymin, ymax] = domain.values;
    const idPrefix = domain.name.includes('Finite') ? 'finite' : 'infinity';
    
    const xMarkers = document.querySelectorAll(`#${idPrefix}-markers-x span`);
    const yMarkers = document.querySelectorAll(`#${idPrefix}-markers-y span`);
    
    const xStep = (xmax - xmin) / (xMarkers.length - 1);
    const yStep = (ymax - ymin) / (yMarkers.length - 1);
    
    xMarkers.forEach((span, i) => {
      (span as HTMLElement).textContent = this.toConciseExponential((xmin + i * xStep), 3);
    });
    
    yMarkers.forEach((span, i) => {
      // Y markers are typically ordered top-to-bottom (max to min)
      (span as HTMLElement).textContent = this.toConciseExponential((ymax - i * yStep), 3);
    });
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
    // if (isInfinityPlot && z.mag2() > 1/64) {
    //   this.clearInfoPanel();
    //   return;
    // }
    const fz = evaluate(z, isInfinityPlot);
    
    const displayZ = isInfinityPlot ? Complex.inv(z) : z;
    
    this.elements.infoLocation.textContent = domain.name;
    this.elements.infoZ.textContent = this.formatComplex(displayZ, 4);
    this.elements.infoFz.textContent = this.formatComplex(fz, 4);
    this.elements.infoMag.textContent = this.toConciseExponential(fz.mag(), 4);
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
    return `${this.toConciseExponential(c.re, digits)} ${sign} ${this.toConciseExponential(Math.abs(c.im), digits)} i`;
  }
  
  private toConciseExponential(x: number, n: number): string {
    if (-10000 < x && x < -0.001 || 0.001 < x && x < 10000 || x == 0)
      return x.toFixed(n);
    else
      return x.toExponential(n);
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
