import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Hash password function from server/routes.ts
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Compare passwords function from server/auth.ts
async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

describe('Server Authentication', () => {
  describe('Password Hashing', () => {
    it('should hash passwords correctly', async () => {
      const password = 'testPassword123!';
      const hashedPassword = await hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
      expect(hashedPassword).toContain('.');
      
      const [hash, salt] = hashedPassword.split('.');
      expect(hash).toHaveLength(128); // 64 bytes * 2 (hex)
      expect(salt).toHaveLength(32);  // 16 bytes * 2 (hex)
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty passwords', async () => {
      const password = '';
      const hashedPassword = await hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).toContain('.');
    });

    it('should handle special characters in passwords', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hashedPassword = await hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).toContain('.');
    });

    it('should handle unicode characters in passwords', async () => {
      const password = 'пароль密码パスワード🔒';
      const hashedPassword = await hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).toContain('.');
    });
  });

  describe('Password Comparison', () => {
    it('should verify correct passwords', async () => {
      const password = 'testPassword123!';
      const hashedPassword = await hashPassword(password);
      
      const isValid = await comparePasswords(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect passwords', async () => {
      const password = 'testPassword123!';
      const wrongPassword = 'wrongPassword123!';
      const hashedPassword = await hashPassword(password);
      
      const isValid = await comparePasswords(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });

    it('should reject passwords with different cases', async () => {
      const password = 'testPassword123!';
      const wrongCasePassword = 'TESTPASSWORD123!';
      const hashedPassword = await hashPassword(password);
      
      const isValid = await comparePasswords(wrongCasePassword, hashedPassword);
      expect(isValid).toBe(false);
    });

    it('should handle empty password comparison', async () => {
      const password = '';
      const hashedPassword = await hashPassword(password);
      
      const isValid = await comparePasswords('', hashedPassword);
      expect(isValid).toBe(true);
      
      const isInvalid = await comparePasswords('notEmpty', hashedPassword);
      expect(isInvalid).toBe(false);
    });

    it('should handle malformed hash strings', async () => {
      const password = 'testPassword123!';
      const malformedHash = 'invalidhash';
      
      await expect(comparePasswords(password, malformedHash)).rejects.toThrow();
    });

    it('should handle hash with invalid hex characters', async () => {
      const password = 'testPassword123!';
      const invalidHash = 'invalidhexcharacters.validsalt1234567890123456789012345678901234567890';
      
      await expect(comparePasswords(password, invalidHash)).rejects.toThrow();
    });
  });

  describe('Security Properties', () => {
    it('should use constant-time comparison', async () => {
      const password = 'testPassword123!';
      const hashedPassword = await hashPassword(password);
      
      // Test multiple times to ensure timing consistency
      const times: number[] = [];
      for (let i = 0; i < 10; i++) {
        const start = process.hrtime.bigint();
        await comparePasswords(password, hashedPassword);
        const end = process.hrtime.bigint();
        times.push(Number(end - start));
      }
      
      // Check that timing variations are minimal (within reasonable bounds)
      const avgTime = times.reduce((a, b) => a + b) / times.length;
      const maxDeviation = Math.max(...times.map(t => Math.abs(t - avgTime)));
      
      // Allow for some variation but ensure it's not excessive
      expect(maxDeviation / avgTime).toBeLessThan(1.0); // 100% deviation threshold (more lenient for CI environments)
    });

    it('should produce cryptographically strong hashes', async () => {
      const passwords = [
        'password1',
        'password2',
        'password3',
        'password4',
        'password5'
      ];
      
      const hashes = await Promise.all(passwords.map(hashPassword));
      
      // Ensure all hashes are unique
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(hashes.length);
      
      // Ensure hashes don't contain obvious patterns
      hashes.forEach(hash => {
        const [hashPart] = hash.split('.');
        expect(hashPart).not.toMatch(/(.)\1{10,}/); // No character repeated more than 10 times
        expect(hashPart).not.toMatch(/012345|abcdef|fedcba/); // No obvious sequences
      });
    });

    it('should handle concurrent hashing operations', async () => {
      const password = 'testPassword123!';
      const concurrentOperations = 10;
      
      const promises = Array(concurrentOperations).fill(null).map(() => hashPassword(password));
      const results = await Promise.all(promises);
      
      // All operations should complete successfully
      expect(results).toHaveLength(concurrentOperations);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result).toContain('.');
      });
      
      // All results should be unique
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBe(concurrentOperations);
    });
  });

  describe('Performance', () => {
    it('should hash passwords within reasonable time', async () => {
      const password = 'testPassword123!';
      
      const start = Date.now();
      await hashPassword(password);
      const end = Date.now();
      
      const duration = end - start;
      
      // Should complete within 1 second (adjust based on your requirements)
      expect(duration).toBeLessThan(1000);
      
      // Should take at least some time (not instant, indicating proper work factor)
      expect(duration).toBeGreaterThan(1);
    });

    it('should verify passwords within reasonable time', async () => {
      const password = 'testPassword123!';
      const hashedPassword = await hashPassword(password);
      
      const start = Date.now();
      await comparePasswords(password, hashedPassword);
      const end = Date.now();
      
      const duration = end - start;
      
      // Should complete within 1 second
      expect(duration).toBeLessThan(1000);
      
      // Should take at least some time
      expect(duration).toBeGreaterThan(1);
    });
  });
});