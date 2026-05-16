import { NextResponse } from "next/server";
import { withNoStore } from "@/lib/http";
import type { Wallet } from "@/types/wallet";

/**
 * Daftar dompet sistem yang selalu tersedia.
 * Endpoint ini bersifat publik — tidak memerlukan autentikasi.
 * Digunakan untuk menampilkan pilihan dompet pada form transaksi
 * sebelum user login.
 */
const SYSTEM_WALLETS: Wallet[] = [
  {
    id: "system-tunai",
    name: "Tunai",
    category: "Cash",
    location: "Lokal",
    isDefault: true,
    balance: 0,
  },
  {
    id: "system-gopay",
    name: "GoPay",
    category: "E-Wallet",
    location: "Digital",
    isDefault: false,
    balance: 0,
  },
  {
    id: "system-qris",
    name: "QRIS",
    category: "E-Wallet",
    location: "Digital",
    isDefault: false,
    balance: 0,
  },
];

export async function GET() {
  return NextResponse.json(SYSTEM_WALLETS, {
    headers: withNoStore(),
  });
}
