import React, { useState } from 'react';
import { Box, Button, TextField, Container, Typography, Paper, Stepper, Step, StepLabel, Chip, Stack } from '@mui/material';
import { motion } from 'framer-motion';
import { Security, Folder, Category } from '@mui/icons-material';
import { initializeVaultDirectory } from '../utils/storage';

const MotionPaper = motion(Paper);

interface SetupWizardProps {
    onComplete: (config: VaultConfig) => void;
}

export interface VaultConfig {
    categories: string[];
    vaultPath: string;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [categories, setCategories] = useState<string[]>(['General', 'Personal', 'Work', 'Financial']);
    const [newCategory, setNewCategory] = useState('');
    const [error, setError] = useState('');

    const handleNext = async () => {
        if (activeStep === 0) {
            if (categories.length === 0) {
                setError('Please add at least one category');
                return;
            }
            setActiveStep(1);
        } else if (activeStep === 1) {
            try {
                const dirHandle = await initializeVaultDirectory();
                if (dirHandle) {
                    onComplete({
                        categories,
                        vaultPath: 'vault'
                    });
                }
            } catch (err) {
                setError('Failed to set up vault directory. Please try again.');
            }
        }
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    const handleAddCategory = () => {
        if (newCategory && !categories.includes(newCategory)) {
            setCategories([...categories, newCategory]);
            setNewCategory('');
        }
    };

    const handleRemoveCategory = (category: string) => {
        setCategories(categories.filter(c => c !== category));
    };

    const steps = ['Set Categories', 'Choose Vault Location'];

    return (
        <Container maxWidth="sm">
            <MotionPaper
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                sx={{ 
                    p: 4, 
                    mt: 4,
                    background: 'rgba(31, 41, 55, 0.8)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
            >
                <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Security /> Vault Setup
                </Typography>

                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {activeStep === 0 ? (
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Category /> Categories
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                            <TextField
                                fullWidth
                                label="Add Category"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                                sx={{ mb: 2 }}
                            />
                            <Button
                                variant="outlined"
                                onClick={handleAddCategory}
                                disabled={!newCategory}
                            >
                                Add Category
                            </Button>
                        </Box>

                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 3, gap: 1 }}>
                            {categories.map((category) => (
                                <Chip
                                    key={category}
                                    label={category}
                                    onDelete={() => handleRemoveCategory(category)}
                                    color="primary"
                                />
                            ))}
                        </Stack>
                    </Box>
                ) : (
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Folder /> Vault Location
                        </Typography>
                        
                        <Typography variant="body1" sx={{ mb: 3 }}>
                            Choose where to store your encrypted files. This location should be:
                            <ul>
                                <li>Secure and private</li>
                                <li>Regularly backed up</li>
                                <li>Accessible only to you</li>
                            </ul>
                        </Typography>
                    </Box>
                )}

                {error && (
                    <Typography color="error" sx={{ mt: 2 }}>
                        {error}
                    </Typography>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                    <Button
                        onClick={handleBack}
                        disabled={activeStep === 0}
                    >
                        Back
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleNext}
                    >
                        {activeStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
                    </Button>
                </Box>
            </MotionPaper>
        </Container>
    );
};