export interface Wallet {
  id: string;
  name: string;
  category: string;
  location: string;
  isDefault: boolean;
  balance?: number;
}
