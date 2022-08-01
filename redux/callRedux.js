import { createSlice } from '@reduxjs/toolkit';

const reduxe = createSlice({
  name: 'call',
  initialState: {
    online: null,
    busy: false,
    declined: false,
    unanswered: false,
    videoModal: false,
    voiceModal: false,
    connectedUserDetails: null,
    callanswermodal: false,
    voicecallanswermodal: false,
    vidcallmodal: false,
    voicecallmodal: false,
    callendmodal: false,
    voicecallendmodal: false,
  },
  reducers: {
    changeOnline: (state, action) => {
      state.online = action.payload;
    },
    changeBusy: (state, action) => {
      state.busy = action.payload;
    },
    changeDeclined: (state, action) => {
      state.declined = action.payload;
    },
    changeUnanswered: (state, action) => {
      state.unanswered = action.payload;
    },
    changeVideoModal: (state, action) => {
      state.videoModal = action.payload;
    },
    changeVoiceModal: (state, action) => {
      state.voiceModal = action.payload;
    },
    changeConnectedUser: (state, action) => {
      state.connectedUserDetails = action.payload;
    },
    changeCallAnswerModal: (state, action) => {
      state.callanswermodal = action.payload;
    },
    changeVoiceCallAnswerModal: (state, action) => {
      state.voicecallanswermodal = action.payload;
    },
    changeVoiceCallModal: (state, action) => {
      state.voicecallmodal = action.payload;
    },
    changeVidCallModal: (state, action) => {
      state.vidcallmodal = action.payload;
    },
    changeCallEndModal: (state, action) => {
      state.callendmodal = action.payload;
    },
    changeVoiceCallEndModal: (state, action) => {
      state.voicecallendmodal = action.payload;
    },
  },
});

export const {
  changeBusy,
  changeDeclined,
  changeUnanswered,
  changeOnline,
  changeVideoModal,
  changeVoiceModal,
  changeConnectedUser,
  changeCallAnswerModal,
  changeVoiceCallAnswerModal,
  changeVidCallModal,
  changeVoiceCallModal,
  changeCallEndModal,
  changeVoiceCallEndModal,
} = reduxe.actions;
export default reduxe.reducer;
