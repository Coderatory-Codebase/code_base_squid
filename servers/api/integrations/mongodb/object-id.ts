import { Types } from "mongoose";

export const isValidObjectId = (id: string): boolean => {
  return Types.ObjectId.isValid(id) && (String(new Types.ObjectId(id)) === id);
};
