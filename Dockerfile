FROM python:3.10

WORKDIR /code

COPY requirements.txt /code/

RUN pip install -r requirements.txt
RUN apt-get install curl
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash
RUN apt-get install nodejs

COPY . /code

RUN cd ./front && npm install && npm run build

CMD ["hypercorn", "main:app", "--bind", "0.0.0.0:8000", "--reload"]