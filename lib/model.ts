
export type ModelInput = {
    M: number;
    S: number;
    I: number;
    temp: number;
    time: number;
    Reaction: number;
    model_type?: 'pcinn' | 'nn';
};

export type ModelOutput = {
    conversion: number;
    mn: number;
    mw: number;
    mz: number;
    mzPlus1: number;
    mv: number;
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
        const [mn, mw, mz, mzPlus1, mv] = payload.m_output;
        const [conversion] = payload.x_output;
        return {
            conversion,
            mn,
            mw,
            mz,
            mzPlus1,
            mv,
        };
    } catch (error) {
        console.error('Error during model prediction:', error);
        throw new Error('Internal server error during model prediction');
    }
}
