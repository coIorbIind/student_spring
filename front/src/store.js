import { configureStore } from '@reduxjs/toolkit'
import questionReducer from './questionSlice'

export default configureStore({
    reducer: {
        questions: questionReducer
    },
})

