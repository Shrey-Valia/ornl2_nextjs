FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy server code + model assets
COPY web.py ./web.py
COPY scalerx_max.npy scalerx_min.npy ./
COPY models ./models

ENV PYTHONUNBUFFERED=1
ENV MODEL_DIR=/app/models

EXPOSE 8000

CMD ["uvicorn", "web:app", "--host", "0.0.0.0", "--port", "8000"]
