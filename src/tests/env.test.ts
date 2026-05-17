import { parseEnv } from '../config/env';

describe('env config', () => {
  it('throws for invalid environment values', () => {
    expect(() =>
      parseEnv({
        NODE_ENV: 'invalid',
        PORT: 'not-a-number',
        MONGO_URI: '',
      }),
    ).toThrow('Invalid environment configuration');
  });

  it('parses valid environment values', () => {
    const parsed = parseEnv({
      NODE_ENV: 'test',
      PORT: '5050',
      MONGO_URI: 'mongodb://localhost:27017/test',
      LOG_LEVEL: 'silent',
      JWT_ACCESS_SECRET: 'test-access-secret-minimum-32-characters',
      JWT_REFRESH_SECRET: 'test-refresh-secret-minimum-32-characters',
    });

    expect(parsed.PORT).toBe(5050);
    expect(parsed.NODE_ENV).toBe('test');
    expect(parsed.MONGO_URI).toBe('mongodb://localhost:27017/test');
  });
});
