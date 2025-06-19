import { Request } from "express";
import { User } from "src/users/entities/user.entity";

export interface RequestWithUser extends Request {
  user: User & { _id: string }; // 🔹 Asegura que `_id` es string
}
