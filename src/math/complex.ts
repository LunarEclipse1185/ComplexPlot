/**
 * A class representing a complex number and its operations.
 * Used for the info panel calculations.
 */
export class Complex {
  re: number; // Real part
  im: number; // Imaginary part
  
  constructor(re: number = 0, im: number = 0) {
    this.re = re;
    this.im = im;
  }
  
  // --- Static Methods for Operations ---
  static add(a: Complex, b: Complex): Complex {
    return new Complex(a.re + b.re, a.im + b.im);
  }
  static sub(a: Complex, b: Complex): Complex {
    return new Complex(a.re - b.re, a.im - b.im);
  }
  static mul(a: Complex, b: Complex): Complex {
    return new Complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
  }
  static inv(z: Complex): Complex {
    const d = z.re * z.re + z.im * z.im;
    if (d === 0) return new Complex(Infinity, Infinity);
    return new Complex(z.re / d, -z.im / d);
  }
  static div(a: Complex, b: Complex): Complex {
    return Complex.mul(a, Complex.inv(b));
  }
  static pow(z: Complex, p: Complex): Complex {
    if (z.re === 0 && z.im === 0) return new Complex(0, 0);
    const r = z.mag();
    const theta = z.arg();
    const log_r = Math.log(r);
    
    const newMag = Math.pow(r, p.re) * Math.exp(-p.im * theta);
    const newAngle = p.re * theta + p.im * log_r;
    
    return new Complex(newMag * Math.cos(newAngle), newMag * Math.sin(newAngle));
  }
  static exp(z: Complex): Complex {
    const e_re = Math.exp(z.re);
    return new Complex(e_re * Math.cos(z.im), e_re * Math.sin(z.im));
  }
  static log(z: Complex): Complex {
    return new Complex(Math.log(z.mag()), z.arg());
  }
  static sqrt(z: Complex): Complex {
    return Complex.pow(z, new Complex(0.5, 0));
  }
  static sin(z: Complex): Complex {
    return new Complex(Math.sin(z.re) * Math.cosh(z.im), Math.cos(z.re) * Math.sinh(z.im));
  }
  static cos(z: Complex): Complex {
    return new Complex(Math.cos(z.re) * Math.cosh(z.im), -Math.sin(z.re) * Math.sinh(z.im));
  }
  static sinh(z: Complex): Complex {
    return new Complex(Math.sinh(z.re) * Math.cos(z.im), Math.cosh(z.re) * Math.sin(z.im));
  }
  static cosh(z: Complex): Complex {
    return new Complex(Math.cosh(z.re) * Math.cos(z.im), Math.sinh(z.re) * Math.sin(z.im));
  }
  
  // --- Instance Methods ---
  mag(): number { return Math.sqrt(this.re * this.re + this.im * this.im); }
  mag2(): number { return this.re * this.re + this.im * this.im; }
  arg(): number { return Math.atan2(this.im, this.re); }
}
