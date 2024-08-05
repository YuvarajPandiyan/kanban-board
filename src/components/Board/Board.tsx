import { forwardRef, memo, type ReactNode } from "react";

import { Box, xcss } from "@atlaskit/primitives";

type BoardProps = {
  children: ReactNode;
};

const boardStyles = xcss({
  display: "flex",
  justifyContent: "center",
  gap: "space.200",
  flexDirection: "row",
  height: "480px",
});

const Board = forwardRef<HTMLDivElement, BoardProps>(
  ({ children }: BoardProps, ref) => {
    return (
      <Box xcss={boardStyles} ref={ref}>
        {children}
      </Box>
    );
  }
);

export default memo(Board);
