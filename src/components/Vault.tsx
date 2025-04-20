import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Typography, Container, Alert, Select, MenuItem, FormControl, InputLabel, Tab, Tabs, CircularProgress, Paper, IconButton, Tooltip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LockOutlined, 
    LockOpenOutlined, 
    TextFields, 
    Upload, 
    Folder, 
    Category, 
    Download, 
    ArrowDownward, 
    Security, 
    Delete,
    Visibility,
    VisibilityOff
} from '@mui/icons-material';
import { encryptData, decryptData, validatePassword } from '../utils/encryption';
import { 
    StoredVaultItem, 
    saveVaultItems, 
    getVaultItems, 
    exportVaultData, 
    importVaultData, 
    lockVault, 
    unlockVault, 
    getVaultState,
    initializeVaultDirectory,
    saveFileToVault,
    readFileFromVault
} from '../utils/storage';
import { SetupWizard } from './SetupWizard';
import zxcvbn from 'zxcvbn';
import { saveAs } from 'file-saver';

const MotionContainer = motion(Paper);
const MotionBox = motion(Box);

export const Vault: React.FC = () => {
    // Add new state for initialization
    const [initialized, setInitialized] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [inputData, setInputData] = useState('');
    const [vaultItems, setVaultItems] = useState<StoredVaultItem[]>([]);
    const [error, setError] = useState('');
    const [category, setCategory] = useState('general');
    const [decryptedView, setDecryptedView] = useState<{[key: string]: string}>({});
    const [selectedTab, setSelectedTab] = useState('text');
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [isLocked, setIsLocked] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [vaultReady, setVaultReady] = useState(false);

    useEffect(() => {
        initializeVault();
    }, []);

    useEffect(() => {
        const result = zxcvbn(password);
        setPasswordStrength(result.score);
    }, [password]);

    const initializeVault = async () => {
        try {
            setIsInitializing(true);
            // First check if vault directory is already selected
            const state = await getVaultState();
            
            if (!state.vaultDirectoryHandle) {
                // Ask user to select vault directory
                await initializeVaultDirectory();
            }
            
            setVaultReady(true);
            await loadVaultItems();
            await checkVaultState();
        } catch (err) {
            setError('Failed to initialize vault directory. Please try again.');
            setVaultReady(false);
        } finally {
            setIsInitializing(false);
        }
    };

    const checkVaultState = async () => {
        try {
            const state = await getVaultState();
            setInitialized(state.isInitialized);
            if (state.isInitialized) {
                await loadVaultItems();
                const categories = await getCategories();
                setCategory(categories[0]?.toLowerCase() || 'general');
            }
        } catch (err) {
            setError('Failed to check vault initialization');
        } finally {
            setLoading(false);
        }
    };

    const handleSetupComplete = async (config: VaultConfig) => {
        try {
            setLoading(true);
            await initializeVault(config);
            setInitialized(true);
            setCategory(config.categories[0]?.toLowerCase() || 'general');
        } catch (err) {
            setError('Failed to initialize vault');
        } finally {
            setLoading(false);
        }
    };

    const loadVaultItems = async () => {
        try {
            const items = await getVaultItems();
            setVaultItems(items);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load vault items';
            setError(errorMessage);
        }
    };

    const validatePasswords = () => {
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        if (!validatePassword(password)) {
            setError('Password must be 10 characters long and contain letters, numbers, and special symbols');
            return false;
        }
        return true;
    };

    const handleLockVault = async () => {
        try {
            await lockVault();
            setIsLocked(true);
            setPassword('');
            setConfirmPassword('');
            setDecryptedView({});
            setError('');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to lock vault';
            setError(errorMessage);
        }
    };

    const handleUnlockVault = async () => {
        try {
            if (!validatePasswords()) {
                return;
            }
            await unlockVault();
            setIsLocked(false);
            setError('');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to unlock vault';
            setError(errorMessage);
        }
    };

    const handleAddItem = async () => {
        try {
            if (!validatePasswords()) {
                return;
            }
            if (!inputData) {
                setError('Please enter data to encrypt');
                return;
            }

            const encryptedData = encryptData(inputData, password);
            const newItem: StoredVaultItem = {
                id: Date.now().toString(),
                encryptedData,
                category,
                type: 'text',
                createdAt: Date.now()
            };

            const updatedItems = [...vaultItems, newItem];
            await saveVaultItems(updatedItems);
            setVaultItems(updatedItems);
            setInputData('');
            setError('');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Encryption failed. Please check your password.';
            setError(errorMessage);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setSelectedFiles(Array.from(event.target.files));
        }
    };

    const handleUploadFiles = async () => {
        if (!validatePasswords()) {
            return;
        }

        try {
            setLoading(true);
            const newItems: StoredVaultItem[] = [];

            for (const file of selectedFiles) {
                const item = await saveFileToVault(file, password, category);
                newItems.push(item);
            }

            const updatedItems = [...vaultItems, ...newItems];
            await saveVaultItems(updatedItems);
            setVaultItems(updatedItems);
            setSelectedFiles([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            setError('');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'File encryption failed';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDecrypt = async (id: string, encryptedData: string) => {
        if (isLocked) {
            setError('Please unlock the vault first');
            return;
        }

        try {
            const item = vaultItems.find(item => item.id === id);
            if (!item) {
                throw new Error('Item not found');
            }

            let decrypted: string;
            if (item.type === 'file') {
                decrypted = await readFileFromVault(item, password);
            } else {
                decrypted = decryptData(encryptedData, password);
            }

            setDecryptedView(prev => ({
                ...prev,
                [id]: decrypted
            }));
            setError('');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Decryption failed. Please check your password.';
            setError(errorMessage);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const updatedItems = vaultItems.filter(item => item.id !== id);
            await saveVaultItems(updatedItems);
            setVaultItems(updatedItems);
            setDecryptedView(prev => {
                const newView = { ...prev };
                delete newView[id];
                return newView;
            });
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete item';
            setError(errorMessage);
        }
    };

    const handleExport = () => {
        try {
            const exportData = exportVaultData(vaultItems);
            const blob = new Blob([exportData], { type: 'application/json' });
            saveAs(blob, 'vault-backup.json');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Export failed';
            setError(errorMessage);
        }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const jsonData = e.target?.result as string;
                const importedItems = importVaultData(jsonData);
                await saveVaultItems(importedItems);
                setVaultItems(importedItems);
            };
            reader.readAsText(file);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Import failed';
            setError(errorMessage);
        }
    };

    const getPasswordStrengthColor = () => {
        const colors = ['#ff0000', '#ff4500', '#ffa500', '#9acd32', '#008000'];
        return colors[passwordStrength];
    };

    const sortedVaultItems = [...vaultItems].sort((a, b) => b.createdAt - a.createdAt);

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { 
                type: "spring",
                stiffness: 260,
                damping: 20
            }
        },
        exit: { 
            opacity: 0,
            y: -20,
            transition: { duration: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { 
            opacity: 1, 
            x: 0,
            transition: { duration: 0.3 }
        }
    };

    // Show loading state
    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Container>
        );
    }

    // Show setup wizard if vault is not initialized
    if (!initialized) {
        return <SetupWizard onComplete={handleSetupComplete} />;
    }

    return (
        <Container maxWidth="sm">
            {isInitializing ? (
                <CircularProgress />
            ) : !vaultReady ? (
                <Button
                    fullWidth
                    variant="contained"
                    onClick={initializeVault}
                    startIcon={<Folder />}
                >
                    Select Vault Directory
                </Button>
            ) : (
                <MotionContainer
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={containerVariants}
                    sx={{ 
                        p: 4, 
                        mt: 4,
                        backdropFilter: 'blur(10px)',
                        background: 'rgba(31, 41, 55, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
                    }}
                >
                    <Typography 
                        variant="h4" 
                        component="h1" 
                        gutterBottom 
                        sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: 2,
                            mb: 4
                        }}
                    >
                        <Security sx={{ fontSize: 40 }} />
                        Secure Vault
                        {isLocked ? 
                            <LockOutlined color="error" sx={{ ml: 'auto' }} /> : 
                            <LockOpenOutlined color="success" sx={{ ml: 'auto' }} />
                        }
                    </Typography>

                    {error && (
                        <Alert 
                            severity="error" 
                            sx={{ 
                                mb: 2,
                                animation: 'shake 0.5s ease-in-out',
                                '@keyframes shake': {
                                    '0%, 100%': { transform: 'translateX(0)' },
                                    '25%': { transform: 'translateX(-10px)' },
                                    '75%': { transform: 'translateX(10px)' }
                                }
                            }}
                        >
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ mb: 2 }}>
                        <TextField
                            fullWidth
                            type="password"
                            label="Password (10+ chars, include letters, numbers, symbols)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            margin="normal"
                            disabled={!isLocked && vaultItems.length > 0}
                            // @ts-ignore deprecated but still functional
                            InputProps={{
                                startAdornment: <Security sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                        />
                        <TextField
                            fullWidth
                            type="password"
                            label="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            margin="normal"
                            disabled={!isLocked && vaultItems.length > 0}
                            // @ts-ignore deprecated but still functional
                            InputProps={{
                                startAdornment: <Security sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                        />
                        <MotionBox
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.5 }}
                            sx={{ mt: 1, height: 4, bgcolor: '#eee', transformOrigin: 'left' }}
                        >
                            <Box
                                sx={{
                                    height: '100%',
                                    width: `${(passwordStrength + 1) * 20}%`,
                                    bgcolor: getPasswordStrengthColor(),
                                    transition: 'all 0.3s'
                                }}
                            />
                        </MotionBox>
                    </Box>

                    {isLocked ? (
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleUnlockVault}
                            sx={{ mt: 2 }}
                            disabled={!password || !confirmPassword}
                            startIcon={<LockOpenOutlined />}
                        >
                            Unlock Vault
                        </Button>
                    ) : (
                        <AnimatePresence>
                            <MotionContainer
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                sx={{ mt: 3 }}
                            >
                                <Tabs 
                                    value={selectedTab} 
                                    onChange={(_, value) => setSelectedTab(value)} 
                                    sx={{ mb: 2 }}
                                    variant="fullWidth"
                                >
                                    <Tab icon={<TextFields />} label="Text" value="text" />
                                    <Tab icon={<Upload />} label="File" value="file" />
                                </Tabs>

                                {selectedTab === 'text' ? (
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={4}
                                        label="Enter data to encrypt"
                                        value={inputData}
                                        onChange={(e) => setInputData(e.target.value)}
                                        margin="normal"
                                        sx={{ 
                                            '& .MuiOutlinedInput-root': {
                                                background: 'rgba(0, 0, 0, 0.1)'
                                            }
                                        }}
                                    />
                                ) : (
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Button
                                            variant="outlined"
                                            component="label"
                                            fullWidth
                                            sx={{ 
                                                mt: 2,
                                                height: 100,
                                                border: '2px dashed',
                                                borderColor: 'primary.main',
                                                '&:hover': {
                                                    borderColor: 'primary.light'
                                                }
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <Upload sx={{ fontSize: 40, mb: 1 }} />
                                                Select Files
                                            </Box>
                                            <input
                                                type="file"
                                                hidden
                                                multiple
                                                onChange={handleFileSelect}
                                                ref={fileInputRef}
                                            />
                                        </Button>
                                        {selectedFiles.length > 0 && (
                                            <Typography variant="body2" sx={{ mt: 1 }}>
                                                {selectedFiles.length} file(s) selected
                                            </Typography>
                                        )}
                                    </Box>
                                )}

                                <FormControl fullWidth sx={{ mt: 2 }}>
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        value={category}
                                        label="Category"
                                        onChange={(e) => setCategory(e.target.value)}
                                        startAdornment={<Category sx={{ mr: 1, color: 'text.secondary' }} />}
                                    >
                                        <MenuItem value="general">📄 General</MenuItem>
                                        <MenuItem value="personal">👤 Personal</MenuItem>
                                        <MenuItem value="work">💼 Work</MenuItem>
                                        <MenuItem value="financial">💰 Financial</MenuItem>
                                    </Select>
                                </FormControl>

                                {selectedTab === 'text' ? (
                                    <Button 
                                        fullWidth 
                                        variant="contained" 
                                        onClick={handleAddItem}
                                        sx={{ mt: 2 }}
                                        disabled={!inputData}
                                        startIcon={<ArrowDownward />}
                                    >
                                        Add to Vault
                                    </Button>
                                ) : (
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        onClick={handleUploadFiles}
                                        sx={{ mt: 2 }}
                                        disabled={selectedFiles.length === 0}
                                        startIcon={<Upload />}
                                    >
                                        Upload Files
                                    </Button>
                                )}

                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="secondary"
                                    onClick={handleLockVault}
                                    sx={{ mt: 2 }}
                                    startIcon={<LockOutlined />}
                                >
                                    Lock Vault
                                </Button>

                                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={handleExport}
                                        sx={{ flex: 1 }}
                                        startIcon={<Download />}
                                    >
                                        Export Vault
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        sx={{ flex: 1 }}
                                        startIcon={<Folder />}
                                    >
                                        Import Vault
                                        <input
                                            type="file"
                                            hidden
                                            accept=".json"
                                            onChange={handleImport}
                                        />
                                    </Button>
                                </Box>
                            </MotionContainer>
                        </AnimatePresence>
                    )}

                    {!isLocked && (
                        <Box sx={{ mt: 4 }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Folder /> Vault Contents
                            </Typography>
                            {loading && <CircularProgress />}
                            <AnimatePresence>
                                {sortedVaultItems.map((item, index) => (
                                    <MotionContainer
                                        key={item.id}
                                        variants={itemVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="hidden"
                                        transition={{ delay: index * 0.1 }}
                                        sx={{ 
                                            mb: 2, 
                                            p: 2,
                                            background: 'rgba(0, 0, 0, 0.2)',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)'
                                        }}
                                    >
                                        <Typography variant="caption" display="block" gutterBottom>
                                            {getItemIcon(item.category)} {item.category}
                                        </Typography>
                                        {item.fileName && (
                                            <Typography variant="caption" display="block" gutterBottom>
                                                📎 {item.fileName}
                                            </Typography>
                                        )}
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            {decryptedView[item.id] 
                                                ? item.type === 'file' 
                                                    ? <Button startIcon={<Download />} href={decryptedView[item.id]} download={item.fileName}>
                                                        Download File
                                                    </Button>
                                                    : decryptedView[item.id]
                                                : '***** Encrypted *****'}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDecrypt(item.id, item.encryptedData)}
                                                color={decryptedView[item.id] ? 'success' : 'primary'}
                                            >
                                                {decryptedView[item.id] ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDelete(item.id)}
                                                >
                                                    <Delete />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </MotionContainer>
                                ))}
                            </AnimatePresence>
                        </Box>
                    )}
                </MotionContainer>
            )}
        </Container>
    );
};

const getItemIcon = (category: string) => {
    switch (category) {
        case 'personal': return '👤';
        case 'work': return '💼';
        case 'financial': return '💰';
        default: return '📄';
    }
};