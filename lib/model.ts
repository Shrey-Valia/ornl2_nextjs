
export type ModelInput = {
    M: number;
    S: number;
    I: number;
    temp: number;
    time: number;
    Reaction: number;
};

export type ModelOutput = {
    molarRatio: number;
    flowRate: number;
    temperature: number;
    pressure: number;
    e: number;
    confidence: number;
};

export async function getModelPrediction(input: ModelInput): Promise<ModelOutput> {
    try {
        const response = await fetch('http://localhost:8000/predict', {
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
        const [molarRatio, flowRate, temperature, pressure, e] = data.m_output;
        const [confidence] = data.x_output;
        return {
            molarRatio,
            flowRate,
            temperature,
            pressure,
            e,
            confidence,
        };
    } catch (error) {
        console.error('Error during model prediction:', error);
        throw new Error('Internal server error during model prediction');
    }
}