import type { ASTNode } from './ast';
import { OPERATORS, FUNCTIONS, CONSTANTS } from './definitions';
// import { Complex } from '../complex';

/**
 * Generates GLSL code from an Abstract Syntax Tree (AST).
 * @param ast The root node of the AST.
 * @returns A string containing the complete GLSL F_Z function.
 */
export function generateGlsl(ast: ASTNode): string {
  const body = generateGlslNode(ast);
  return `vec2 F_Z(vec2 z) {\n    return ${body};\n}`;
}

function generateGlslNode(node: ASTNode): string {
  switch (node.type) {
    case 'Constant':
      return `vec2(${node.value.toPrecision(15)}, 0.0)`;
    case 'Variable':
      if (CONSTANTS[node.name]) {
        return CONSTANTS[node.name].glsl;
      }
      return 'z'; // The only variable is 'z'
    case 'BinaryOperation':
      const opInfo = OPERATORS[node.operator];
      const left = generateGlslNode(node.left);
      const right = generateGlslNode(node.right);
      return `${opInfo.glsl}(${left}, ${right})`;
    case 'FunctionCall':
      const funcInfo = FUNCTIONS[node.functionName];
      const args = node.args.map(generateGlslNode).join(', ');
      return `${funcInfo.glsl}(${args})`;
    case 'UnaryMinus':
      return `c_mul(vec2(-1.0, 0.0), ${generateGlslNode(node.operand)})`;
  }
}

/**
 * Generates JavaScript code from an Abstract Syntax Tree (AST).
 * This code can be evaluated using `new Function()`.
 * @param ast The root node of the AST.
 * @returns A string of JavaScript code representing the expression.
 */
export function generateJs(ast: ASTNode): string {
  return generateJsNode(ast);
}

function generateJsNode(node: ASTNode): string {
  switch (node.type) {
    case 'Constant':
      return `new Complex(${node.value}, 0)`;
    case 'Variable':
      if (CONSTANTS[node.name]) {
        const c = CONSTANTS[node.name].value;
        return `new Complex(${c.re}, ${c.im})`;
      }
      return 'z';
    case 'BinaryOperation':
      const left = generateJsNode(node.left);
      const right = generateJsNode(node.right);
      const opName = OPERATORS[node.operator].js.name.split('.').pop();
      return `Complex.${opName}(${left}, ${right})`;
    case 'FunctionCall':
      const args = node.args.map(generateJsNode).join(', ');
      const funcName = FUNCTIONS[node.functionName].js.name.split('.').pop();
      return `Complex.${funcName}(${args})`;
    case 'UnaryMinus':
      return `Complex.mul(new Complex(-1, 0), ${generateJsNode(node.operand)})`;
  }
}
