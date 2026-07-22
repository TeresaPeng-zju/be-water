import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {DiagnosisFlow} from "@/components/diagnosis/diagnosis-flow";

export default async function DiagnosisPage() {
  const cookieStore = await cookies();
  if (cookieStore.get("BEWATER_DIAGNOSIS_COMPLETED")?.value === "1") redirect("/workspace#insights");
  return <DiagnosisFlow/>;
}
