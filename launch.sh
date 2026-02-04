source app/api/model/model_container/.venv/bin/activate
pip3 install torch fastapi pydantic uvicorn
python3 app/api/model/model_container/web.py
deactivate
cd ../../../../