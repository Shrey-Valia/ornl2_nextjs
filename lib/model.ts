export type ModelInput = {
    M: number;      // Monomer concentration (mol/L)
    S: number;      // Solvent concentration (mol/L)
    I: number;      // Initiator concentration (mol/L)
    temp: number;   // Temperature (K)
    time: number;   // Reaction time (seconds)
    Reaction: number; // Reaction identifier
    model_type?: 'pcinn' | 'nn';
};

export type MolecularWeights = {
    Mn: number;       // Number average MW (g/mol)
    Mw: number;       // Weight average MW (g/mol)
    Mz: number;       // Z-average MW (g/mol)
    Mz_plus1: number; // Z+1 average MW (g/mol)
    Mv: number;       // Viscosity average MW (g/mol)
    PDI: number;      // Polydispersity index (Mw/Mn)
};

export type ModelOutput = {
    conversion: number;           // X (0-1, fraction converted)
    molecularWeights: MolecularWeights;
    // Raw outputs (for advanced users)
    x_output: number[];           // Raw conversion output
    m_output: number[];           // Raw MW outputs (log10 scale)
    // Legacy fields (for backward compatibility with existing UI)
    molarRatio: number;
    flowRate: number;
    temperature: number;
    pressure: number;
    e: number;
    confidence: number;
    // Metadata
    warnings: string[];
    scalersUsed: boolean;
};

export async function getModelPrediction(input: ModelInput): Promise<ModelOutput> {
    try {
        const response = await fetch('/api/model', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(input),
        });

        if (!response.ok) {
            throw new Error(`Model prediction failed: ${response.statusText}`);
        }

        const data = await response.json();
        const payload = data.outputs ?? data;
        const [conversion] = payload.x_output;
        const m = payload.m_output;

        // Convert log10 MW outputs to actual MW values
        const molecularWeights: MolecularWeights = {
            Mn: Math.pow(10, m[0]),
            Mw: Math.pow(10, m[1]),
            Mz: Math.pow(10, m[2]),
            Mz_plus1: Math.pow(10, m[3]),
            Mv: Math.pow(10, m[4]),
            PDI: Math.pow(10, m[1]) / Math.pow(10, m[0]),
        };

        return {
            conversion,
            molecularWeights,
            x_output: payload.x_output,
            m_output: m,
            // Legacy mapping (approximate mapping for existing UI)
            molarRatio: molecularWeights.Mn,
            flowRate: molecularWeights.Mw,
            temperature: molecularWeights.Mz,
            pressure: molecularWeights.PDI,
            e: molecularWeights.Mv,
            confidence: conversion,
            warnings: data.warnings || [],
            scalersUsed: data.scalers_used ?? true,
        };
    } catch (error) {
        console.error('Error during model prediction:', error);
        throw new Error('Internal server error during model prediction');
    }
}
