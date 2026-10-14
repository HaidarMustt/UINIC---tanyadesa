// Sends one test question to the AI provider and prints the structured answer.
// Run: npx tsx --env-file=.env scripts/check-ai.ts

async function main() {
  const baseUrl = process.env.AI_BASE_URL;
  const model = process.env.AI_MODEL;
  const apiKey = process.env.AI_API_KEY;
  if (!baseUrl || !model || !apiKey) {
    throw new Error("AI_BASE_URL, AI_MODEL, dan AI_API_KEY harus diisi di .env");
  }

  const startedAt = Date.now();
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "Ubah pertanyaan warga menjadi JSON. Isi nama dusun dan kata kunci kegiatannya.",
        },
        { role: "user", content: "Irigasi Tegalsari udah jadi belum?" },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "test_intent",
          strict: true,
          schema: {
            type: "object",
            properties: {
              dusun: { type: ["string", "null"] },
              keywords: { type: "array", items: { type: "string" } },
            },
            required: ["dusun", "keywords"],
            additionalProperties: false,
          },
        },
      },
    }),
  });

  if (!response.ok) {
    console.error(`Gagal (${response.status}):`, await response.text());
    process.exit(1);
  }

  const data = await response.json();
  console.log(`Waktu: ${Date.now() - startedAt} ms`);
  console.log("Balasan AI:", data.choices[0].message.content);
}

main();
