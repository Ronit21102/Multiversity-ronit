// Test file to verify column letter generation
import { columnIndexToLetter, letterToColumnIndex } from '../utils/cellReference';

// Test cases for column index to letter conversion
const testCases = [
  { index: 0, expected: 'A' },
  { index: 1, expected: 'B' },
  { index: 25, expected: 'Z' },
  { index: 26, expected: 'AA' },
  { index: 27, expected: 'AB' },
  { index: 51, expected: 'AZ' },
  { index: 52, expected: 'BA' },
  { index: 701, expected: 'ZZ' },
  { index: 702, expected: 'AAA' },
  { index: 703, expected: 'AAB' },
];

console.log('Testing column index to letter conversion:');
testCases.forEach(({ index, expected }) => {
  const result = columnIndexToLetter(index);
  const isCorrect = result === expected;
  console.log(`${index} -> ${result} (expected ${expected}) ${isCorrect ? '✓' : '✗'}`);
});

console.log('\nTesting reverse conversion:');
testCases.forEach(({ index, expected }) => {
  const convertedBack = letterToColumnIndex(expected);
  const isCorrect = convertedBack === index;
  console.log(`${expected} -> ${convertedBack} (expected ${index}) ${isCorrect ? '✓' : '✗'}`);
});
