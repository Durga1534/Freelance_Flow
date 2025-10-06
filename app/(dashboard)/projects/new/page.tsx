"use client";
import { useRouter } from "next/navigation";
import ProjectsForm from "../ProjectsForm";

export default function NewProjectPage() {
  const router = useRouter();
  return (
    <div className="max-w-xl mx-auto mt-8">
      <ProjectsForm  
        onProjectAdded={() => router.push("/projects")}
        isOpen={true}
        onClose={() => router.push("/projects")}
      />
    </div>
  );
}