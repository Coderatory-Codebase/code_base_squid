import { monotonicFactory } from "ulid";
import type { Clock } from "./clock.js";

export type IdGenerator = () => string;

type CreateIdGeneratorOptions = Readonly<{
  clock: Clock;
}>;

export const createIdGenerator = ({ clock }: CreateIdGeneratorOptions): IdGenerator => {
  const next = monotonicFactory();
  return () => next(clock.now());
};
