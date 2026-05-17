import { registerDto } from '../modules/auth/dto/register.dto';

describe('auth DTOs', () => {
  it('rejects invalid passwords', () => {
    expect(() =>
      registerDto.parse({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'weak',
      }),
    ).toThrow();
  });
});
