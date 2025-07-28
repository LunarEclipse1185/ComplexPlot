import { Complex } from '../complex';

// --- Type Definitions ---
export type Operator = '+' | '-' | '*' | '/' | '^';
export type Associativity = 'left' | 'right';

export interface OperatorInfo {
  precedence: number;
  associativity: Associativity;
  glsl: string;
  js: (a: Complex, b: Complex) => Complex;
}

export interface FunctionInfo {
  arity: number; // Number of arguments
  glsl: string;
  js: (...args: Complex[]) => Complex;
}

// --- Operator Definitions ---
export const OPERATORS: Record<Operator, OperatorInfo> = {
  '+': { precedence: 2, associativity: 'left', glsl: 'c_add', js: Complex.add },
  '-': { precedence: 2, associativity: 'left', glsl: 'c_sub', js: Complex.sub },
  '*': { precedence: 3, associativity: 'left', glsl: 'c_mul', js: Complex.mul },
  '/': { precedence: 3, associativity: 'left', glsl: 'c_div', js: Complex.div },
  '^': { precedence: 4, associativity: 'right', glsl: 'c_pow', js: Complex.pow },
};

// --- Function Definitions ---
// This structure makes it easy to add new functions.
// Just add a new entry here, and the parser/generator will support it.
export const FUNCTIONS: Record<string, FunctionInfo> = {
  'sin':  { arity: 1, glsl: 'c_sin',  js: Complex.sin },
  'cos':  { arity: 1, glsl: 'c_cos',  js: Complex.cos },
  'sinh':  { arity: 1, glsl: 'c_sinh',  js: Complex.sinh },
  'cosh':  { arity: 1, glsl: 'c_cosh',  js: Complex.cosh },
  'exp':  { arity: 1, glsl: 'c_exp',  js: Complex.exp },
  'log':  { arity: 1, glsl: 'c_log',  js: Complex.log },
  'sqrt': { arity: 1, glsl: 'c_sqrt', js: Complex.sqrt },
  'pow':  { arity: 2, glsl: 'c_pow',  js: Complex.pow },
};

// --- Constants ---
export const CONSTANTS: Record<string, { value: Complex, glsl: string }> = {
  'pi': { value: new Complex(Math.PI, 0), glsl: `vec2(${Math.PI}, 0.0)` },
  'e':  { value: new Complex(Math.E, 0),  glsl: `vec2(${Math.E}, 0.0)` },
  'i':  { value: new Complex(0, 1),       glsl: 'vec2(0.0, 1.0)' },
};
