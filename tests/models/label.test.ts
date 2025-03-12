// tests/models/label.test.ts
import { Label } from '../src/models/label';

describe('Label Model', () => {
  it('should define the Label interface', () => {
    const label: Label = {
      id: '1',
      name: 'Test Label',
      color: '#FFFFFF',
    };
    expect(label).toBeDefined();
    expect(label.id).toBe('1');
    expect(label.name).toBe('Test Label');
    expect(label.color).toBe('#FFFFFF');
  });
});