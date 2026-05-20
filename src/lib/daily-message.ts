// Pesan harian dari Tri Atmoko untuk Mutia Wati.
// Berganti tiap hari berdasarkan tanggal (deterministik).
const MESSAGES: string[] = [
  "Selamat pagi sayangku Mutia 🍓 Semoga harimu semanis stroberi dan dilancarkan semua urusannya. Aku sayang kamu.",
  "Mutia, kamu adalah alasan aku tersenyum tiap pagi. Tetap semangat ya hari ini, Tri selalu mendoakanmu.",
  "Sayang, jaga sholatmu ya. Aku percaya wanita sholehah selalu dilindungi Allah. — Tri Atmoko",
  "Mut, jangan lupa makan tepat waktu. Tubuhmu titipan Allah yang kelak menjadi tanggung jawabku. ❤️",
  "Hai cintaku, hari ini cobalah lebih banyak tersenyum. Dunia jadi lebih cantik kalau kamu yang tersenyum.",
  "Mutia, sebaik-baik teman bagi seorang muslimah adalah saudari seimannya. Yuk pelan-pelan kurangi obrolan dengan lawan jenis yang tidak penting, biar hatimu tetap tenang. — Tri",
  "Sayang, kamu kuat. Kamu bisa. Aku di sini menemani perjalananmu.",
  "Mut, doaku selalu menyertaimu. Semoga Allah jaga kamu di mana pun kamu berada hari ini.",
  "Cinta, jangan terlalu keras pada dirimu sendiri. Istirahat juga ibadah.",
  "Mutia, harimu pasti indah karena ada Allah yang menjaga, dan ada aku yang menyayangimu.",
  "Sayang, sebaik-baik perhiasan dunia adalah wanita sholehah. Dan kamulah perhiasanku. — Tri Atmoko",
  "Mut, hari ini coba baca Qur'an walau satu lembar. Hatimu pasti lebih lapang. ❤️",
  "Pagi sayang, jangan lupa minum air putih. Aku sayang kamu yang sehat.",
  "Mutia, dengan lembut aku ingatkan: jaga interaksi dengan lawan jenis ya. Bukan karena curiga, tapi karena aku ingin menjagamu. — Tri",
  "Cintaku, kamu cantik bukan karena make up. Kamu cantik karena hatimu yang baik.",
  "Mut, semangat ya kerjanya. Pulang nanti aku tunggu cerita harimu.",
  "Sayang, kalau lelah bilang. Kalau senang ceritakan. Aku selalu mendengarkan.",
  "Mutia, aku berdoa semoga Allah satukan kita dalam kebaikan dunia akhirat. ❤️",
  "Pagi cintaku, jangan lupa sarapan. Pilih lauk bergizi ya, bukan yang aneh-aneh. 😄",
  "Mut, percayalah, kamu jauh lebih berharga dari yang kamu kira.",
  "Sayang, sedikit nasihat lembut: kalau ada teman pria yang berlebihan, jaga jarak ya. Aku percaya pada kamu. — Tri Atmoko",
  "Mutia, hari ini coba sholat di awal waktu. Insya Allah berkah harimu.",
  "Cinta, terima kasih sudah menjadi tempat pulang yang nyaman.",
  "Mut, semangat puasa sunnahnya kalau hari ini Senin atau Kamis ya. Pahalanya gede!",
  "Sayang, jangan lupa bersyukur. Setiap napas adalah anugerah.",
  "Mutia, kamu adalah hadiah terbaik dari Allah untukku. Aku jaga kamu sebaik-baiknya.",
  "Mut, kalau ada yang berat hari ini, sholat dan curhat sama Allah dulu, baru cerita ke aku. ❤️",
  "Sayangku, senyummu adalah doa yang terjawab.",
  "Mutia, ingat ya, lingkaran pertemananmu menentukan akhlakmu. Pilih teman yang membawamu ke surga. — Tri",
  "Pagi cinta, semoga harimu seindah doaku untukmu hari ini.",
  "Mut, aku bangga sama kamu. Tetap jadi Mutia yang aku kenal ya.",
];

export function dailyMessage(date = new Date()): string {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const diff = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - start;
  const dayOfYear = Math.floor(diff / 86400000);
  return MESSAGES[dayOfYear % MESSAGES.length];
}
