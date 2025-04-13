import config from './config';

describe('config', () => {
  it('should get a string value with a default', () => {
    process.env.TEST_STRING = 'testString';
    expect(config.get<string>('TEST_STRING', 'defaultValue')).toBe('testString');
    expect(config.get<string>('NON_EXISTENT_STRING', 'defaultValue')).toBe('defaultValue');
    delete process.env.TEST_STRING;
  });

  it('should get a number value with a default', () => {
    process.env.TEST_NUMBER = '123';
    expect(config.get<number>('TEST_NUMBER', 456)).toBe(123);
    expect(config.get<number>('NON_EXISTENT_NUMBER', 456)).toBe(456);
    delete process.env.TEST_NUMBER;
  });

  it('should get a boolean value with a default', () => {
    process.env.TEST_BOOLEAN = 'true';
    expect(config.get<boolean>('TEST_BOOLEAN', false)).toBe(true);
    expect(config.get<boolean>('NON_EXISTENT_BOOLEAN', false)).toBe(false);
    delete process.env.TEST_BOOLEAN;
  });

  it('should get a JSON object value with a default', () => {
    process.env.TEST_JSON = '{"key": "value"}';
    expect(config.get<any>('TEST_JSON', { defaultKey: 'defaultValue' })).toEqual({ key: 'value' });
    expect(config.get<any>('NON_EXISTENT_JSON', { defaultKey: 'defaultValue' })).toEqual({ defaultKey: 'defaultValue' });
    delete process.env.TEST_JSON;
  });

  it('should handle missing environment variables gracefully', () => {
    expect(config.get<string>('MISSING_VAR', 'default')).toBe('default');
    expect(config.get<number>('MISSING_NUMBER', 123)).toBe(123);
    expect(config.get<boolean>('MISSING_BOOLEAN', true)).toBe(true);
  });
});
