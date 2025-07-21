"use client";
import { useRouter } from "next/navigation";
import ClientForm from "../ClientForm";

export default function NewClientPage() {
  const router = useRouter();
  return (
    <div className="max-w-xl mx-auto mt-8">
      <ClientForm onClientAdded={() => router.push("/clients")} />
    </div>
  );
}