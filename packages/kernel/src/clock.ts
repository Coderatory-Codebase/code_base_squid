export type Clock = Readonly<{
  now: () => number;
}>;

export const systemClock: Clock = Object.freeze({ now: () => Date.now() });

export const createFixedClock = (time: number): Clock => Object.freeze({ now: () => time });
