import { describe, it, expect, beforeEach } from 'vitest';
import { encryptData, decryptData, validatePassword } from '../utils/encryption';
import { saveVaultItems, getVaultItems, exportVaultData, importVaultData } from '../utils/storage';
import { StoredVaultItem } from '../utils/storage';

describe('Vault Security Tests', () => {
    describe('Password Validation', () => {
        it('should accept valid passwords', () => {
            expect(validatePassword('Secure42$#@')).toBe(true);
            expect(validatePassword('Test123!@#')).toBe(true);
        });

        it('should reject invalid passwords', () => {
            expect(validatePassword('short')).toBe(false);
            expect(validatePassword('nospeci4ls')).toBe(false);
            expect(validatePassword('noNumbers!')).toBe(false);
        });
    });

    describe('Encryption/Decryption', () => {
        const testPassword = 'Test123!@#';
        const testData = 'Secret information';

        it('should encrypt and decrypt text correctly', () => {
            const encrypted = encryptData(testData, testPassword);
            expect(encrypted).not.toBe(testData);
            const decrypted = decryptData(encrypted, testPassword);
            expect(decrypted).toBe(testData);
        });

        it('should throw error for invalid password', () => {
            expect(() => encryptData(testData, 'invalid')).toThrow();
        });
    });

    describe('Storage Operations', () => {
        const testItem: StoredVaultItem = {
            id: '1',
            encryptedData: 'encrypted-data',
            category: 'test',
            type: 'text',
            createdAt: Date.now()
        };

        beforeEach(async () => {
            await saveVaultItems([]);
        });

        it('should save and retrieve items', async () => {
            await saveVaultItems([testItem]);
            const items = await getVaultItems();
            expect(items).toHaveLength(1);
            expect(items[0]).toEqual(testItem);
        });
    });

    describe('Import/Export', () => {
        const testItems: StoredVaultItem[] = [{
            id: '1',
            encryptedData: 'test-data',
            category: 'test',
            type: 'text',
            createdAt: Date.now()
        }];

        it('should export and import data correctly', () => {
            const exported = exportVaultData(testItems);
            const imported = importVaultData(exported);
            expect(imported).toEqual(testItems);
        });

        it('should reject invalid import data', () => {
            expect(() => importVaultData('{"invalid": "data"}')).toThrow();
        });
    });
});