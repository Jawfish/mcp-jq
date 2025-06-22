# jq MCP Server

This MCP server provides tools for JSON processing, transformation, and analysis using jq.

## Prerequisites

- jq must be installed and available in PATH
- Bun runtime environment

## Installation

Make sure jq is installed:

```bash
# On macOS
brew install jq

# On Ubuntu/Debian
apt install jq

# On Arch Linux
pacman -S jq

# On Windows
choco install jq
```

## Available Tools

### Core Tools
- `apply-filter` - Apply jq filter expressions to JSON data
- `validate-json` - Validate and format JSON
- `extract-path` - Extract values by JSON path
- `transform-data` - Transform and map JSON data
- `filter-data` - Filter and select data based on conditions

### Data Operations
- `array-operations` - Array manipulation (sort, reverse, unique, etc.)
- `object-operations` - Object manipulation (keys, values, merge, etc.)
- `string-operations` - String processing (split, join, replace, etc.)
- `math-operations` - Mathematical operations on numeric data

### Utility
- `tool-info` - Get jq version and help information

## Available Prompts

- `analyze-json-structure` - Analyze JSON data structure and types
- `transform-json-data` - Help with complex data transformations
- `extract-json-insights` - Extract insights and statistics from data

## Available Resources

- `jq-patterns` - Common jq patterns and examples
- `jq-cookbook` - Cookbook with practical jq recipes

## Usage Examples

### Basic Filtering
```json
{
  "filter": ".users[].name",
  "input": "{'users': [{'name': 'Alice'}, {'name': 'Bob'}]}"
}
```

### Data Transformation
```json
{
  "transformation": "map({id: .id, fullName: .name, isActive: .active})",
  "input": "[{'id': 1, 'name': 'Alice', 'active': true}]"
}
```

### Array Operations
```json
{
  "operation": "sort",
  "key": "age",
  "input": "[{'name': 'Alice', 'age': 30}, {'name': 'Bob', 'age': 25}]"
}
```

### Mathematical Operations
```json
{
  "operation": "add",
  "input": "[1, 2, 3, 4, 5]"
}
```

## Test Files

- `test-simple.json` - Simple object with various data types
- `test-users.json` - Array of user objects with departments
- `test-ecommerce.json` - Complex e-commerce data structure

## Common Use Cases

The server supports various JSON processing tasks:

1. **Data Validation**: Validate JSON syntax and format
2. **Data Extraction**: Extract specific fields or nested values
3. **Data Transformation**: Reshape and restructure JSON data
4. **Data Analysis**: Calculate statistics, count items, group data
5. **Data Filtering**: Select items based on conditions
6. **Array Processing**: Sort, unique, flatten, reverse arrays
7. **Object Manipulation**: Extract keys, merge objects, delete fields
8. **String Processing**: Split, join, search, replace text
9. **Mathematical Operations**: Sum, average, min/max calculations

## Advanced Features

- Support for jq variables with `--arg` flag
- Multiple output formats (compact, raw, sorted)
- Complex filter expressions and transformations
- Error handling and validation
- Integration with jq's full feature set

The server exposes jq's powerful JSON processing capabilities through MCP tools that can be used by AI assistants for comprehensive data analysis and transformation tasks.