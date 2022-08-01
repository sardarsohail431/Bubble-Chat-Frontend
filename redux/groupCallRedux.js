import { createSlice } from '@reduxjs/toolkit';

const redux = createSlice({
  name: 'groupcall',
  initialState: {
    groupbusy: false,
    groupunanswered: false,
    groupvideoModal: false,
    groupvoiceModal: false,
    groupcalldetails: null,
    groupcallanswermodal: false,
    groupvoicecallanswermodal: false,
    groupvidcallmodal: false,
    groupvoicecallmodal: false,
    groupcallendmodal: false,
    groupvoicecallendmodal: false,
  },
  reducers: {
    changeGroupBusy: (state, action) => {
      state.groupbusy = action.payload;
    },
    changeGroupUnanswered: (state, action) => {
      state.groupunanswered = action.payload;
    },
    changeGroupVideoModal: (state, action) => {
      state.groupvideoModal = action.payload;
    },
    changeGroupVoiceModal: (state, action) => {
      state.groupvoiceModal = action.payload;
    },
    changeGroupCallDetails: (state, action) => {
      state.groupcalldetails = action.payload;
    },
    changeGroupCallAnswerModal: (state, action) => {
      state.groupcallanswermodal = action.payload;
    },
    changeGroupVoiceCallAnswerModal: (state, action) => {
      state.groupvoicecallanswermodal = action.payload;
    },
    changeGroupVoiceCallModal: (state, action) => {
      state.groupvoicecallmodal = action.payload;
    },
    changeGroupVidCallModal: (state, action) => {
      state.groupvidcallmodal = action.payload;
    },
    changeGroupCallEndModal: (state, action) => {
      state.groupcallendmodal = action.payload;
    },
    changeGroupVoiceCallEndModal: (state, action) => {
      state.groupvoicecallendmodal = action.payload;
    },
  },
});

export const {
  changeGroupBusy,
  changeGroupUnanswered,
  changeGroupOnline,
  changeGroupVideoModal,
  changeGroupVoiceModal,
  changeGroupCallDetails,
  changeGroupCallAnswerModal,
  changeGroupVoiceCallAnswerModal,
  changeGroupVidCallModal,
  changeGroupVoiceCallModal,
  changeGroupCallEndModal,
  changeGroupVoiceCallEndModal,
} = redux.actions;
export default redux.reducer;
