import { tokenize } from './tokenizer';
import { parseTokens } from './parser';
import { generateGlsl, generateJs } from './codegen';
import type {ASTNode} from './ast';
import { Complex } from '../complex';

/**
 * Represents a mathematical expression.
 * This class encapsulates the entire lifecycle of an expression:
 * tokenizing, parsing into an AST, and generating code.
 */
export class Expression {
  // private source: string = 'z';
  private ast: ASTNode | null = null;
  private jsFunction: (z: Complex, C: typeof Complex) => Complex = (z) => z; // Default to identity
  
  constructor(source?: string) {
    if (source) {
      this.parse(source);
    } else {
      // Initialize with the default 'z' function
      this.parse('z');
    }
  }
  
  /**
   * Parses a new mathematical expression string.
   * This updates the AST and the evaluatable JS function.
   * @param source The mathematical expression string (e.g., "sin(z^2 + c)").
   * @throws An error if the source string is syntactically invalid.
   */
  public parse(source: string): void {
    // this.source = source;
    const tokens = tokenize(source);
    this.ast = parseTokens(tokens); // This can throw if parsing fails
    
    // Pre-compile the JavaScript version for evaluation
    const jsCode = generateJs(this.ast);
    // Using new Function is a safe way to evaluate the generated code string.
    // The 'Complex' object is passed as an argument to provide the math library.
    this.jsFunction = new Function('z', 'Complex', `return ${jsCode}`) as typeof this.jsFunction;
  }
  
  /**
   * Evaluates the expression for a given complex number.
   * @param z The input complex number.
   * @returns The result of the function evaluation.
   */
  public evaluate(z: Complex): Complex {
    // We need to bind the context of the function call
    // and pass the input 'z' and the Complex library.
    // const func = new Function('z', 'Complex', `return ${generateJs(this.ast!)}`);
    return this.jsFunction(z, Complex);
  }
  
  /**
   * Generates the GLSL function code for the current expression.
   * @returns A string containing the GLSL `F_Z` function.
   */
  public getGlslCode(): string {
    if (!this.ast) {
      // Default to identity function if parsing hasn't occurred
      return 'vec2 F_Z(vec2 z) { return z; }';
    }
    return generateGlsl(this.ast);
  }
}
