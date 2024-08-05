import { createSelector, createSlice } from "@reduxjs/toolkit";
import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";

import {
  KanbanBoardData,
  Outcome,
  Trigger,
  COLUMN_IDS_RANDOM_ARRAY,
  COLUMN_NAMES_VS_COLUMN_ID_RANDOM,
} from "../../../data/kanbanBoard/columnMap";
import { RootState } from "../../store";
import { getRandomInt, Person } from "../../../data/kanbanBoard/person";
import { getPeople } from "../../../data/kanbanBoard/people";
import { fetchBoardData, updateBoardData } from "./kanbanBoardSliceApi";

const KANBAN_BOARD = "KANBAN_BOARD";
export const LOCAL_STORAGE_BOARD_DATA_KEY = "BOARD_DATA";

type KanbanBoardState = {
  kanbanBoardDataByBoardId: { [x: number]: KanbanBoardData };
};

type ReorderColumnActionType = {
  payload: {
    startIndex: number;
    finishIndex: number;
    trigger?: Trigger;
    boardId: number;
  };
};

type ReorderCardActionType = {
  payload: {
    columnId: string;
    startIndex: number;
    finishIndex: number;
    trigger?: Trigger;
    boardId: number;
  };
};

type MoveCardActionType = {
  payload: {
    boardId: number;
    startColumnId: string;
    finishColumnId: string;
    itemIndexInStartColumn: number;
    itemIndexInFinishColumn?: number;
    trigger?: "pointer" | "keyboard";
  };
};

type AddColumn = {
  payload: {
    boardId: number;
  };
};

type RemoveColumn = {
  payload: {
    columnId: string;
    userId: string;
    boardId: number;
  };
};

const initialState: KanbanBoardState = {
  kanbanBoardDataByBoardId: {},
};

export const kanbanBoardSlice = createSlice({
  name: KANBAN_BOARD,
  initialState,
  reducers: {
    initialize: (
      state,
      action: {
        payload: { boardDate: KanbanBoardData; boardId: number };
      }
    ) => {
      const { payload } = action;
      state.kanbanBoardDataByBoardId[payload.boardId] = payload.boardDate;
    },

    consoleState: (state) => {
      console.log({ state });
    },

    addColumn: (state, action: AddColumn) => {
      const { boardId } = action.payload;
      const kanbanBoardDataByBoardId = state.kanbanBoardDataByBoardId[boardId];
      const selectedColumn =
        COLUMN_IDS_RANDOM_ARRAY[
          getRandomInt(0, COLUMN_IDS_RANDOM_ARRAY.length - 1)
        ];
      if (kanbanBoardDataByBoardId.columnMap[selectedColumn]) {
        alert(`${selectedColumn} is already present`);
        return;
      }
      kanbanBoardDataByBoardId.columnMap[selectedColumn] = {
        title: COLUMN_NAMES_VS_COLUMN_ID_RANDOM[selectedColumn],
        columnId: selectedColumn,
        items: getPeople({ amount: 10 }),
      };
      kanbanBoardDataByBoardId.orderedColumnIds.push(selectedColumn);
    },

    removeCard: (state, action: RemoveColumn) => {
      const { columnId, userId, boardId } = action.payload;
      const kanbanBoardDataByBoardId = state.kanbanBoardDataByBoardId[boardId];

      const sourceColumn = kanbanBoardDataByBoardId.columnMap[columnId];
      sourceColumn.items = sourceColumn.items.filter(
        (item) => item.userId !== userId
      );
    },

    reorderColumn: (state, action: ReorderColumnActionType) => {
      const { boardId, startIndex, finishIndex, trigger } = action.payload;
      const kanbanBoardDataByBoardId = state.kanbanBoardDataByBoardId[boardId];
      const outcome: Outcome = {
        type: "column-reorder",
        columnId: kanbanBoardDataByBoardId.orderedColumnIds[startIndex],
        startIndex,
        finishIndex,
      };

      kanbanBoardDataByBoardId.orderedColumnIds = reorder({
        list: kanbanBoardDataByBoardId.orderedColumnIds,
        startIndex,
        finishIndex,
      });

      kanbanBoardDataByBoardId.lastOperation = {
        trigger,
        outcome,
      };
    },

    reorderCard: (state, action: ReorderCardActionType) => {
      const { columnId, finishIndex, startIndex, trigger, boardId } =
        action.payload;
      const kanbanBoardDataByBoardId = state.kanbanBoardDataByBoardId[boardId];

      const sourceColumn = kanbanBoardDataByBoardId.columnMap[columnId];
      const updatedItems = reorder({
        list: sourceColumn.items,
        startIndex,
        finishIndex,
      });
      sourceColumn.items = updatedItems;

      const outcome: Outcome | null = {
        type: "card-reorder",
        columnId,
        startIndex,
        finishIndex,
      };

      kanbanBoardDataByBoardId.lastOperation = {
        trigger,
        outcome,
      };
    },

    moveCard: (state, action: MoveCardActionType) => {
      const {
        boardId,
        startColumnId,
        finishColumnId,
        itemIndexInStartColumn,
        itemIndexInFinishColumn,
        trigger = "keyboard",
      } = action.payload;

      // invalid cross column movement
      if (startColumnId === finishColumnId) {
        return;
      }

      const kanbanBoardDataByBoardId = state.kanbanBoardDataByBoardId[boardId];
      const sourceColumn = kanbanBoardDataByBoardId.columnMap[startColumnId];
      const destinationColumn =
        kanbanBoardDataByBoardId.columnMap[finishColumnId];
      const item: Person = sourceColumn.items[itemIndexInStartColumn];

      const destinationItems = Array.from(destinationColumn.items);

      // Going into the first position if no index is provided
      const newIndexInDestination = itemIndexInFinishColumn ?? 0;
      destinationItems.splice(newIndexInDestination, 0, item);

      kanbanBoardDataByBoardId.columnMap[startColumnId].items =
        sourceColumn.items.filter((i) => i.userId !== item.userId);

      kanbanBoardDataByBoardId.columnMap[finishColumnId].items =
        destinationItems;

      const outcome: Outcome | null = {
        type: "card-move",
        finishColumnId,
        itemIndexInStartColumn,
        itemIndexInFinishColumn: newIndexInDestination,
      };

      kanbanBoardDataByBoardId.lastOperation = {
        outcome,
        trigger,
      };
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchBoardData.fulfilled, (state, action) => {
      const payload = action.payload;
      state.kanbanBoardDataByBoardId[payload.boardId] = payload.response;
    });

    // update logic
    builder.addCase(updateBoardData.rejected, (state, action) => {
      console.log("🚀 ~ builder.addCase ~ action:", action);
      const payload: { error: string; boardId: number } = action.payload;
      const stateNeedsToUpdate =
        state.kanbanBoardDataByBoardId[payload.boardId];
      stateNeedsToUpdate.isLoadingWhileUpdating = false;
      stateNeedsToUpdate.isErrorWhileUpdating = true;
      stateNeedsToUpdate.errorMessageWhileUpdating = payload.error;
    });
  },
});

export const {
  removeCard,
  initialize,
  consoleState,
  moveCard,
  addColumn,
  reorderCard,
  reorderColumn,
} = kanbanBoardSlice.actions;

export default kanbanBoardSlice.reducer;

const kanbanBoardDataByBoardId = (state: RootState) =>
  state.kanbanBoard.kanbanBoardDataByBoardId;

export const getColumns = createSelector(
  [kanbanBoardDataByBoardId, (_, boardId: number) => boardId],
  (kanbanBoardDataByBoardId, boardId) => {
    const { columnMap, orderedColumnIds } = kanbanBoardDataByBoardId[boardId];
    return orderedColumnIds.map((columnId) => columnMap[columnId]);
  }
);

export const getKanbanBoardDataByBoardId = createSelector(
  [kanbanBoardDataByBoardId, (_, boardId: number) => boardId],
  (kanbanBoardDataByBoardId, boardId) => {
    return kanbanBoardDataByBoardId[boardId];
  }
);
