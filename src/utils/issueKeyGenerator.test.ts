import { expect } from 'chai';
import { generateIssueKey } from './issueKeyGenerator';

describe('generateIssueKey', () => {
  it('should generate a TASK key', () => {
    expect(generateIssueKey('Task', 1)).to.equal('TASK-1');
  });

  it('should generate an EPIC key', () => {
    expect(generateIssueKey('Epic', 2)).to.equal('EPIC-2');
  });

  it('should generate a STOR key', () => {
    expect(generateIssueKey('Story', 3)).to.equal('STOR-3');
  });

  it('should generate a BUG key', () => {
    expect(generateIssueKey('Bug', 4)).to.equal('BUG-4');
  });

  it('should generate a SUBT key', () => {
    expect(generateIssueKey('Subtask', 5)).to.equal('SUBT-5');
  });

  it('should throw an error for an unknown issue type', () => {
    expect(() => generateIssueKey('Unknown', 6)).to.throw('Unknown issue type: Unknown');
  });
});
