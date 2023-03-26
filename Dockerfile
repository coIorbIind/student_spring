FROM python:3.10

WORKDIR /code

COPY requirements.txt /code/

RUN pip install -r requirements.txt

COPY . /code

RUN npm install
RUN cd front && npm run build
RUN cd ..

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]