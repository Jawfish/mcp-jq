import { describe, it, expect, beforeAll } from 'vitest';
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
} from '../lib/jq-operations.js';

// Test data
const testSimpleObject = JSON.stringify({
  name: "John Doe",
  age: 30,
  email: "john.doe@example.com",
  active: true,
  tags: ["developer", "javascript", "nodejs"],
  address: {
    street: "123 Main St",
    city: "Anytown",
    state: "CA"
  }
});

const testUsersArray = JSON.stringify([
  { id: 1, name: "Alice", age: 28, department: "engineering", active: true },
  { id: 2, name: "Bob", age: 35, department: "marketing", active: false },
  { id: 3, name: "Carol", age: 42, department: "engineering", active: true }
]);

const testNumbersArray = JSON.stringify([1, 2, 3, 4, 5]);
const testStringValue = JSON.stringify("Hello World");

beforeAll(async () => {
  const isAvailable = await checkJqAvailable();
  if (!isAvailable) {
    throw new Error('jq is not available. Please install jq to run these tests.');
  }
});

describe('jq-operations', () => {
  describe('executeJq', () => {
    it('should execute basic jq command', async () => {
      const result = await executeJq(['.'], '{"test": "value"}');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe('{\n  "test": "value"\n}');
    });

    it('should handle jq errors', async () => {
      const result = await executeJq(['invalid_filter'], '{"test": "value"}');
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('error');
    });

    it('should return version information', async () => {
      const result = await executeJq(['--version']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/jq-\d+\.\d+/);
    });
  });

  describe('checkJqAvailable', () => {
    it('should return true when jq is available', async () => {
      const result = await checkJqAvailable();
      expect(result).toBe(true);
    });
  });

  describe('applyFilter', () => {
    it('should apply basic filter', async () => {
      const result = await applyFilter({
        filter: '.name',
        input: testSimpleObject
      });
      expect(result).toBe('"John Doe"');
    });

    it('should apply filter with compact output', async () => {
      const result = await applyFilter({
        filter: '.',
        input: testSimpleObject,
        compact: true
      });
      expect(result).not.toContain('\n');
      expect(result).toContain('"John Doe"');
    });

    it('should apply filter with raw output', async () => {
      const result = await applyFilter({
        filter: '.name',
        input: testSimpleObject,
        raw: true
      });
      expect(result).toBe('John Doe'); // No quotes when raw
    });

    it('should apply filter with variables', async () => {
      const result = await applyFilter({
        filter: '.name = $newName',
        input: testSimpleObject,
        args: { newName: "Jane Doe" }
      });
      expect(result).toContain('"Jane Doe"');
    });

    it('should sort keys when requested', async () => {
      const result = await applyFilter({
        filter: '.',
        input: '{"z": 1, "a": 2}',
        sort: true
      });
      expect(result.indexOf('"a"')).toBeLessThan(result.indexOf('"z"'));
    });

    it('should throw error for invalid filter', async () => {
      await expect(applyFilter({
        filter: 'invalid_syntax[',
        input: testSimpleObject
      })).rejects.toThrow();
    });
  });

  describe('validateJson', () => {
    it('should validate and format valid JSON', async () => {
      const result = await validateJson({
        input: '{"name":"John","age":30}'
      });
      expect(result).toContain('{\n  "name": "John",\n  "age": 30\n}');
    });

    it('should validate with compact output', async () => {
      const result = await validateJson({
        input: '{"name":"John","age":30}',
        compact: true
      });
      expect(result).toBe('{"name":"John","age":30}');
    });

    it('should sort keys when requested', async () => {
      const result = await validateJson({
        input: '{"z":1,"a":2}',
        sort: true
      });
      expect(result.indexOf('"a"')).toBeLessThan(result.indexOf('"z"'));
    });

    it('should throw error for invalid JSON', async () => {
      await expect(validateJson({
        input: '{"invalid": json}'
      })).rejects.toThrow();
    });
  });

  describe('extractPath', () => {
    it('should extract simple field', async () => {
      const result = await extractPath({
        input: testSimpleObject,
        path: '.name'
      });
      expect(result).toBe('"John Doe"');
    });

    it('should extract nested field', async () => {
      const result = await extractPath({
        input: testSimpleObject,
        path: '.address.city'
      });
      expect(result).toBe('"Anytown"');
    });

    it('should extract array element', async () => {
      const result = await extractPath({
        input: testSimpleObject,
        path: '.tags[0]'
      });
      expect(result).toBe('"developer"');
    });

    it('should extract with raw output', async () => {
      const result = await extractPath({
        input: testSimpleObject,
        path: '.name',
        raw: true
      });
      expect(result).toBe('John Doe');
    });

    it('should handle non-existent path', async () => {
      const result = await extractPath({
        input: testSimpleObject,
        path: '.nonexistent'
      });
      expect(result).toBe('null');
    });
  });

  describe('transformData', () => {
    it('should transform object structure', async () => {
      const result = await transformData({
        input: testSimpleObject,
        transformation: '{fullName: .name, years: .age}'
      });
      expect(result).toContain('"fullName": "John Doe"');
      expect(result).toContain('"years": 30');
    });

    it('should map over array', async () => {
      const result = await transformData({
        input: testUsersArray,
        transformation: 'map({id: .id, name: .name})'
      });
      expect(result).toContain('"Alice"');
      expect(result).toContain('"Bob"');
      expect(result).not.toContain('"department"');
    });

    it('should handle complex transformations', async () => {
      const result = await transformData({
        input: testUsersArray,
        transformation: 'group_by(.department) | map({department: .[0].department, count: length})'
      });
      expect(result).toContain('"engineering"');
      expect(result).toContain('"marketing"');
    });
  });

  describe('filterData', () => {
    it('should filter by condition', async () => {
      const result = await filterData({
        input: testUsersArray,
        condition: '.age > 30'
      });
      expect(result).toContain('Bob');
      expect(result).toContain('Carol');
      expect(result).not.toContain('Alice');
    });

    it('should filter with custom selector', async () => {
      const result = await filterData({
        input: testUsersArray,
        condition: '.department == "engineering"',
        selector: '.name'
      });
      expect(result).toContain('"Alice"');
      expect(result).toContain('"Carol"');
      expect(result).not.toContain('Bob');
    });

    it('should return no matches message when no items match', async () => {
      const result = await filterData({
        input: testUsersArray,
        condition: '.age > 100'
      });
      expect(result).toBe('No matches found');
    });
  });

  describe('arrayOperation', () => {
    it('should get array length', async () => {
      const result = await arrayOperation({
        input: testNumbersArray,
        operation: 'length'
      });
      expect(result).toBe('5');
    });

    it('should reverse array', async () => {
      const result = await arrayOperation({
        input: testNumbersArray,
        operation: 'reverse'
      });
      expect(result).toBe('[\n  5,\n  4,\n  3,\n  2,\n  1\n]');
    });

    it('should sort array', async () => {
      const result = await arrayOperation({
        input: '[3,1,4,1,5]',
        operation: 'sort'
      });
      expect(result).toBe('[\n  1,\n  1,\n  3,\n  4,\n  5\n]');
    });

    it('should sort by key', async () => {
      const result = await arrayOperation({
        input: testUsersArray,
        operation: 'sort',
        key: 'age'
      });
      expect(result).toContain('Alice'); // Should be first (age 28)
    });

    it('should get unique values', async () => {
      const result = await arrayOperation({
        input: '[1,2,2,3,3,3]',
        operation: 'unique'
      });
      expect(result).toBe('[\n  1,\n  2,\n  3\n]');
    });

    it('should sum numbers', async () => {
      const result = await arrayOperation({
        input: testNumbersArray,
        operation: 'sum'
      });
      expect(result).toBe('15');
    });

    it('should find min/max', async () => {
      const minResult = await arrayOperation({
        input: testNumbersArray,
        operation: 'min'
      });
      expect(minResult).toBe('1');

      const maxResult = await arrayOperation({
        input: testNumbersArray,
        operation: 'max'
      });
      expect(maxResult).toBe('5');
    });

    it('should get first/last elements', async () => {
      const firstResult = await arrayOperation({
        input: testNumbersArray,
        operation: 'first'
      });
      expect(firstResult).toBe('1');

      const lastResult = await arrayOperation({
        input: testNumbersArray,
        operation: 'last'
      });
      expect(lastResult).toBe('5');
    });

    it('should flatten array', async () => {
      const result = await arrayOperation({
        input: '[[1,2],[3,4]]',
        operation: 'flatten'
      });
      expect(result).toBe('[\n  1,\n  2,\n  3,\n  4\n]');
    });

    it('should group by key', async () => {
      const result = await arrayOperation({
        input: testUsersArray,
        operation: 'group_by',
        key: 'department'
      });
      expect(result).toContain('engineering');
      expect(result).toContain('marketing');
    });
  });

  describe('objectOperation', () => {
    it('should get object keys', async () => {
      const result = await objectOperation({
        input: testSimpleObject,
        operation: 'keys'
      });
      expect(result).toContain('"name"');
      expect(result).toContain('"age"');
      expect(result).toContain('"address"');
    });

    it('should get object values', async () => {
      const result = await objectOperation({
        input: '{"a":1,"b":2}',
        operation: 'values'
      });
      expect(result).toContain('1');
      expect(result).toContain('2');
    });

    it('should convert to entries', async () => {
      const result = await objectOperation({
        input: '{"a":1,"b":2}',
        operation: 'to_entries'
      });
      expect(result).toContain('"key"');
      expect(result).toContain('"value"');
    });

    it('should convert from entries', async () => {
      const result = await objectOperation({
        input: '[{"key":"a","value":1},{"key":"b","value":2}]',
        operation: 'from_entries'
      });
      expect(result).toContain('"a": 1');
      expect(result).toContain('"b": 2');
    });

    it('should check if key exists', async () => {
      const result = await objectOperation({
        input: testSimpleObject,
        operation: 'has',
        key: 'name'
      });
      expect(result).toBe('true');
    });

    it('should delete key', async () => {
      const result = await objectOperation({
        input: '{"a":1,"b":2,"c":3}',
        operation: 'delete',
        key: 'b'
      });
      expect(result).toContain('"a": 1');
      expect(result).toContain('"c": 3');
      expect(result).not.toContain('"b"');
    });

    it('should merge objects', async () => {
      const result = await objectOperation({
        input: '{"a":1,"b":2}',
        operation: 'merge',
        mergeWith: '{"c":3,"d":4}'
      });
      expect(result).toContain('"a": 1');
      expect(result).toContain('"c": 3');
    });

    it('should pick specific keys', async () => {
      const result = await objectOperation({
        input: testSimpleObject,
        operation: 'pick',
        keys: ['name', 'age']
      });
      expect(result).toContain('"name"');
      expect(result).toContain('"age"');
      expect(result).not.toContain('"email"');
    });
  });

  describe('stringOperation', () => {
    it('should get string length', async () => {
      const result = await stringOperation({
        input: testStringValue,
        operation: 'length'
      });
      expect(result).toBe('11'); // "Hello World" has 11 characters
    });

    it('should split string', async () => {
      const result = await stringOperation({
        input: testStringValue,
        operation: 'split',
        separator: ' '
      });
      expect(result).toBe('[\n  "Hello",\n  "World"\n]');
    });

    it('should join array', async () => {
      const result = await stringOperation({
        input: '["Hello","World"]',
        operation: 'join',
        separator: ' '
      });
      expect(result).toBe('"Hello World"');
    });

    it('should check if contains substring', async () => {
      const result = await stringOperation({
        input: testStringValue,
        operation: 'contains',
        searchValue: 'World'
      });
      expect(result).toBe('true');
    });

    it('should check startswith', async () => {
      const result = await stringOperation({
        input: testStringValue,
        operation: 'startswith',
        searchValue: 'Hello'
      });
      expect(result).toBe('true');
    });

    it('should check endswith', async () => {
      const result = await stringOperation({
        input: testStringValue,
        operation: 'endswith',
        searchValue: 'World'
      });
      expect(result).toBe('true');
    });

    it('should convert to uppercase', async () => {
      const result = await stringOperation({
        input: testStringValue,
        operation: 'upper'
      });
      expect(result).toBe('"HELLO WORLD"');
    });

    it('should convert to lowercase', async () => {
      const result = await stringOperation({
        input: testStringValue,
        operation: 'lower'
      });
      expect(result).toBe('"hello world"');
    });

    it('should replace substring', async () => {
      const result = await stringOperation({
        input: testStringValue,
        operation: 'replace',
        searchValue: 'World',
        replaceValue: 'Universe'
      });
      expect(result).toBe('"Hello Universe"');
    });

    it('should trim whitespace', async () => {
      const result = await stringOperation({
        input: '"  Hello World  "',
        operation: 'trim'
      });
      expect(result).toBe('"Hello World"');
    });
  });

  describe('mathOperation', () => {
    it('should add numbers in array', async () => {
      const result = await mathOperation({
        input: testNumbersArray,
        operation: 'add'
      });
      expect(result).toBe('15');
    });

    it('should add operand to number', async () => {
      const result = await mathOperation({
        input: '10',
        operation: 'add',
        operand: 5
      });
      expect(result).toBe('15');
    });

    it('should subtract numbers', async () => {
      const result = await mathOperation({
        input: '10',
        operation: 'subtract',
        operand: 3
      });
      expect(result).toBe('7');
    });

    it('should multiply numbers', async () => {
      const result = await mathOperation({
        input: '6',
        operation: 'multiply',
        operand: 7
      });
      expect(result).toBe('42');
    });

    it('should divide numbers', async () => {
      const result = await mathOperation({
        input: '15',
        operation: 'divide',
        operand: 3
      });
      expect(result).toBe('5');
    });

    it('should calculate modulo', async () => {
      const result = await mathOperation({
        input: '17',
        operation: 'modulo',
        operand: 5
      });
      expect(result).toBe('2');
    });

    it('should calculate floor', async () => {
      const result = await mathOperation({
        input: '3.7',
        operation: 'floor'
      });
      expect(result).toBe('3');
    });

    it('should calculate ceiling', async () => {
      const result = await mathOperation({
        input: '3.2',
        operation: 'ceil'
      });
      expect(result).toBe('4');
    });

    it('should round numbers', async () => {
      const result = await mathOperation({
        input: '3.6',
        operation: 'round'
      });
      expect(result).toBe('4');
    });

    it('should calculate absolute value', async () => {
      const result = await mathOperation({
        input: '-5',
        operation: 'abs'
      });
      expect(result).toBe('5');
    });

    it('should calculate square root', async () => {
      const result = await mathOperation({
        input: '9',
        operation: 'sqrt'
      });
      expect(result).toBe('3');
    });

    it('should throw error for missing operand in binary operations', async () => {
      await expect(mathOperation({
        input: '10',
        operation: 'subtract'
      })).rejects.toThrow('Operand required for subtract operation');
    });
  });

  describe('error handling', () => {
    it('should throw JqError with proper structure', async () => {
      try {
        await applyFilter({
          filter: 'invalid_syntax[',
          input: testSimpleObject
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        const jqError = error as JqError;
        expect(jqError.message).toContain('Error executing jq');
        expect(jqError.exitCode).toBeGreaterThan(0);
        expect(jqError.stderr).toBeTruthy();
      }
    });

    it('should handle invalid JSON input', async () => {
      await expect(validateJson({
        input: '{invalid json}'
      })).rejects.toThrow();
    });

    it('should handle missing required parameters', async () => {
      await expect(stringOperation({
        input: testStringValue,
        operation: 'split'
        // missing separator
      })).rejects.toThrow('Separator required for split operation');
    });
  });
});