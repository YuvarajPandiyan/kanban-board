import { createContext, useContext } from "react";

import {
  GetCard,
  GetColumn,
  RegisterCard,
  RegisterColumn,
  createRegistry,
} from "../../helper/registry";

export type BoardContextValue = {
  boardId: number;
  instanceId: symbol;
  getCard: GetCard;
  getColumn: GetColumn;
  registerCard: RegisterCard;
  registerColumn: RegisterColumn;
};
const registry = createRegistry();
export const BoardContext = createContext<BoardContextValue>({
  boardId: 1,
  instanceId: Symbol("asd"),
  getCard: registry.getCard,
  getColumn: registry.getColumn,
  registerCard: registry.registerCard,
  registerColumn: registry.registerColumn,
});

export const useBoardContext = () => {
  const value = useContext(BoardContext);
  if (!value) {
    console.error("use with boardContext wrapped");
  }
  return value;
};
