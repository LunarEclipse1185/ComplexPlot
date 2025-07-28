import type {Token} from './tokenizer';
import type {ASTNode} from './ast';
import { OPERATORS, FUNCTIONS, CONSTANTS, type Operator } from './definitions';

/**
 * Parses a sequence of tokens into an Abstract Syntax Tree (AST).
 * Implements the Shunting-yard algorithm with enhancements for function calls,
 * unary operators, and improved syntax validation.
 * @param tokens The array of tokens from the tokenizer.
 * @returns The root node of the generated AST.
 */
export function parseTokens(tokens: Token[]): ASTNode {
  const outputQueue: ASTNode[] = [];
  const operatorStack: (Token | { type: 'UnaryMinus' })[] = [];
  
  let lastToken: Token | null = null;
  
  for (const token of tokens) {
    // --- Syntax Validation ---
    // A number/identifier cannot follow another number/identifier
    if ((token.type === 'Number' || token.type === 'Identifier') &&
      (lastToken?.type === 'Number' || lastToken?.type === 'Identifier')) {
      throw new Error(`Syntax Error: Unexpected token '${token.value}' after '${lastToken.value}'.`);
    }
    // An operator cannot follow another operator (except for unary minus)
    if (token.type === 'Operator' && lastToken?.type === 'Operator') {
      throw new Error(`Syntax Error: Operator '${token.value}' cannot follow operator '${lastToken.value}'.`);
    }
    
    switch (token.type) {
      case 'Number':
        outputQueue.push({ type: 'Constant', value: parseFloat(token.value) });
        break;
      
      case 'Identifier':
        if (FUNCTIONS[token.value]) {
          operatorStack.push(token);
        } else if (CONSTANTS[token.value] || token.value === 'z') {
          outputQueue.push({ type: 'Variable', name: token.value });
        } else {
          throw new Error(`Syntax Error: Unknown identifier '${token.value}'.`);
        }
        break;
      
      case 'Operator':
        // Handle unary minus: check if it's at the start or after an operator/paren
        if (token.value === '-' && (!lastToken || lastToken.type === 'Operator' || lastToken.type === 'LeftParen')) {
          operatorStack.push({ type: 'UnaryMinus' });
        } else {
          const op1 = token.value as Operator;
          while (operatorStack.length > 0) {
            const topOp = operatorStack[operatorStack.length - 1];
            if (topOp.type === 'LeftParen') break;
            
            if (topOp.type === 'UnaryMinus') {
              applyOperator(outputQueue, operatorStack.pop()!);
              continue;
            }
            
            if (topOp.type === 'Identifier') break; // Function call
            
            const op2 = topOp.value as Operator;
            if ((OPERATORS[op1].associativity === 'left' && OPERATORS[op1].precedence <= OPERATORS[op2].precedence) ||
              (OPERATORS[op1].associativity === 'right' && OPERATORS[op1].precedence < OPERATORS[op2].precedence)) {
              applyOperator(outputQueue, operatorStack.pop()!);
            } else {
              break;
            }
          }
          operatorStack.push(token);
        }
        break;
      
      case 'LeftParen':
        operatorStack.push(token);
        break;
      
      case 'RightParen':
        while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type !== 'LeftParen') {
          applyOperator(outputQueue, operatorStack.pop()!);
        }
        if (operatorStack.length === 0) throw new Error("Syntax Error: Mismatched parentheses.");
        operatorStack.pop(); // Pop the LeftParen
        
        // If a function is at the top of the stack, it's a function call
        const top = operatorStack[operatorStack.length - 1];
        if (top && top.type === 'Identifier') {
          applyOperator(outputQueue, operatorStack.pop()!);
        }
        break;
      
      case 'Comma':
        // Commas are handled implicitly by function argument counting in `applyOperator`
        break;
    }
    lastToken = token;
  }
  
  while (operatorStack.length > 0) {
    const op = operatorStack.pop()!;
    if (op.type === 'LeftParen') throw new Error("Syntax Error: Mismatched parentheses.");
    applyOperator(outputQueue, op);
  }
  
  if (outputQueue.length !== 1) {
    throw new Error("Syntax Error: Invalid expression structure.");
  }
  
  return outputQueue[0];
}

/**
 * Helper function to apply an operator from the stack to the output queue.
 */
function applyOperator(outputQueue: ASTNode[], op: Token | { type: 'UnaryMinus' }): void {
  if (op.type === 'UnaryMinus') {
    if (outputQueue.length < 1) throw new Error("Syntax Error: Invalid unary minus.");
    const operand = outputQueue.pop()!;
    outputQueue.push({ type: 'UnaryMinus', operand });
    return;
  }
  
  if (op.type === 'Identifier') { // Function call
    const funcInfo = FUNCTIONS[op.value];
    if (outputQueue.length < funcInfo.arity) throw new Error(`Syntax Error: Not enough arguments for function '${op.value}'.`);
    const args = outputQueue.splice(outputQueue.length - funcInfo.arity);
    outputQueue.push({ type: 'FunctionCall', functionName: op.value, args });
  } else { // Binary operator
    if (outputQueue.length < 2) throw new Error(`Syntax Error: Missing operand for operator '${op.value}'.`);
    const right = outputQueue.pop()!;
    const left = outputQueue.pop()!;
    outputQueue.push({ type: 'BinaryOperation', operator: op.value as Operator, left, right });
  }
}
