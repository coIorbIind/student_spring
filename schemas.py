from pydantic import BaseModel


class QuestionSchema(BaseModel):
    id: int
    number: int
    text: str
    answers: dict

    class Config:
        orm_mode = True


class PutVotesSchema(BaseModel):
    answer: str
    votes: int
