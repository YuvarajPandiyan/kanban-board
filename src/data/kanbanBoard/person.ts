import { names } from "./names";
import { roles } from "./roles";
import { teamNames } from "./teamName";

export type Tag = { id: number; tag: string };
export type Tags = Tag[];

export type Assignee = { name: string; avatar: string };
export type Assignees = Assignee[];

export type Person = {
  title: string;
  userId: string;
  name: string;
  role: string;
  tags: Tags;
  teamName: string;
  ticketId: string;
  assignees: Assignees;
};

const TAGS: string[] = [
  "Dev in progress",
  "In design",
  "Blocked",
  "Dev completed",
  "Updated",
  "IT team",
  "Devops",
  "Perf test",
];

const TITLE: string[] = [
  "Inbox design",
  "Inbox infrastructure",
  "Build conversion module",
  "Build co-pilot UI",
  "Notification module",
  "Setup API",
];

const TICKET_PREFIX = "ENG";

export function getRandomInt(min = 1, max = 100000): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const getAssignees = (name: string): Assignee => {
  return { name, avatar: `https://i.pravatar.cc/100?new=${getRandomInt()}` };
};

export function getPersonFromPosition({
  position,
}: {
  position: number;
}): Person {
  const nextIndex = position % roles.length;
  // use the next name
  const name = names[nextIndex];
  // use the next role
  const role = roles[nextIndex];
  const teamName = teamNames[nextIndex];

  const randomInt = getRandomInt(1, 2);

  const tags: Tags = Array.from({ length: randomInt }, (_, index) => ({
    id: index,
    tag: TAGS[getRandomInt(1, 7)],
  }));

  const assignees: Assignees = Array.from({ length: randomInt }, () =>
    getAssignees(name)
  );

  return {
    title: TITLE[getRandomInt(0, 5)],
    tags,
    name,
    role,
    teamName,
    userId: `id:${position}`,
    assignees,
    ticketId: `${TICKET_PREFIX}-${getRandomInt()}`,
  };
}
