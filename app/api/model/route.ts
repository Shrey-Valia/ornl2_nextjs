import path from "path";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { M, S, I, temp, time, Reaction } = body;

        console.log('Received model prediction request with inputs:', body);

        // Validate required inputs
        if (S === undefined || I === undefined || temp === undefined || time === undefined || Reaction === undefined) {
            return Response.json(
                { success: false, message: 'Missing required input parameters (S, I, temp, time, Reaction)' },
                { status: 400 }
            );
        }

        // Call FastAPI backend
        const fastApiResponse = await fetch(`${FASTAPI_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                M: M || 0,
                S,
                I,
                temp,
                time,
                Reaction,
            }),
        });

        if (!fastApiResponse.ok) {
            const errorData = await fastApiResponse.text();
            console.error('FastAPI error response:', errorData);
            return Response.json(
                { success: false, message: `FastAPI request failed: ${fastApiResponse.statusText}` },
                { status: fastApiResponse.status }
            );
        }

        const result = await fastApiResponse.json();

        console.log('Model prediction result:', result);

        return Response.json(
            {
                success: true,
                outputs: {
                    x_output: result.x_output,
                    m_output: result.m_output,
                },
                input: result.input,
                message: 'Prediction successful',
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Model prediction error:', error);
        return Response.json(
            { success: false, message: 'Prediction failed', error: String(error) },
            { status: 500 }
        );
    }
}
