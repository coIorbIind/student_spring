from sqlalchemy import Column, Integer, String, JSON

from database import Base


class Question(Base):
    __tablename__ = 'question'

    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer, unique=True, index=True)
    text = Column(String, unique=True)
    answers = Column(JSON, default={})
