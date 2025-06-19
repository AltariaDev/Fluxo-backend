import mongoose from "mongoose";

export interface JwtPayload {
  id: mongoose.Types.ObjectId; // ID del usuario en MongoDB
  email: string; // Email del usuario
  iat?: number; // (Opcional) Timestamp de creación del token
  exp?: number; // (Opcional) Timestamp de expiración del token
}
