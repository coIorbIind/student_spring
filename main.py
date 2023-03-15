from typing import Iterator

from fastapi import Depends, FastAPI, HTTPException
from psycopg2.errors import UniqueViolation
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import crud, models, schemas
from database import SessionLocal, engine


app = FastAPI()


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
def get_votes(question_id: int, db: Session = Depends(get_db)):
    question = crud.get_question_by_number(db, question_id)
    if not question:
        raise HTTPException(status_code=404, detail='Question not found')
    return question.answers


@app.put('/get_votes/{question_number}')
def add_votes(question_number: int, data: schemas.PutVotesSchema, db: Session = Depends(get_db)):
    question = crud.add_votes(db=db, question_number=question_number, answer=data.answer, votes=data.votes)
    if not question:
        raise HTTPException(status_code=404, detail='Question not found')
    return question.answers
