from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from models import Question


def get_all_questions(db: Session) -> list[Question]:
    return db.query(Question).all()


def get_question_by_number(db: Session, question_number: int) -> Question | None:
    return db.query(Question).filter(Question.number == question_number).first()


def add_votes(db: Session, question_number: int, answer: str, votes: int = 0) -> Question:
    item = db.query(Question).filter(Question.number == question_number).first()
    if item:
        # answers = item.answers
        # answers[answer] += votes
        item.answers[answer] += votes
        print(item.answers)
        flag_modified(item, 'answers')
        db.add(item)
        db.commit()
        db.refresh(item)
    return item
