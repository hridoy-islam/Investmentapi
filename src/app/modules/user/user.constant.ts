export const USER_ROLE = {
  user: "user",
  admin: "admin",
  investor: "investor",
  agent: "agent",
  
} as const;

export const UserStatus = ["block", "active"];

export const UserSearchableFields = ["email", "name", "role"];
