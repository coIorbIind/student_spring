FROM python:3.10

WORKDIR /code

COPY requirements.txt /code/

RUN pip install -r requirements.txt

COPY . /code

RUN npm install
RUN cd front && npm run build
RUN cd ..

CMD ["hypercorn", "main:app", "--bind", "0.0.0.0:8000", "--reload"]