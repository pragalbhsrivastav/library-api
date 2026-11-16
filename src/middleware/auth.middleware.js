import jwt from "jsonwebtoken";
import "dotenv/config";

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token missing" });
  }

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  req.user = decoded;
  next();
}

export function requireRole(role) {
  return (req, res, next) => {
    // 1. if req.user is missing, or its role is not the required role -> return 403
    if (!req.user) {
      return res.status(403).json({ message: "User is missing" });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ message: "Not Authorized" });
    }
    // 2. otherwise call next()
    next();
  };
}
