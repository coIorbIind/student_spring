import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const questionsSlice = createSlice({
    name: 'questions',
    initialState: {
      loading: false,
      questions: [],
      error: ''
    },
    extraReducers: (builder) => {
      builder.addCase(fetchQuestions.pending, (state) => {
        state.loading = true
      })
      builder.addCase(fetchQuestions.fulfilled, (state, action) => {
        state.loading = false,
        state.questions = action.payload,
        state.error = ''
      })
      builder.addCase(fetchQuestions.rejected , (state, action) => {
        state.loading = false,
        state.questions = [],
        state.error = action.error.message
      })
    }
  })

export const fetchQuestions = createAsyncThunk('questions/fetchQuestions', () => {
  return fetch('http://194.67.108.107:8000/get_questions')
    .then(response => response.json())
    .then(data => data.sort((a,b) => a.number - b.number))
    .then(data => {
      return data
    })
})

export default questionsSlice.reducer