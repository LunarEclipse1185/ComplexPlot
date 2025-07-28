/**
 * Defines the types of tokens our language recognizes.
 */
export type TokenType = 'Number' | 'Identifier' | 'Operator' | 'LeftParen' | 'RightParen' | 'Comma';

export interface Token {
  type: TokenType;
  value: string;
}

// Regex to match all possible tokens in the language.
// It captures:
// - identifiers (like 'sin', 'z', 'pi')
// - numbers (including decimals like '3.14')
// - operators (+, -, *, /, ^)
// - parentheses and commas
const TOKEN_REGEX = /[a-zA-Z_][a-zA-Z0-9_]*|\d+\.?\d*|[+\-*/^()]|,/g;

/**
 * Converts an input string into an array of tokens.
 * @param input The mathematical expression string.
 * @returns An array of Token objects.
 * @throws An error if the input string is empty or contains invalid characters.
 */
export function tokenize(input: string): Token[] {
  if (!input) {
    throw new Error("Function cannot be empty.");
  }
  
  const matches = input.replace(/\s+/g, '').match(TOKEN_REGEX);
  if (!matches) {
    throw new Error("Invalid characters in function.");
  }
  
  return matches.map(value => {
    if (!isNaN(parseFloat(value))) {
      return { type: 'Number', value };
    } else if (/[+\-*/^]/.test(value)) {
      return { type: 'Operator', value };
    } else if (value === '(') {
      return { type: 'LeftParen', value };
    } else if (value === ')') {
      return { type: 'RightParen', value };
    } else if (value === ',') {
      return { type: 'Comma', value };
    } else {
      return { type: 'Identifier', value };
    }
  });
}
