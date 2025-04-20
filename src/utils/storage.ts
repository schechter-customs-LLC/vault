import localforage from 'localforage';
import { encryptData, decryptData } from './encryption';

export interface StoredVaultItem {
    id: string;
    encryptedData: string;
    category: string;
    fileName?: string;
    originalPath?: string;
    type: 'text' | 'file';
    createdAt: number;
}

interface VaultState {
    isLocked: boolean;
    lastModified: number;
    vaultDirectoryHandle?: FileSystemDirectoryHandle;
}

localforage.config({
    name: 'secure-vault',
    storeName: 'vault_store'
});

// Initialize vault directory
export const initializeVaultDirectory = async () => {
    try {
        const directoryHandle = await window.showDirectoryPicker({
            mode: 'readwrite',
            startIn: 'documents'
        });
        
        const state = await getVaultState();
        await localforage.setItem('vault_state', {
            ...state,
            vaultDirectoryHandle: directoryHandle
        });
        
        return directoryHandle;
    } catch (err) {
        throw new Error('Failed to initialize vault directory');
    }
};

// Get vault directory handle
export const getVaultDirectory = async () => {
    const state = await localforage.getItem<VaultState>('vault_state');
    return state?.vaultDirectoryHandle;
};

// Save encrypted file to vault
export const saveFileToVault = async (
    file: File, 
    password: string,
    category: string
): Promise<StoredVaultItem> => {
    const vaultDir = await getVaultDirectory();
    if (!vaultDir) {
        throw new Error('Vault directory not initialized');
    }

    try {
        // Create category subdirectory if it doesn't exist
        let categoryDir: FileSystemDirectoryHandle;
        try {
            categoryDir = await vaultDir.getDirectoryHandle(category);
        } catch {
            categoryDir = await vaultDir.createDirectory(category);
        }

        // Read file content
        const fileContent = await file.arrayBuffer();
        const fileData = btoa(String.fromCharCode(...new Uint8Array(fileContent)));
        
        // Encrypt file data
        const encryptedData = encryptData(fileData, password);
        
        // Save encrypted file
        const encryptedFileName = `${file.name}.encrypted`;
        const fileHandle = await categoryDir.getFileHandle(encryptedFileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(encryptedData);
        await writable.close();

        // Create vault item
        const item: StoredVaultItem = {
            id: Date.now().toString() + Math.random(),
            encryptedData,
            category,
            fileName: file.name,
            originalPath: file.name,
            type: 'file',
            createdAt: Date.now()
        };

        return item;
    } catch (err) {
        throw new Error('Failed to save file to vault');
    }
};

// Read and decrypt file from vault
export const readFileFromVault = async (
    item: StoredVaultItem,
    password: string
): Promise<string> => {
    const vaultDir = await getVaultDirectory();
    if (!vaultDir) {
        throw new Error('Vault directory not initialized');
    }

    try {
        const categoryDir = await vaultDir.getDirectoryHandle(item.category);
        const encryptedFileName = `${item.fileName}.encrypted`;
        const fileHandle = await categoryDir.getFileHandle(encryptedFileName);
        const file = await fileHandle.getFile();
        const encryptedData = await file.text();
        
        return decryptData(encryptedData, password);
    } catch (err) {
        throw new Error('Failed to read file from vault');
    }
};

// Store vault items metadata
export const saveVaultItems = async (items: StoredVaultItem[]) => {
    await localforage.setItem('vault_items', items);
};

export const getVaultItems = async (): Promise<StoredVaultItem[]> => {
    const items = await localforage.getItem<StoredVaultItem[]>('vault_items');
    return items || [];
};

export const lockVault = async () => {
    const state: VaultState = {
        isLocked: true,
        lastModified: Date.now()
    };
    await localforage.setItem('vault_state', state);
};

export const unlockVault = async () => {
    const state: VaultState = {
        isLocked: false,
        lastModified: Date.now()
    };
    await localforage.setItem('vault_state', state);
};

export const getVaultState = async (): Promise<VaultState> => {
    const state = await localforage.getItem<VaultState>('vault_state');
    return state || { isLocked: true, lastModified: Date.now() };
};

export const exportVaultData = (items: StoredVaultItem[]) => {
    const exportData = {
        items,
        exportDate: new Date().toISOString()
    };
    return JSON.stringify(exportData);
};

export const importVaultData = (jsonData: string): StoredVaultItem[] => {
    try {
        const parsedData = JSON.parse(jsonData);
        if (!parsedData?.items || !Array.isArray(parsedData.items)) {
            throw new Error('Invalid import data format');
        }
        
        const validItems = parsedData.items.every((item: StoredVaultItem) => 
            item.id && 
            item.encryptedData && 
            item.category &&
            item.type && 
            item.createdAt
        );

        if (!validItems) {
            throw new Error('Invalid item format in import data');
        }

        return parsedData.items;
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to import vault data';
        throw new Error(errorMessage);
    }
};
