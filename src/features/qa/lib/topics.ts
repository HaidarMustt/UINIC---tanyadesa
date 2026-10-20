// Topic buttons on the Tanya page. Tapping a topic only swaps the example questions,
// in the browser: no AI call, no quota used. Every question here is one TanyaDesa can answer.

export interface QuestionTopic {
  id: string;
  label: string;
  questions: string[];
}

// Dusun names come from the published APBDes, so the examples fit every desa.
export function buildTopics(dusuns: string[]): QuestionTopic[] {
  const [firstDusun, secondDusun] = dusuns;
  const dusunQuestions = [
    firstDusun && `Berapa total belanja Dusun ${firstDusun}?`,
    secondDusun && `Kegiatan di Dusun ${secondDusun} apa saja?`,
    "Kegiatan apa saja yang belum dimulai?",
  ].filter((question): question is string => Boolean(question));

  return [
    {
      id: "jalan",
      label: "Jalan dan bangunan",
      questions: ["Dana jalan RT 3 berapa?", "Pembangunan talud sampai mana?", "Anggaran bidang pembangunan berapa?"],
    },
    {
      id: "kesehatan",
      label: "Kesehatan dan stunting",
      questions: ["Ada anggaran buat cegah stunting nggak?", "Uang posyandu yang sudah keluar berapa?"],
    },
    {
      id: "bantuan",
      label: "Bantuan sosial",
      questions: ["Berapa anggaran BLT Dana Desa?", "Ada cadangan dana untuk bencana?"],
    },
    { id: "dusun", label: "Kegiatan di dusunku", questions: dusunQuestions },
    {
      id: "layanan",
      label: "Jadwal dan layanan",
      questions: ["Kapan jadwal posyandu?", "Syarat bikin surat pengantar KTP apa?", "Kantor desa buka jam berapa?"],
    },
    {
      id: "istilah",
      label: "Arti istilah",
      questions: ["Apa itu APBDes?", "Apa itu Dana Desa?", "Bedanya anggaran sama realisasi apa?"],
    },
  ];
}
