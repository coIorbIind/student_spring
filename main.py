from typing import Iterator

from fastapi import Depends, FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from psycopg2.errors import UniqueViolation
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import crud, models, schemas
from database import SessionLocal, engine


app = FastAPI()

app.mount('/static', StaticFiles(directory='./front/assets/'), name='static')


templates = Jinja2Templates(directory='./front/dist/')


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)


manager = ConnectionManager()


origins = ['*']

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.on_event('startup')
async def startup_event():
    models.Base.metadata.create_all(bind=engine)
    db = next(get_db())
    questions = [
        models.Question(
            number=1,
            text='Кто пойдет к королеве?',
            answers={'Вероника': 0, 'Макс': 0, 'Джес': 0}
        ),
        models.Question(
            number=2,
            text='Куда пойдет Максим?',
            answers={'В общагу на тусовку': 0, 'На подработку в кафе': 0, 'На лекцию': 0}
        ),
        models.Question(
            number=3,
            text='Как поступить с Джес?',
            answers={'Попытаться стереть': 0, 'Попытаться договориться': 0, 'Попытаться починить': 0}
        )
    ]
    try:
        db.add_all(questions)
        db.commit()
    except (UniqueViolation, IntegrityError):
        pass


# Dependency
def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get('/get_questions', response_model=list[schemas.QuestionSchema])
def get_questions(db: Session = Depends(get_db)):
    return crud.get_all_questions(db)


@app.get('/get_question/{question_number}', response_model=schemas.QuestionSchema)
def get_question(question_number: int, db: Session = Depends(get_db)):
    question = crud.get_question_by_number(db, question_number)
    if not question:
        raise HTTPException(status_code=404, detail='Question not found')
    return question


@app.get('/get_votes/{question_number}')
def get_votes(question_number: int, db: Session = Depends(get_db)):
    question = crud.get_question_by_number(db, question_number)
    if not question:
        raise HTTPException(status_code=404, detail='Question not found')
    return question.answers


@app.put('/get_votes/{question_number}')
def add_votes(question_number: int, data: schemas.PutVotesSchema, db: Session = Depends(get_db)):
    question = crud.add_votes(db=db, question_number=question_number, answer=data.answer, votes=data.votes)
    if not question:
        raise HTTPException(status_code=404, detail='Question not found')
    return question.answers


@app.websocket('/update_votes')
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive()
            await manager.broadcast('hook')
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.get('/', response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse('index.html', {'request': request})


@app.get('/questions_page', response_class=HTMLResponse)
async def questions_page(request: Request):
    return templates.TemplateResponse('questions.html', {'request': request})
