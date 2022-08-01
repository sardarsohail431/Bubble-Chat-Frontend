import { createSlice } from '@reduxjs/toolkit';

const reduxii = createSlice({
  name: 'conv',
  initialState: {
    currConv: null,
    userNow: null,
    updateConv:false
  },
  reducers: {
    changeConv: (state, action) => {
      state.currConv = action.payload;
    },
    changeUser: (state, action) => {
      state.userNow = action.payload;
    },
    changeUpdate:(state,action)=>{
      state.updateConv = action.payload;
    }
  },
});

export const { changeConv, changeUser,changeUpdate } = reduxii.actions;
export default reduxii.reducer;
