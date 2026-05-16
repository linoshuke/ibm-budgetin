import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Kebijakan Privasi • Budgetin",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between gap-3">
          <Link
            href="/login"
            className="text-sm text-[var(--text-dimmed)] transition hover:text-[var(--text-primary)]"
          >
            &larr; Kembali
          </Link>
          <Image
            src="/Budgetin.png"
            alt="Budgetin"
            width={64}
            height={64}
            className="h-10 w-10 object-contain"
            priority
          />
        </div>

        <article className="glass-panel space-y-8 p-6 md:p-8">
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Kebijakan Privasi</h1>
            <p className="text-sm text-[var(--text-dimmed)]">Terakhir diperbarui: 11 April 2026</p>
          </header>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Ringkasan</h2>
            <p className="text-sm text-[var(--text-dimmed)]">
              Kebijakan ini menjelaskan jenis data yang kami kumpulkan saat Anda menggunakan Budgetin, bagaimana data
              tersebut digunakan, dan pilihan yang Anda miliki.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Data yang Kami Kumpulkan</h2>
            <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--text-dimmed)]">
              <li>
                <span className="font-medium text-[var(--text-primary)]">Data akun</span>: email, nama/username, dan
                informasi profil yang Anda isi.
              </li>
              <li>
                <span className="font-medium text-[var(--text-primary)]">Data transaksi</span>: dompet, kategori,
                pemasukan/pengeluaran, nominal, tanggal, catatan, dan data lain yang Anda input di aplikasi.
              </li>
              <li>
                <span className="font-medium text-[var(--text-primary)]">Data autentikasi</span>: token sesi dan
                informasi yang dibutuhkan untuk menjaga Anda tetap login. Kami tidak menyimpan kata sandi dalam bentuk
                teks asli.
              </li>
              <li>
                <span className="font-medium text-[var(--text-primary)]">Data teknis</span>: informasi perangkat dan log
                dasar (misalnya alamat IP, jenis browser, waktu akses) untuk keamanan dan pemecahan masalah.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Cara Kami Menggunakan Data</h2>
            <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--text-dimmed)]">
              <li>Menyediakan fitur inti aplikasi (mencatat transaksi, ringkasan, laporan, dan sinkronisasi data).</li>
              <li>Memproses login/registrasi dan menjaga keamanan akun (misalnya pencegahan penyalahgunaan).</li>
              <li>Memperbaiki bug, meningkatkan performa, dan meningkatkan pengalaman pengguna.</li>
              <li>Mengirim email terkait akun (misalnya verifikasi email atau pemulihan kata sandi) jika diperlukan.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Berbagi Data</h2>
            <p className="text-sm text-[var(--text-dimmed)]">
              Kami tidak menjual data pribadi Anda. Data dapat diproses oleh penyedia layanan yang membantu operasional
              aplikasi (misalnya hosting, database, dan autentikasi). Penyedia layanan tersebut hanya memproses data
              sesuai instruksi kami untuk menjalankan layanan.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Penyimpanan &amp; Keamanan</h2>
            <p className="text-sm text-[var(--text-dimmed)]">
              Kami menerapkan langkah keamanan yang wajar untuk melindungi data. Namun, tidak ada metode transmisi atau
              penyimpanan elektronik yang 100% aman. Anda bertanggung jawab menjaga kerahasiaan kredensial akun Anda.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Retensi Data</h2>
            <p className="text-sm text-[var(--text-dimmed)]">
              Data disimpan selama akun Anda aktif atau selama diperlukan untuk menyediakan layanan. Anda dapat meminta
              penghapusan data akun sesuai ketentuan yang berlaku.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Hak Anda</h2>
            <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--text-dimmed)]">
              <li>Meminta akses, koreksi, atau pembaruan data profil.</li>
              <li>Meminta penghapusan akun (dan data terkait) sesuai kebijakan retensi.</li>
              <li>Menolak atau membatasi pemrosesan tertentu jika memungkinkan.</li>
            </ul>
            <p className="text-sm text-[var(--text-dimmed)]">
              Untuk permintaan terkait privasi, silakan hubungi tim Budgetin melalui kanal dukungan yang tersedia.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Perubahan Kebijakan</h2>
            <p className="text-sm text-[var(--text-dimmed)]">
              Kami dapat memperbarui kebijakan ini dari waktu ke waktu. Perubahan akan ditandai melalui tanggal
              &quot;Terakhir diperbarui&quot; di atas.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}

