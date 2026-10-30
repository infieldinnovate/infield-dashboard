import { AuthUser } from "./auth-types";

export const mockUser: AuthUser = {
  id: "dev-user-001",
  name: "Wicklife Oluoch",
  email: "wicklife@infieldinnovations.com",
  role: "admin",
  avatar: "/users/passport-wadeya.jpg",
};

export function isMockAuthEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.MOCK_AUTH === "true"
  );
}
