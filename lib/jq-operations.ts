import { spawn } from "node:child_process";

export interface JqResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface JqError extends Error {
  exitCode: number;
  stderr: string;
}

// Helper function to execute jq commands
export async function executeJq(args: string[], input?: string): Promise<JqResult> {
  return new Promise((resolve) => {
    const process = spawn('jq', args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    if (input) {
      // Handle EPIPE errors gracefully
      process.stdin.on('error', (error) => {
        if ((error as NodeJS.ErrnoException).code !== 'EPIPE') {
          // Non-EPIPE errors should be logged but we'll ignore them for now
        }
        // EPIPE errors are expected when jq closes early
      });
      
      process.stdin.write(input);
      process.stdin.end();
    }

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code || 0
      });
    });
  });
}

// Helper function to check if jq is available
export async function checkJqAvailable(): Promise<boolean> {
  try {
    const result = await executeJq(['--version']);
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

// Helper function to create a JqError
function createJqError(message: string, result: JqResult): JqError {
  const error = new Error(message) as JqError;
  error.exitCode = result.exitCode;
  error.stderr = result.stderr;
  return error;
}

// Apply jq filter with options
export interface ApplyFilterOptions {
  filter: string;
  input: string;
  compact?: boolean;
  raw?: boolean;
  sort?: boolean;
  tab?: boolean;
  args?: Record<string, string>;
}

export async function applyFilter(options: ApplyFilterOptions): Promise<string> {
  const { filter, input, compact, raw, sort, tab, args } = options;
  const jqArgs: string[] = [];
  
  // Add output formatting options
  if (compact) jqArgs.push("--compact-output");
  if (raw) jqArgs.push("--raw-output");
  if (sort) jqArgs.push("--sort-keys");
  if (tab) jqArgs.push("--tab");
  
  // Add variables
  if (args) {
    Object.entries(args).forEach(([key, value]) => {
      jqArgs.push("--arg", key, value);
    });
  }
  
  // Add the filter
  jqArgs.push(filter);
  
  const result = await executeJq(jqArgs, input);
  
  if (result.exitCode !== 0 && result.stderr) {
    throw createJqError(`Error executing jq: ${result.stderr}`, result);
  }
  
  return result.stdout || "No output";
}

// Validate and format JSON
export interface ValidateJsonOptions {
  input: string;
  format?: boolean;
  compact?: boolean;
  sort?: boolean;
}

export async function validateJson(options: ValidateJsonOptions): Promise<string> {
  const { input, format = true, compact, sort } = options;
  const args: string[] = [];
  
  if (compact) {
    args.push("--compact-output");
  } else if (format) {
    // Default is pretty formatting
  }
  
  if (sort) args.push("--sort-keys");
  
  // Use identity filter to validate and format
  args.push(".");
  
  const result = await executeJq(args, input);
  
  if (result.exitCode !== 0 && result.stderr) {
    throw createJqError(`Invalid JSON: ${result.stderr}`, result);
  }
  
  return result.stdout;
}

// Extract values by path
export interface ExtractPathOptions {
  input: string;
  path: string;
  raw?: boolean;
}

export async function extractPath(options: ExtractPathOptions): Promise<string> {
  const { input, path, raw } = options;
  const args: string[] = [];
  
  if (raw) args.push("--raw-output");
  args.push(path);
  
  const result = await executeJq(args, input);
  
  if (result.exitCode !== 0 && result.stderr) {
    throw createJqError(`Error extracting path: ${result.stderr}`, result);
  }
  
  return result.stdout || "null";
}

// Transform data with jq expression
export interface TransformDataOptions {
  input: string;
  transformation: string;
}

export async function transformData(options: TransformDataOptions): Promise<string> {
  const { input, transformation } = options;
  
  const result = await executeJq([transformation], input);
  
  if (result.exitCode !== 0 && result.stderr) {
    throw createJqError(`Error in transformation: ${result.stderr}`, result);
  }
  
  return result.stdout || "null";
}

// Filter data based on conditions
export interface FilterDataOptions {
  input: string;
  condition: string;
  selector?: string;
}

export async function filterData(options: FilterDataOptions): Promise<string> {
  const { input, condition, selector = "." } = options;
  
  // Build the filter expression
  const filter = `map(select(${condition})) | .[] | ${selector}`;
  
  const result = await executeJq([filter], input);
  
  if (result.exitCode !== 0 && result.stderr) {
    throw createJqError(`Error filtering data: ${result.stderr}`, result);
  }
  
  return result.stdout || "No matches found";
}

// Array operations
export type ArrayOperation = 
  | "length" | "reverse" | "sort" | "unique" | "flatten" 
  | "sum" | "min" | "max" | "group_by" | "first" | "last";

export interface ArrayOperationOptions {
  input: string;
  operation: ArrayOperation;
  key?: string;
  depth?: number;
}

export async function arrayOperation(options: ArrayOperationOptions): Promise<string> {
  const { input, operation, key, depth } = options;
  let filter: string;
  
  switch (operation) {
    case "length":
      filter = "length";
      break;
    case "reverse":
      filter = "reverse";
      break;
    case "sort":
      filter = key ? `sort_by(.${key})` : "sort";
      break;
    case "unique":
      filter = key ? `unique_by(.${key})` : "unique";
      break;
    case "flatten":
      filter = depth !== undefined ? `flatten(${depth})` : "flatten";
      break;
    case "sum":
      filter = "add";
      break;
    case "min":
      filter = key ? `min_by(.${key})` : "min";
      break;
    case "max":
      filter = key ? `max_by(.${key})` : "max";
      break;
    case "group_by":
      filter = key ? `group_by(.${key})` : "group_by(.)";
      break;
    case "first":
      filter = "first";
      break;
    case "last":
      filter = "last";
      break;
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
  
  const result = await executeJq([filter], input);
  
  if (result.exitCode !== 0 && result.stderr) {
    throw createJqError(`Error in array operation: ${result.stderr}`, result);
  }
  
  return result.stdout || "null";
}

// Object operations
export type ObjectOperation = 
  | "keys" | "values" | "to_entries" | "from_entries" 
  | "has" | "delete" | "merge" | "pick";

export interface ObjectOperationOptions {
  input: string;
  operation: ObjectOperation;
  key?: string;
  keys?: string[];
  mergeWith?: string;
}

export async function objectOperation(options: ObjectOperationOptions): Promise<string> {
  const { input, operation, key, keys, mergeWith } = options;
  let filter: string;
  
  switch (operation) {
    case "keys":
      filter = "keys";
      break;
    case "values":
      filter = ".[]";
      break;
    case "to_entries":
      filter = "to_entries";
      break;
    case "from_entries":
      filter = "from_entries";
      break;
    case "has":
      if (!key) throw new Error("Key required for has operation");
      filter = `has("${key}")`;
      break;
    case "delete":
      if (!key) throw new Error("Key required for delete operation");
      filter = `del(.${key})`;
      break;
    case "merge":
      if (!mergeWith) throw new Error("mergeWith object required for merge operation");
      filter = `. + ${mergeWith}`;
      break;
    case "pick":
      if (!keys || keys.length === 0) throw new Error("Keys required for pick operation");
      filter = `{${keys.map(k => `${k}: .${k}`).join(", ")}}`;
      break;
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
  
  const result = await executeJq([filter], input);
  
  if (result.exitCode !== 0 && result.stderr) {
    throw createJqError(`Error in object operation: ${result.stderr}`, result);
  }
  
  return result.stdout || "null";
}

// String operations
export type StringOperation = 
  | "length" | "split" | "join" | "contains" | "startswith" 
  | "endswith" | "trim" | "upper" | "lower" | "replace";

export interface StringOperationOptions {
  input: string;
  operation: StringOperation;
  separator?: string;
  searchValue?: string;
  replaceValue?: string;
}

export async function stringOperation(options: StringOperationOptions): Promise<string> {
  const { input, operation, separator, searchValue, replaceValue } = options;
  let filter: string;
  
  switch (operation) {
    case "length":
      filter = "length";
      break;
    case "split":
      if (!separator) throw new Error("Separator required for split operation");
      filter = `split("${separator}")`;
      break;
    case "join":
      if (!separator) throw new Error("Separator required for join operation");
      filter = `join("${separator}")`;
      break;
    case "contains":
      if (!searchValue) throw new Error("Search value required for contains operation");
      filter = `contains("${searchValue}")`;
      break;
    case "startswith":
      if (!searchValue) throw new Error("Search value required for startswith operation");
      filter = `startswith("${searchValue}")`;
      break;
    case "endswith":
      if (!searchValue) throw new Error("Search value required for endswith operation");
      filter = `endswith("${searchValue}")`;
      break;
    case "trim":
      filter = '. | gsub("^\\\\s+|\\\\s+$"; "")';
      break;
    case "upper":
      filter = "ascii_upcase";
      break;
    case "lower":
      filter = "ascii_downcase";
      break;
    case "replace":
      if (!searchValue || !replaceValue) {
        throw new Error("Both search and replace values required for replace operation");
      }
      filter = `gsub("${searchValue}"; "${replaceValue}")`;
      break;
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
  
  const result = await executeJq([filter], input);
  
  if (result.exitCode !== 0 && result.stderr) {
    throw createJqError(`Error in string operation: ${result.stderr}`, result);
  }
  
  return result.stdout || "null";
}

// Mathematical operations
export type MathOperation = 
  | "add" | "multiply" | "subtract" | "divide" | "modulo"
  | "floor" | "ceil" | "round" | "abs" | "sqrt";

export interface MathOperationOptions {
  input: string;
  operation: MathOperation;
  operand?: number;
}

export async function mathOperation(options: MathOperationOptions): Promise<string> {
  const { input, operation, operand } = options;
  let filter: string;
  
  switch (operation) {
    case "add":
      filter = operand !== undefined ? `. + ${operand}` : "add";
      break;
    case "multiply":
      filter = operand !== undefined ? `. * ${operand}` : "map(.) | add";
      break;
    case "subtract":
      if (operand === undefined) throw new Error("Operand required for subtract operation");
      filter = `. - ${operand}`;
      break;
    case "divide":
      if (operand === undefined) throw new Error("Operand required for divide operation");
      filter = `. / ${operand}`;
      break;
    case "modulo":
      if (operand === undefined) throw new Error("Operand required for modulo operation");
      filter = `. % ${operand}`;
      break;
    case "floor":
      filter = "floor";
      break;
    case "ceil":
      filter = "ceil";
      break;
    case "round":
      filter = "round";
      break;
    case "abs":
      filter = "abs";
      break;
    case "sqrt":
      filter = "sqrt";
      break;
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
  
  const result = await executeJq([filter], input);
  
  if (result.exitCode !== 0 && result.stderr) {
    throw createJqError(`Error in math operation: ${result.stderr}`, result);
  }
  
  return result.stdout || "null";
}