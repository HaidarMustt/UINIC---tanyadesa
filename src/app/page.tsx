import { redirect } from "next/navigation";

// The demo has one desa. Later this becomes a landing page listing all desa.
export default function HomePage() {
  redirect("/desa/sukamaju");
}