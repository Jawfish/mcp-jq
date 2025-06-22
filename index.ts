#!/usr/bin/env bun

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  checkJqAvailable,
  applyFilter,
  validateJson,
  extractPath,
  transformData,
  filterData,
  arrayOperation,
  objectOperation,
  stringOperation,
  mathOperation,
  executeJq,
  type JqError
} from "./lib/jq-operations.js";

/**
 * jq MCP Server
 * 
 * Provides tools for JSON processing, transformation, and analysis using jq.
 */

// Create the MCP server
const server = new McpServer({
  name: "JSON Processing & Transformation Tools",
  version: "1.0.0"
});

// Helper function to handle errors consistently
function handleError(error: unknown) {
  if (error instanceof Error) {
    const _jqError = error as JqError;
    return {
      content: [{
        type: "text" as const,
        text: error.message
      }],
      isError: true
    };
  }
  return {
    content: [{
      type: "text",
      text: `Error: ${String(error)}`
    }],
    isError: true
  };
}

// Tool: Basic jq filter application
server.tool(
  "apply-filter",
  {
    filter: z.string().describe("The jq filter expression to apply"),
    input: z.string().describe("JSON input data"),
    compact: z.boolean().optional().describe("Use compact output format"),
    raw: z.boolean().optional().describe("Output raw strings, not JSON texts"),
    sort: z.boolean().optional().describe("Sort object keys"),
    tab: z.boolean().optional().describe("Use tabs for indentation"),
    args: z.record(z.string()).optional().describe("Variables to pass to jq filter (--arg)")
  },
  async ({ filter, input, compact, raw, sort, tab, args }, _extra) => {
    try {
      const result = await applyFilter({ filter, input, compact, raw, sort, tab, args });
      return {
        content: [{
          type: "text" as const,
          text: result
        }]
      };
    } catch (error) {
      return handleError(error);
    }
  }
);

// Tool: JSON validation and formatting
server.tool(
  "validate-json",
  {
    input: z.string().describe("JSON input to validate"),
    format: z.boolean().optional().describe("Pretty-format the JSON output"),
    compact: z.boolean().optional().describe("Use compact output format"),
    sort: z.boolean().optional().describe("Sort object keys")
  },
  async ({ input, format = true, compact, sort }, _extra) => {
    try {
      const result = await validateJson({ input, format, compact, sort });
      return {
        content: [{
          type: "text" as const,
          text: `Valid JSON:\n${result}`
        }]
      };
    } catch (error) {
      return handleError(error);
    }
  }
);

// Tool: Extract values by path
server.tool(
  "extract-path",
  {
    input: z.string().describe("JSON input data"),
    path: z.string().describe("JSON path to extract (e.g., '.user.name', '.items[0]', '.[]')"),
    raw: z.boolean().optional().describe("Output raw values instead of JSON")
  },
  async ({ input, path, raw }, _extra) => {
    try {
      const result = await extractPath({ input, path, raw });
      return {
        content: [{
          type: "text" as const,
          text: result
        }]
      };
    } catch (error) {
      return handleError(error);
    }
  }
);

// Tool: Transform and map data
server.tool(
  "transform-data",
  {
    input: z.string().describe("JSON input data"),
    transformation: z.string().describe("jq transformation expression"),
    description: z.string().optional().describe("Description of the transformation")
  },
  async ({ input, transformation, description }, _extra) => {
    try {
      const result = await transformData({ input, transformation });
      const output = description ? 
        `${description}:\n${result}` : 
        result;
      
      return {
        content: [{
          type: "text" as const,
          text: output
        }]
      };
    } catch (error) {
      return handleError(error);
    }
  }
);

// Tool: Filter and select data
server.tool(
  "filter-data",
  {
    input: z.string().describe("JSON input data"),
    condition: z.string().describe("Filter condition (e.g., '.age > 21', '.status == \"active\"')"),
    selector: z.string().optional().describe("What to select from matching items (default: entire item)")
  },
  async ({ input, condition, selector = "." }, _extra) => {
    try {
      const result = await filterData({ input, condition, selector });
      return {
        content: [{
          type: "text" as const,
          text: result
        }]
      };
    } catch (error) {
      return handleError(error);
    }
  }
);

// Tool: Array operations
server.tool(
  "array-operations",
  {
    input: z.string().describe("JSON input data"),
    operation: z.enum([
      "length", "reverse", "sort", "unique", "flatten", 
      "sum", "min", "max", "group_by", "first", "last"
    ]).describe("Array operation to perform"),
    key: z.string().optional().describe("Key for operations like group_by or sort_by"),
    depth: z.number().optional().describe("Depth for flatten operation")
  },
  async ({ input, operation, key, depth }, _extra) => {
    try {
      const result = await arrayOperation({ input, operation, key, depth });
      return {
        content: [{
          type: "text" as const,
          text: result
        }]
      };
    } catch (error) {
      return handleError(error);
    }
  }
);

// Tool: Object operations
server.tool(
  "object-operations",
  {
    input: z.string().describe("JSON input data"),
    operation: z.enum([
      "keys", "values", "to_entries", "from_entries", 
      "has", "delete", "merge", "pick"
    ]).describe("Object operation to perform"),
    key: z.string().optional().describe("Key for operations like has or delete"),
    keys: z.array(z.string()).optional().describe("Keys for operations like pick"),
    mergeWith: z.string().optional().describe("JSON object to merge with")
  },
  async ({ input, operation, key, keys, mergeWith }, _extra) => {
    try {
      const result = await objectOperation({ input, operation, key, keys, mergeWith });
      return {
        content: [{
          type: "text" as const,
          text: result
        }]
      };
    } catch (error) {
      return handleError(error);
    }
  }
);

// Tool: String operations
server.tool(
  "string-operations",
  {
    input: z.string().describe("JSON input data"),
    operation: z.enum([
      "length", "split", "join", "contains", "startswith", 
      "endswith", "trim", "upper", "lower", "replace"
    ]).describe("String operation to perform"),
    separator: z.string().optional().describe("Separator for split/join operations"),
    searchValue: z.string().optional().describe("Value to search for"),
    replaceValue: z.string().optional().describe("Replacement value")
  },
  async ({ input, operation, separator, searchValue, replaceValue }, _extra) => {
    try {
      const result = await stringOperation({ input, operation, separator, searchValue, replaceValue });
      return {
        content: [{
          type: "text" as const,
          text: result
        }]
      };
    } catch (error) {
      return handleError(error);
    }
  }
);

// Tool: Mathematical operations
server.tool(
  "math-operations",
  {
    input: z.string().describe("JSON input data (numbers or arrays of numbers)"),
    operation: z.enum([
      "add", "multiply", "subtract", "divide", "modulo",
      "floor", "ceil", "round", "abs", "sqrt"
    ]).describe("Mathematical operation to perform"),
    operand: z.number().optional().describe("Second operand for binary operations")
  },
  async ({ input, operation, operand }, _extra) => {
    try {
      const result = await mathOperation({ input, operation, operand });
      return {
        content: [{
          type: "text" as const,
          text: result
        }]
      };
    } catch (error) {
      return handleError(error);
    }
  }
);

// Tool: Get jq version and help
server.tool(
  "tool-info",
  {},
  async (_args, _extra) => {
    try {
      const [versionResult, helpResult] = await Promise.all([
        executeJq(['--version']),
        executeJq(['--help'])
      ]);
      
      return {
        content: [{
          type: "text" as const,
          text: `jq Version:\n${versionResult.stdout}\n\nBasic Help:\n${helpResult.stdout.slice(0, 1000)}...`
        }]
      };
    } catch (error) {
      return handleError(error);
    }
  }
);

// Add helpful prompts for common use cases
server.prompt(
  "analyze-json-structure",
  {
    data: z.string().describe("JSON data to analyze")
  },
  ({ data }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text" as const,
        text: `Analyze the structure of this JSON data: ${data}

Please use jq tools to:
1. Validate the JSON format
2. Extract all keys at the root level
3. Determine the types of values
4. Show the overall structure and depth
5. Identify any arrays and their lengths

Use the available jq tools systematically to provide a comprehensive analysis.`
      }
    }]
  })
);

server.prompt(
  "transform-json-data",
  {
    input: z.string().describe("Input JSON data"),
    goal: z.string().describe("Transformation goal")
  },
  ({ input, goal }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text" as const,
        text: `Transform this JSON data: ${input}

Goal: ${goal}

Please help me:
1. Analyze the current structure
2. Design the appropriate jq transformation
3. Apply the transformation using jq tools
4. Validate the result

Use the jq tools to achieve the transformation step by step.`
      }
    }]
  })
);

server.prompt(
  "extract-json-insights",
  {
    data: z.string().describe("JSON data to extract insights from")
  },
  ({ data }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text" as const,
        text: `Extract insights from this JSON data: ${data}

Please use jq tools to:
1. Count total items/records
2. Find unique values in key fields
3. Calculate statistics (min, max, average) where applicable
4. Identify patterns and relationships
5. Summarize the key findings

Use the available jq tools to perform comprehensive data analysis.`
      }
    }]
  })
);

// Add resources with common jq patterns and examples
server.resource(
  "jq-patterns",
  "patterns://jq",
  async (_args, _extra) => ({
    contents: [{
      uri: "patterns://jq",
      text: `# Common jq Patterns and Examples

## Basic Filtering
- \`.fieldname\` - Extract a field value
- \`.[0]\` - Get first array element
- \`.[] | .name\` - Extract name from each item
- \`.items[] | select(.active)\` - Filter active items

## Array Operations
- \`length\` - Get array length
- \`map(.field)\` - Extract field from each item
- \`sort_by(.date)\` - Sort by date field
- \`group_by(.category)\` - Group by category
- \`unique_by(.id)\` - Remove duplicates by id
- \`add\` - Sum all numbers in array

## Object Operations
- \`keys\` - Get all object keys
- \`has("field")\` - Check if field exists
- \`del(.field)\` - Delete a field
- \`{name: .name, age: .age}\` - Select specific fields

## Conditional Logic
- \`if .age > 18 then "adult" else "minor" end\` - Conditional
- \`select(.status == "active")\` - Filter by condition
- \`// "default"\` - Provide default value

## String Operations
- \`split(",")\` - Split string by comma
- \`join(" ")\` - Join array with space
- \`contains("text")\` - Check if contains text
- \`startswith("prefix")\` - Check prefix

## Advanced Transformations
- \`reduce .[] as $item (0; . + $item.value)\` - Reduce operation
- \`to_entries | map(select(.value > 10)) | from_entries\` - Filter object values
- \`flatten\` - Flatten nested arrays
- \`reverse\` - Reverse array order

## Data Type Conversion
- \`tonumber\` - Convert to number
- \`tostring\` - Convert to string
- \`type\` - Get data type
- \`@base64\` - Base64 encode
- \`@uri\` - URL encode`
    }]
  })
);

server.resource(
  "jq-cookbook",
  "cookbook://jq",
  async (_args, _extra) => ({
    contents: [{
      uri: "cookbook://jq",
      text: `# jq Cookbook - Common Tasks

## Data Extraction
\`\`\`bash
# Extract all email addresses
jq '.users[].email'

# Get names of active users
jq '.users[] | select(.active) | .name'

# Extract nested values
jq '.data.results[].attributes.title'
\`\`\`

## Data Transformation
\`\`\`bash
# Reshape object structure
jq '{name: .fullname, id: .user_id, status: .is_active}'

# Create summary statistics
jq '{total: length, active: map(select(.active)) | length}'

# Flatten and restructure
jq '.categories[] | {name: .name, items: .items[].title}'
\`\`\`

## Filtering and Selection
\`\`\`bash
# Filter by multiple conditions
jq '.[] | select(.age > 21 and .status == "active")'

# Find items with specific property
jq '.[] | select(has("premium") and .premium == true)'

# Get top N items
jq 'sort_by(.score) | reverse | .[0:5]'
\`\`\`

## Aggregation and Grouping
\`\`\`bash
# Group by field and count
jq 'group_by(.department) | map({department: .[0].department, count: length})'

# Calculate totals
jq 'map(.amount) | add'

# Find min/max values
jq 'map(.score) | {min: min, max: max, avg: (add / length)}'
\`\`\`

## Working with Arrays
\`\`\`bash
# Merge multiple arrays
jq '.arrays | add'

# Remove duplicates
jq 'unique'

# Sort complex objects
jq 'sort_by(.date, .name)'
\`\`\`

## Error Handling
\`\`\`bash
# Provide defaults for missing fields
jq '.field // "default_value"'

# Skip errors
jq '.[] | .field?'

# Handle different data types
jq 'if type == "array" then .[] else . end'
\`\`\``
    }]
  })
);

// Start the server
async function main() {
  // Check if jq is available
  const isAvailable = await checkJqAvailable();
  if (!isAvailable) {
    process.exit(1);
  }
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (import.meta.main) {
  main().catch(console.error);
}