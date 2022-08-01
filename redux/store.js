import { configureStore, combineReducers } from '@reduxjs/toolkit';
import userRedux from './userRedux';
import convRedux from './convRedux';
import callRedux from './callRedux';
import groupCallRedux from './groupCallRedux';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

const persistConfig = {
  key: 'root',
  blacklist: ['call', 'groupcall'],
  version: 1,
  storage,
};

const rootReducer = combineReducers({
  user: userRedux,
  conv: convRedux,
  call: callRedux,
  groupcall:groupCallRedux
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export let persistor = persistStore(store);
