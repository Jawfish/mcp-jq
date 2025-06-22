# jq MCP Server - Testing Documentation

## Overview

This document describes the testing strategy and implementation for the jq MCP server. The execution logic has been extracted into a separate module to enable comprehensive unit testing independent of the MCP server framework.

## Architecture

### Code Structure
- `lib/jq-operations.ts` - Core execution logic for all jq operations
- `index-refactored.ts` - MCP server implementation using the extracted logic
- `tests/jq-operations.test.ts` - Comprehensive test suite

### Design Benefits
1. **Separation of Concerns**: Business logic separated from MCP server framework
2. **Testability**: Core functionality can be tested independently
3. **Maintainability**: Easier to debug and modify individual operations
4. **Reusability**: Logic can be used outside of MCP server context

## Test Coverage

### Test Statistics
- **68 tests** covering all functionality
- **95.12% statement coverage**
- **100% function coverage**
- All core operations tested with multiple scenarios

### Tested Functions

#### Core Operations
- `executeJq()` - Base jq execution wrapper
- `checkJqAvailable()` - jq availability check
- `applyFilter()` - Generic filter application

#### Data Processing
- `validateJson()` - JSON validation and formatting
- `extractPath()` - Path-based value extraction
- `transformData()` - Data transformation
- `filterData()` - Conditional filtering

#### Specialized Operations
- `arrayOperation()` - Array manipulations (12 operations)
- `objectOperation()` - Object manipulations (8 operations) 
- `stringOperation()` - String processing (10 operations)
- `mathOperation()` - Mathematical operations (10 operations)

### Test Categories

#### Happy Path Tests
- Basic functionality for each operation
- Different parameter combinations
- Various input data types
- Output format variations

#### Edge Cases
- Empty inputs
- Null values
- Non-existent paths
- Invalid operations

#### Error Handling
- Invalid jq syntax
- Malformed JSON
- Missing required parameters
- jq execution errors

#### Integration Tests
- Complex filter expressions
- Nested data structures
- Multiple operation chains

## Test Data

### Reusable Test Objects
- `testSimpleObject` - Basic object with mixed data types
- `testUsersArray` - Array of user objects for complex operations
- `testNumbersArray` - Numeric array for math operations
- `testStringValue` - String value for text operations

### Test Scenarios

#### Basic Operations
```typescript
// Path extraction
extractPath({ input: data, path: '.user.name' })

// Array sorting
arrayOperation({ input: data, operation: 'sort', key: 'age' })

// String manipulation
stringOperation({ input: data, operation: 'upper' })
```

#### Complex Transformations
```typescript
// Data reshaping
transformData({ 
  input: users, 
  transformation: 'map({id: .id, name: .name})' 
})

// Conditional filtering
filterData({ 
  input: users, 
  condition: '.age > 30', 
  selector: '.name' 
})
```

#### Error Scenarios
```typescript
// Invalid syntax
applyFilter({ filter: 'invalid[', input: data })
// → Throws JqError

// Missing parameters  
stringOperation({ operation: 'split' })
// → Throws validation error
```

## Running Tests

### Basic Test Run
```bash
bun run test
```

### Watch Mode
```bash
bun run test:watch
```

### Coverage Report
```bash
bun run test:coverage
```

### Test Output
```
✓ tests/jq-operations.test.ts (68 tests) 752ms

Test Files  1 passed (1)
Tests      68 passed (68)
Coverage   95.12% statements, 100% functions
```

## Error Handling

### JqError Interface
```typescript
interface JqError extends Error {
  exitCode: number;
  stderr: string;
}
```

### Error Scenarios Tested
1. **Syntax Errors** - Invalid jq filter expressions
2. **JSON Errors** - Malformed input JSON
3. **Parameter Errors** - Missing required parameters
4. **Runtime Errors** - jq execution failures

## Quality Assurance

### Test Quality Metrics
- **Comprehensive Coverage**: All public functions tested
- **Real Data**: Tests use realistic JSON structures
- **Error Scenarios**: Both success and failure paths covered
- **Performance**: Tests run quickly (< 1 second)

### Validation Approach
1. **Output Verification**: Exact string matching for jq output
2. **Error Validation**: Exception type and message checking
3. **Integration Testing**: End-to-end operation flows
4. **Regression Testing**: Prevent functionality breaks

## Continuous Integration

### Test Requirements
- jq must be installed and available in PATH
- All tests must pass before deployment
- Coverage threshold maintained above 90%
- No timeout failures in CI environment

### Future Enhancements
1. **Performance Tests** - Benchmark operations with large datasets
2. **Stress Tests** - Test with malformed or huge JSON inputs
3. **Integration Tests** - Full MCP server workflow testing
4. **Property-Based Tests** - Generate random valid inputs

This testing strategy ensures the jq MCP server is robust, reliable, and maintainable while providing comprehensive functionality for JSON processing tasks.