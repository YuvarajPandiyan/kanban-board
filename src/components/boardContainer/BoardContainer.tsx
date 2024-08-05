import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import invariant from "tiny-invariant";

import Banner from "@atlaskit/banner";
import Button from "@atlaskit/button/new";
import ErrorIcon from "@atlaskit/icon/glyph/error";
import * as liveRegion from "@atlaskit/pragmatic-drag-and-drop-live-region";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/types";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { getReorderDestinationIndex } from "@atlaskit/pragmatic-drag-and-drop-hitbox/util/get-reorder-destination-index";
import {
  addColumn,
  moveCard,
  reorderCard,
  reorderColumn,
} from "../../store/feature/kanbanBoard/kanbanBoardSlice";

import Board from "../Board/Board";
import { BoardContext, BoardContextValue } from "./context";
import { RootState } from "../../store/store";
import { Column } from "../column";
import { createRegistry } from "../../helper/registry";
import {
  fetchBoardData,
  updateBoardData,
} from "../../store/feature/kanbanBoard/kanbanBoardSliceApi";

const BOARD_ID: number = Date.now();

const BannerErrorExample = ({ error }: { error: string | undefined }) => {
  return (
    <Banner
      appearance="error"
      icon={<ErrorIcon label="Error" secondaryColor="inherit" />}
    >
      {error}
    </Banner>
  );
};

const BoardContainer = () => {
  const [registry] = useState(createRegistry);
  const [instanceId] = useState(Symbol("instance-id"));
  const dispatch = useDispatch();

  const kanbanBoardDataByBoardId = useSelector(
    (state: RootState) =>
      state.kanbanBoard.kanbanBoardDataByBoardId[BOARD_ID] || {}
  );

  useEffect(() => {
    dispatch(fetchBoardData(BOARD_ID));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    dispatch(
      updateBoardData({
        kanbanBoardData: kanbanBoardDataByBoardId,
        boardId: BOARD_ID,
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kanbanBoardDataByBoardId]);

  const { lastOperation } = kanbanBoardDataByBoardId;

  useEffect(() => {
    if (!kanbanBoardDataByBoardId || !lastOperation || lastOperation === null) {
      return;
    }
    const { outcome, trigger } = lastOperation;

    if (outcome.type === "column-reorder") {
      const { startIndex, finishIndex } = outcome;

      const { columnMap, orderedColumnIds } = kanbanBoardDataByBoardId;
      const sourceColumn = columnMap[orderedColumnIds[finishIndex]];

      liveRegion.announce(
        `You've moved ${sourceColumn.title} from position ${
          startIndex + 1
        } to position ${finishIndex + 1} of ${orderedColumnIds.length}.`
      );

      return;
    }

    if (outcome.type === "card-reorder") {
      const { columnId, startIndex, finishIndex } = outcome;

      const { columnMap } = kanbanBoardDataByBoardId;
      const column = columnMap[columnId];
      const item = column.items[finishIndex];

      if (trigger !== "keyboard") {
        return;
      }

      liveRegion.announce(
        `You've moved ${item.name} from position ${
          startIndex + 1
        } to position ${finishIndex + 1} of ${column.items.length} in the ${
          column.title
        } column.`
      );

      return;
    }

    if (outcome.type === "card-move") {
      const {
        finishColumnId,
        itemIndexInStartColumn,
        itemIndexInFinishColumn,
      } = outcome;

      const destinationColumn =
        kanbanBoardDataByBoardId.columnMap[finishColumnId];
      const item = destinationColumn.items[itemIndexInFinishColumn];

      const finishPosition =
        typeof itemIndexInFinishColumn === "number"
          ? itemIndexInFinishColumn + 1
          : destinationColumn.items.length;

      if (trigger !== "keyboard") {
        return;
      }

      liveRegion.announce(
        `You've moved ${item.name} from position ${
          itemIndexInStartColumn + 1
        } to position ${finishPosition} in the ${
          destinationColumn.title
        } column.`
      );

      return;
    }
  }, [kanbanBoardDataByBoardId, lastOperation, registry]);

  useEffect(() => {
    return combine(
      monitorForElements({
        canMonitor({ source }) {
          return source.data.instanceId === instanceId;
        },
        onDrop(args) {
          const { location, source } = args;
          // didn't drop on anything
          if (!location.current.dropTargets.length) {
            return;
          }
          // need to handle drop

          // 1. remove element from original position
          // 2. move to new position

          if (source.data.type === "column") {
            const startIndex: number =
              kanbanBoardDataByBoardId.orderedColumnIds.findIndex(
                (columnId) => columnId === source.data.columnId
              );

            const target = location.current.dropTargets[0];
            const indexOfTarget: number =
              kanbanBoardDataByBoardId.orderedColumnIds.findIndex(
                (id) => id === target.data.columnId
              );
            const closestEdgeOfTarget: Edge | null = extractClosestEdge(
              target.data
            );

            const finishIndex = getReorderDestinationIndex({
              startIndex,
              indexOfTarget,
              closestEdgeOfTarget,
              axis: "horizontal",
            });

            dispatch(
              reorderColumn({
                startIndex,
                finishIndex,
                trigger: "pointer",
                boardId: BOARD_ID,
              })
            );
          }
          // Dragging a card
          if (source.data.type === "card") {
            const itemId = source.data.itemId;
            invariant(typeof itemId === "string");
            // TODO: these lines not needed if item has columnId on it
            const [, startColumnRecord] = location.initial.dropTargets;
            const sourceId = startColumnRecord.data.columnId;
            invariant(typeof sourceId === "string");
            const sourceColumn = kanbanBoardDataByBoardId.columnMap[sourceId];
            const itemIndex = sourceColumn.items.findIndex(
              (item) => item.userId === itemId
            );

            if (location.current.dropTargets.length === 1) {
              const [destinationColumnRecord] = location.current.dropTargets;
              const destinationId = destinationColumnRecord.data.columnId;
              invariant(typeof destinationId === "string");
              const destinationColumn =
                kanbanBoardDataByBoardId.columnMap[destinationId];
              invariant(destinationColumn);

              // reordering in same column
              if (sourceColumn === destinationColumn) {
                const destinationIndex = getReorderDestinationIndex({
                  startIndex: itemIndex,
                  indexOfTarget: sourceColumn.items.length - 1,
                  closestEdgeOfTarget: null,
                  axis: "vertical",
                });
                dispatch(
                  reorderCard({
                    columnId: sourceColumn.columnId,
                    startIndex: itemIndex,
                    finishIndex: destinationIndex,
                    trigger: "pointer",
                    boardId: BOARD_ID,
                  })
                );
                return;
              }

              // moving to a new column
              dispatch(
                moveCard({
                  itemIndexInStartColumn: itemIndex,
                  startColumnId: sourceColumn.columnId,
                  finishColumnId: destinationColumn.columnId,
                  trigger: "pointer",
                  boardId: BOARD_ID,
                })
              );
              return;
            }

            // dropping in a column (relative to a card)
            if (location.current.dropTargets.length === 2) {
              const [destinationCardRecord, destinationColumnRecord] =
                location.current.dropTargets;
              const destinationColumnId = destinationColumnRecord.data.columnId;
              invariant(typeof destinationColumnId === "string");
              const destinationColumn =
                kanbanBoardDataByBoardId.columnMap[destinationColumnId];

              const indexOfTarget = destinationColumn.items.findIndex(
                (item) => item.userId === destinationCardRecord.data.itemId
              );
              const closestEdgeOfTarget: Edge | null = extractClosestEdge(
                destinationCardRecord.data
              );

              // case 1: ordering in the same column
              if (sourceColumn === destinationColumn) {
                const destinationIndex = getReorderDestinationIndex({
                  startIndex: itemIndex,
                  indexOfTarget,
                  closestEdgeOfTarget,
                  axis: "vertical",
                });
                dispatch(
                  reorderCard({
                    columnId: sourceColumn.columnId,
                    startIndex: itemIndex,
                    finishIndex: destinationIndex,
                    trigger: "pointer",
                    boardId: BOARD_ID,
                  })
                );
                return;
              }

              // case 2: moving into a new column relative to a card

              const destinationIndex =
                closestEdgeOfTarget === "bottom"
                  ? indexOfTarget + 1
                  : indexOfTarget;

              dispatch(
                moveCard({
                  itemIndexInStartColumn: itemIndex,
                  startColumnId: sourceColumn.columnId,
                  finishColumnId: destinationColumn.columnId,
                  itemIndexInFinishColumn: destinationIndex,
                  trigger: "pointer",
                  boardId: BOARD_ID,
                })
              );
            }
          }
        },
      })
    );
  }, [
    dispatch,
    instanceId,
    kanbanBoardDataByBoardId.columnMap,
    kanbanBoardDataByBoardId.orderedColumnIds,
  ]);

  const boardContextValue: BoardContextValue = useMemo(
    () => ({
      boardId: BOARD_ID,
      instanceId,
      registerCard: registry.registerCard,
      registerColumn: registry.registerColumn,
      getCard: registry.getCard,
      getColumn: registry.getColumn,
    }),
    [
      instanceId,
      registry.getCard,
      registry.getColumn,
      registry.registerCard,
      registry.registerColumn,
    ]
  );

  return (
    <div>
      {kanbanBoardDataByBoardId.isErrorWhileUpdating && (
        <BannerErrorExample
          error={kanbanBoardDataByBoardId.errorMessageWhileUpdating}
        />
      )}
      <div style={{ display: "flex", paddingBottom: "2rem" }}>
        <Button
          onClick={() => {
            dispatch(addColumn({ boardId: BOARD_ID }));
          }}
        >
          Add Column
        </Button>
      </div>
      <BoardContext.Provider value={boardContextValue}>
        <Board>
          {kanbanBoardDataByBoardId?.orderedColumnIds?.map((columnId) => {
            return (
              <Column
                column={kanbanBoardDataByBoardId?.columnMap[columnId]}
                key={columnId}
              />
            );
          })}
        </Board>
      </BoardContext.Provider>
    </div>
  );
};

export default BoardContainer;
