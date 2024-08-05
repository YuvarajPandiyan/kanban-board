import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getLocalStorageDateByKey,
  setLocalStorage,
} from "../../../helper/localStorage";
import { LOCAL_STORAGE_BOARD_DATA_KEY } from "./kanbanBoardSlice";
import {
  getBasicData,
  KanbanBoardData,
} from "../../../data/kanbanBoard/columnMap";

const RESOLVER_TIME_OUT = 400; // in ms

export const dataResolver = <T>(data: T): Promise<T> =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, RESOLVER_TIME_OUT);
  });

export const dataReject = <T>(data: T): Promise<T> =>
  new Promise((_, reject) => {
    setTimeout(() => {
      reject(data);
    }, RESOLVER_TIME_OUT);
  });

export const fetchBoardData = createAsyncThunk(
  "fetchBoardData",
  async (
    boardId: number
  ): Promise<{
    response: KanbanBoardData;
    boardId: number;
  }> => {
    const data: KanbanBoardData = getLocalStorageDateByKey(
      LOCAL_STORAGE_BOARD_DATA_KEY
    );

    if (Object.keys(data).length === 0) {
      const generatedData = getBasicData();
      setLocalStorage(LOCAL_STORAGE_BOARD_DATA_KEY, generatedData);
      const response = await dataResolver(generatedData);
      return { response, boardId };
    }

    const response = await dataResolver(data);
    return { response, boardId };
  }
);

export const updateBoardData = createAsyncThunk(
  "updateBoardData",
  async (
    payload: { boardId: number; kanbanBoardData: KanbanBoardData },
    { rejectWithValue }
  ) => {
    const { boardId, kanbanBoardData } = payload;
    try {
      if (Object.keys(kanbanBoardData).length > 0) {
        setLocalStorage(LOCAL_STORAGE_BOARD_DATA_KEY, kanbanBoardData);
        const response = await dataResolver(kanbanBoardData);
        return { response, boardId };
      }
    } catch (error) {
      throw rejectWithValue({ boardId, error: "Something went wrong" });
    }
  }
);
