import { nanoid } from 'nanoid';

export function generateId() {
  return nanoid(12);
}

const ADJECTIVES = ['Creative', 'Sunny', 'Silent', 'Swift', 'Bright', 'Clever', 'Bold', 'Mystic', 'Wandering', 'Happy', 'Gentle', 'Loyal', 'Eager'];
const NOUNS = ['Designer', 'Artist', 'Sketcher', 'Drafter', 'Creator', 'Maker', 'Painter', 'Thinker', 'Dreamer', 'Planner', 'Builder', 'Explorer'];

export function generateRandomName() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
}
