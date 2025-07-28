import type {Operator} from './definitions';

/**
 * Defines the types of nodes that can exist in our Abstract Syntax Tree (AST).
 * The AST is a tree representation of the mathematical expression's structure.
 */

// export type ASTNodeType = 'Constant' | 'Variable' | 'BinaryOperation' | 'FunctionCall' | 'UnaryMinus';

export type ASTNode = {
  type: 'Constant';
  value: number;
} | {
  type: 'Variable';
  name: string;
} | {
  type: 'BinaryOperation';
  operator: Operator;
  left: ASTNode;
  right: ASTNode;
} | {
  type: 'FunctionCall';
  functionName: string;
  args: ASTNode[];
} | {
  type: 'UnaryMinus';
  operand: ASTNode;
};
