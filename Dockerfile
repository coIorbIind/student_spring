FROM python:3.10

WORKDIR /code

COPY requirements.txt /code/

RUN pip install -r requirements.txt

COPY . /code

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]