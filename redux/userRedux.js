import { createSlice } from '@reduxjs/toolkit';

const reduxi = createSlice({
  name: 'user',
  initialState: {
    currUser: null,
  },
  reducers: {
    login: (state, action) => {
      state.currUser = action.payload;
    },
    logout: (state) => {
      state.currUser = null;
    },
  },
});

export const { login, logout } = reduxi.actions;
export default reduxi.reducer;
