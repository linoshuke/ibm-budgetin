export type ThemeMode = "dark" | "light";

export interface UserProfile {
  name: string;
  email: string;
  theme: ThemeMode;
}
