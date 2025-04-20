import CryptoJS from 'crypto-js';

export const validatePassword = (password: string): boolean => {
    // Password must be 10 characters long and contain letters, numbers, and special characters
    return (
        password.length >= 10 &&
        /[A-Za-z]/.test(password) &&
        /\d/.test(password) &&
        /[@$!%*#?&^]/.test(password)
    );
};

export const encryptData = (data: string, password: string): string => {
    if (!validatePassword(password)) {
        throw new Error('Invalid password format');
    }
    return CryptoJS.AES.encrypt(data, password).toString();
};

export const decryptData = (encryptedData: string, password: string): string => {
    if (!validatePassword(password)) {
        throw new Error('Invalid password format');
    }
    const bytes = CryptoJS.AES.decrypt(encryptedData, password);
    return bytes.toString(CryptoJS.enc.Utf8);
};