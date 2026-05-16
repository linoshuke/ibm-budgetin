import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Ketentuan Layanan • Budgetin",
};

export default function TermsOfServicePage() {
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
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Ketentuan Layanan</h1>
            <p className="text-sm text-[var(--text-dimmed)]">Terakhir diperbarui: 11 April 2026</p>
          </header>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Penerimaan</h2>
            <p className="text-sm text-[var(--text-dimmed)]">
              Dengan mengakses atau menggunakan Budgetin, Anda menyetujui Ketentuan Layanan ini. Jika Anda tidak setuju,
              mohon jangan menggunakan layanan.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Penggunaan Layanan</h2>
            <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--text-dimmed)]">
              <li>Anda bertanggung jawab atas aktivitas yang terjadi di akun Anda.</li>
              <li>Dilarang menggunakan layanan untuk tujuan melanggar hukum, penipuan, atau penyalahgunaan sistem.</li>
              <li>
                Anda setuju untuk tidak mencoba mengakses data pengguna lain, melakukan reverse engineering, atau
                mengganggu ketersediaan layanan.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Konten Anda</h2>
            <p className="text-sm text-[var(--text-dimmed)]">
              Anda memiliki hak atas data yang Anda input (misalnya transaksi dan catatan). Anda memberi kami izin untuk
              menyimpan, memproses, dan menampilkan data tersebut semata-mata untuk menyediakan fitur Budgetin.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Bukan Nasihat Keuangan</h2>
            <p className="text-sm text-[var(--text-dimmed)]">
              Budgetin membantu pencatatan dan ringkasan keuangan. Informasi yang ditampilkan bukan nasihat keuangan,
              investasi, atau pajak. Keputusan Anda sepenuhnya tanggung jawab Anda.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Ketersediaan &amp; Perubahan</h2>
            <p className="text-sm text-[var(--text-dimmed)]">
              Kami dapat memperbarui, mengubah, atau menghentikan sebagian/seluruh layanan kapan saja. Kami juga dapat
              memperbarui ketentuan ini, dan perubahan akan ditandai melalui tanggal &quot;Terakhir diperbarui&quot; di
              atas.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Penghentian</h2>
            <p className="text-sm text-[var(--text-dimmed)]">
              Kami dapat menangguhkan atau menghentikan akses Anda jika ada indikasi pelanggaran ketentuan atau risiko
              keamanan. Anda dapat berhenti menggunakan layanan kapan saja.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Batasan Tanggung Jawab</h2>
            <p className="text-sm text-[var(--text-dimmed)]">
              Layanan disediakan &quot;sebagaimana adanya&quot; tanpa jaminan apa pun. Sejauh diizinkan oleh hukum, kami
              tidak bertanggung jawab atas kerugian tidak langsung, insidental, atau konsekuensial yang timbul dari
              penggunaan layanan.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Kontak</h2>
            <p className="text-sm text-[var(--text-dimmed)]">
              Pertanyaan tentang ketentuan ini dapat disampaikan melalui kanal dukungan yang tersedia di aplikasi.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}

