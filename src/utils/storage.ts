import localforage from 'localforage';

export interface StoredVaultItem {
    id: string;
    encryptedData: string;
    category: string;
    fileName?: string;
    type: 'text' | 'file';
    createdAt: number;
}

interface ImportedItem {
    id: string;
    encryptedData: string;
    category: string;
    fileName?: string;
    type: 'text' | 'file';
    createdAt: number;
}

interface VaultState {
    isLocked: boolean;
    lastModified: number;
}

localforage.config({
    name: 'secure-vault',
    storeName: 'vault_store'
});

export const VAULT_FOLDER = 'src/vault-storage';

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
        
        // Validate the structure of imported items
        const validItems = parsedData.items.every((item: ImportedItem) => 
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
