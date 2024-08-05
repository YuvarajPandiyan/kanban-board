import { getPeople } from "./people";
import { Person } from "./person";

export type ColumnType = {
  title: string;
  columnId: string;
  items: Person[];
};
export type ColumnMap = { [columnId: string]: ColumnType };

const COLUMN_IDS = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  UNDER_REVIEW: "UNDER_REVIEW",
  SHIPPED: "SHIPPED",
};

const COLUMN_NAMES_VS_COLUMN_ID = {
  [COLUMN_IDS.NOT_STARTED]: "NOT STARED",
  [COLUMN_IDS.IN_PROGRESS]: "IN PROGRESS",
  [COLUMN_IDS.UNDER_REVIEW]: "UNDER REVIEW",
  [COLUMN_IDS.SHIPPED]: "SHIPPED",
};

export const COLUMN_IDS_RANDOM = {
  PR_REVIEW: "PR_REVIEW",
};

export const COLUMN_IDS_RANDOM_ARRAY = [COLUMN_IDS_RANDOM.PR_REVIEW];

export const COLUMN_NAMES_VS_COLUMN_ID_RANDOM = {
  [COLUMN_IDS_RANDOM.PR_REVIEW]: "PR REVIEW",
};

export type Outcome =
  | {
      type: "column-reorder";
      columnId: string;
      startIndex: number;
      finishIndex: number;
    }
  | {
      type: "card-reorder";
      columnId: string;
      startIndex: number;
      finishIndex: number;
    }
  | {
      type: "card-move";
      finishColumnId: string;
      itemIndexInStartColumn: number;
      itemIndexInFinishColumn: number;
    };

export type Trigger = "pointer" | "keyboard";

type Operation = {
  trigger?: Trigger;
  outcome: Outcome;
};

export type KanbanBoardData = {
  columnMap: ColumnMap;
  orderedColumnIds: string[];
  lastOperation: Operation | null;
  isErrorWhileUpdating: boolean;
  errorMessageWhileUpdating?: string;
  isLoadingWhileUpdating: boolean;
};

export function getBasicData(): KanbanBoardData {
  const columnMap: ColumnMap = {
    [COLUMN_IDS.NOT_STARTED]: {
      title: COLUMN_NAMES_VS_COLUMN_ID[COLUMN_IDS.NOT_STARTED],
      columnId: COLUMN_IDS.NOT_STARTED,
      items: getPeople({ amount: 10 }),
    },
    [COLUMN_IDS.IN_PROGRESS]: {
      title: COLUMN_NAMES_VS_COLUMN_ID[COLUMN_IDS.IN_PROGRESS],
      columnId: COLUMN_IDS.IN_PROGRESS,
      items: getPeople({ amount: 10 }),
    },
    [COLUMN_IDS.UNDER_REVIEW]: {
      title: COLUMN_NAMES_VS_COLUMN_ID[COLUMN_IDS.UNDER_REVIEW],
      columnId: COLUMN_IDS.UNDER_REVIEW,
      items: getPeople({ amount: 2 }),
    },
    [COLUMN_IDS.SHIPPED]: {
      title: COLUMN_NAMES_VS_COLUMN_ID[COLUMN_IDS.SHIPPED],
      columnId: COLUMN_IDS.SHIPPED,
      items: getPeople({ amount: 10 }),
    },
  };

  const orderedColumnIds = [
    COLUMN_IDS.NOT_STARTED,
    COLUMN_IDS.IN_PROGRESS,
    COLUMN_IDS.UNDER_REVIEW,
    COLUMN_IDS.SHIPPED,
  ];

  return {
    columnMap,
    orderedColumnIds,
    lastOperation: null,
    isErrorWhileUpdating: false,
    isLoadingWhileUpdating: false,
  };
}
