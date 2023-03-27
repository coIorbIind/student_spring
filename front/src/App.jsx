import { useState, useEffect, useRef, useCallback, version } from "react";
import { useSelector, useDispatch } from 'react-redux'
import { fetchQuestions } from './questionSlice'
import useWebSocket from 'react-use-websocket';
import "../public/css/normalize.css";
import "../public/css/style.css";

// TODO:
// 1) Добавить проверку, что чел выбрал за кого голосовать
// 2) Навести красоту на мобильных устройствах

let App = () => {
  if (!localStorage.getItem('sofa_questions')) {
		localStorage.setItem('sofa_questions', 0);
	}

  let cntAnsweredQuestionsFromStorage = parseInt(localStorage.getItem('sofa_questions'))

  const [cntAnsweredQuestions, setCntAnsweredQuestions] = useState(cntAnsweredQuestionsFromStorage)
  const [isShowPreview, setIsShowPreview] = useState(true)

  const questions = useSelector((state) => state.questions.questions)
  const dispatch = useDispatch()

  const { sendMessage, lastMessage } = useWebSocket('ws://194.67.108.107:8000/update_votes', {
    onOpen: (e) => console.log('Socket stream opened', e),
    onClose: (e) => console.log('Socket stream closed', e),
    shouldReconnect: (closeEvent) => true,
    onMessage: (e) => {
      console.log('soket recive data');
      dispatch(fetchQuestions())
    }
  });

  useEffect(() => {
    dispatch(fetchQuestions())
  }, [lastMessage])

  let handleClickSendMessage = () => {
    sendMessage()
  }

  let questionsPages = [];
  for(let i = 0; i < questions.length; i++) { //questions.length
    questionsPages.push(
      <QuestionPage
        key={questions[i]['id']} 
        num={questions[i]['number']}
        title={questions[i]['text']}
        selects={questions[i]['answers']}
        cntAnswered={cntAnsweredQuestions} 
        updateStorageCnt={(cnt) => setCntAnsweredQuestions(cnt)}
        websoketHandler={() => handleClickSendMessage()}
      />
    )
  }

  return (
    <>
        {isShowPreview && <Preview onClickHendler={() => setIsShowPreview(false)}/>} 
        {!isShowPreview && questionsPages}
    </>
  );
}

let Preview = ({onClickHendler}) => {
  return (
    <div className="container preview_container">
      <p className="container__title-pink title-pink">S.OF.A.</p>
      <p className="container__title-blue title-blue">System OF Alive</p>
      <p className="container__text text">
          Добро пожаловать в System OF Alive! Или кратко: S.OF.A. Мир, где
          каждый может быть кем пожелает и волен в выборе. Но помните, за
          каждым действием кроются последствия. Настало ваше время
          выбирать…
      </p>
      <form action="questions_page">
          <button id="goBtn" className="container__btn btn" onClick={(e) => {e.preventDefault(); onClickHendler();}}>
              Начать вершить судьбы
          </button>
      </form>
    </div>
  )
} 

let QuestionPage = ({num, title, selects: propSelects, cntAnswered, updateStorageCnt, websoketHandler}) => {

  const [answer, setAnswer] = useState('');
  const [selects, setSelects] = useState(propSelects)
  const [isSelected, setIsSelected] = useState(true)
  const IS_ANSWERED = cntAnswered >= num
  const IS_VISIBLE = num - cntAnswered <= 1

  useEffect(() => {
    setSelects(propSelects)
  }, [propSelects])

  let handlePostAnswer = (e) => {
    e.preventDefault()

    if (answer == '') {
      setIsSelected(false)
      return
    }

    setIsSelected(true)

    // TODO: Вынести это в Redux
    fetch(`http://194.67.108.107:8000/get_votes/${num}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
          "answer": answer,
          "votes": 1
      })
    })
      .then(response => response.json())
      .then(data => setSelects(data))

    websoketHandler()

    localStorage.setItem('sofa_questions', cntAnswered + 1)
    updateStorageCnt(cntAnswered + 1)
    // setIsSelected(true)
  }

  let questions = []
  for (let select in selects) {
    questions.push(
      <Question 
        key={select}
        text={select}
        score={selects[select]}
        answer={answer}
        setAnswer={setAnswer}
        isAnswered={IS_ANSWERED}
      />
    )
  }

  if (!IS_VISIBLE) {
    return
  }

  return (
    <div className="container">
      <p className="container__quistion-title">{title}</p>
      <div>
          {questions}
      </div>

      {!isSelected && <div className="warningBlock">Вы не выбрали ответ</div>}
      {!IS_ANSWERED && <Btn onClickHandler={(e) => handlePostAnswer(e)}/>}
    </div>
  )
}

let Question = ({text, score, answer, setAnswer, isAnswered}) => {

  let handleSetAnswer = (text) => {
    if (isAnswered) {
      return
    }

    setAnswer(text)
  }

  return (
    <div className="question" onClick={() => handleSetAnswer(text)}> 
      {!isAnswered && <input 
        type="radio"
        className="checkbox custom-checkbox"
        name={text}
        value={text}
        checked={text == answer}
      />}
      <label className="checkbox-label" style={{ marginLeft: isAnswered ? '26.82px' : ''}}>{text}</label>
      <div className="score">{score}</div>
    </div>
  )
}

let Btn = ({onClickHandler}) => {
  return (
    <button id="quesionBtn_data.id_" className="container__vote-btn btn" onClick={(e) => onClickHandler(e)}>Проголосовать</button>
  )
}

export default App;
