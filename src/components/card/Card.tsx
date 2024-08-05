import {
  forwardRef,
  Fragment,
  memo,
  type Ref,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import ReactDOM from "react-dom";
import invariant from "tiny-invariant";

import Button from "@atlaskit/button/new";
import TrashIcon from "@atlaskit/icon/glyph/trash";
import Avatar from "@atlaskit/avatar";
import Heading from "@atlaskit/heading";
import {
  attachClosestEdge,
  type Edge,
  extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { preserveOffsetOnSource } from "@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { dropTargetForExternal } from "@atlaskit/pragmatic-drag-and-drop/external/adapter";
import { Box, Flex, Grid, Stack, xcss } from "@atlaskit/primitives";
import { getRandomInt, Person } from "../../data/kanbanBoard/person";
import { TEAM_NAME_COLOR_ARRAY } from "../boardContainer/constents";
import { useBoardContext } from "../boardContainer/context";
import { useDispatch } from "react-redux";
import { removeCard } from "../../store/feature/kanbanBoard/kanbanBoardSlice";

type State =
  | { type: "idle" }
  | { type: "preview"; container: HTMLElement; rect: DOMRect }
  | { type: "dragging" };

const idleState: State = { type: "idle" };
const draggingState: State = { type: "dragging" };

const baseStyles = xcss({
  minHeight: "10rem",
  width: "100%",
  padding: "space.250",
  backgroundColor: "elevation.surface",
  borderRadius: "border.radius.200",
  position: "relative",
  alignItems: "start",
  ":hover": {
    backgroundColor: "elevation.surface.hovered",
  },
});

const stateStyles: {
  [Key in State["type"]]: ReturnType<typeof xcss> | undefined;
} = {
  idle: xcss({
    cursor: "grab",
    boxShadow: "elevation.shadow.raised",
  }),
  dragging: xcss({
    opacity: 0.4,
    boxShadow: "elevation.shadow.raised",
  }),
  // no shadow for preview - the platform will add it's own drop shadow
  preview: undefined,
};

type CardPrimitiveProps = {
  closestEdge: Edge | null;
  item: Person;
  state: State;
  columnId: string;
  actionMenuTriggerRef?: Ref<HTMLButtonElement>;
};

const CardPrimitive = forwardRef<HTMLDivElement, CardPrimitiveProps>(
  function CardPrimitive({ item, columnId, state }, ref) {
    const { assignees, userId, ticketId, teamName, tags, title } = item;

    const { boardId } = useBoardContext();
    const dispatch = useDispatch();

    const handleOnClickRemove = useCallback(() => {
      dispatch(removeCard({ userId, columnId, boardId }));
    }, [boardId, columnId, dispatch, userId]);

    return (
      <Grid
        ref={ref}
        testId={`item-${userId}`}
        templateColumns="auto 1fr auto"
        columnGap="space.100"
        alignItems="center"
        xcss={[baseStyles, stateStyles[state.type]]}
      >
        <Stack space="space.050" grow="fill">
          <Flex>
            <span
              style={{
                backgroundColor: TEAM_NAME_COLOR_ARRAY[getRandomInt(0, 3)],
                borderRadius: ".2rem",
                padding: "0 .2rem 0 .2rem",
              }}
            >
              <div>
                <Heading size="xxsmall" as="span">
                  {teamName}
                </Heading>
              </div>
            </span>
          </Flex>
          <span style={{ paddingTop: ".5rem", textAlign: "start" }}>
            <Heading size="xxsmall" as="span">
              {title}
            </Heading>
          </span>
          <div style={{ textAlign: "start", paddingTop: "2rem" }}>
            <div style={{ textAlign: "start", paddingBottom: "1rem" }}>
              {ticketId}
            </div>
            <Flex gap="space.050">
              {tags.map(({ tag }) => (
                <div
                  style={{
                    fontSize: ".6rem",
                    borderRadius: ".2rem",
                    padding: "0 .2rem 0 .2rem",
                    backgroundColor: "lightgrey",
                  }}
                >
                  <span style={{ color: "white" }}>{tag?.toUpperCase()}</span>
                </div>
              ))}
            </Flex>
          </div>
        </Stack>
        <div
          style={{
            display: "flex",
            height: "100%",
            alignItems: "end",
            justifyContent: "flex-end",
          }}
        >
          {assignees.map(({ avatar }, idx) => {
            return (
              <div
                style={{
                  display: "flex",
                  height: "100%",
                  alignItems: "end",
                  flexDirection: "column",
                  justifyContent:
                    idx === assignees.length - 1 ? "space-between" : "flex-end",
                }}
              >
                {idx === assignees.length - 1 && (
                  <Button onClick={handleOnClickRemove}>
                    <TrashIcon label="" />
                  </Button>
                )}
                <Avatar size="small" src={avatar}>
                  {(props) => (
                    // Note: using `div` rather than `Box`.
                    // `CustomAvatarProps` passes through a `className`
                    // but `Box` does not accept `className` as a prop.
                    <div
                      {...props}
                      // Workaround to make `Avatar` not draggable.
                      // Ideally `Avatar` would have a `draggable` prop.
                      style={{ pointerEvents: "none" }}
                      ref={props.ref as Ref<HTMLDivElement>}
                    />
                  )}
                </Avatar>
              </div>
            );
          })}
        </div>
      </Grid>
    );
  }
);

export const Card = memo(function Card({
  item,
  columnId,
}: {
  item: Person;
  columnId: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { userId } = item;
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);
  const [state, setState] = useState<State>(idleState);

  const actionMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const { instanceId } = useBoardContext();

  useEffect(() => {
    const element = ref.current;
    invariant(element);
    return combine(
      draggable({
        element: element,
        getInitialData: () => ({ type: "card", itemId: userId, instanceId }),
        onGenerateDragPreview: ({ location, source, nativeSetDragImage }) => {
          const rect = source.element.getBoundingClientRect();

          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: preserveOffsetOnSource({
              element,
              input: location.current.input,
            }),
            render({ container }) {
              setState({ type: "preview", container, rect });
              return () => setState(draggingState);
            },
          });
        },

        onDragStart: () => setState(draggingState),
        onDrop: () => setState(idleState),
      }),
      dropTargetForExternal({
        element: element,
      }),
      dropTargetForElements({
        element: element,
        canDrop: ({ source }) => {
          return (
            source.data.instanceId === instanceId && source.data.type === "card"
          );
        },
        getIsSticky: () => true,
        getData: ({ input, element }) => {
          const data = { type: "card", itemId: userId };

          return attachClosestEdge(data, {
            input,
            element,
            allowedEdges: ["top", "bottom"],
          });
        },
        onDragEnter: (args) => {
          if (args.source.data.itemId !== userId) {
            setClosestEdge(extractClosestEdge(args.self.data));
          }
        },
        onDrag: (args) => {
          if (args.source.data.itemId !== userId) {
            setClosestEdge(extractClosestEdge(args.self.data));
          }
        },
        onDragLeave: () => {
          setClosestEdge(null);
        },
        onDrop: () => {
          setClosestEdge(null);
        },
      })
    );
  }, [instanceId, item, userId]);

  return (
    <Fragment>
      <CardPrimitive
        ref={ref}
        item={item}
        state={state}
        columnId={columnId}
        closestEdge={closestEdge}
        actionMenuTriggerRef={actionMenuTriggerRef}
      />
      {state.type === "preview" &&
        ReactDOM.createPortal(
          <Box
            style={{
              /**
               * Ensuring the preview has the same dimensions as the original.
               *
               * Using `border-box` sizing here is not necessary in this
               * specific example, but it is safer to include generally.
               */
              boxSizing: "border-box",
              width: state.rect.width,
              height: state.rect.height,
            }}
          >
            <CardPrimitive
              item={item}
              state={state}
              columnId={columnId}
              closestEdge={null}
            />
          </Box>,
          state.container
        )}
    </Fragment>
  );
});
