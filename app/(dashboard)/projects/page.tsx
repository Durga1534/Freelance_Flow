"use client";
import { useState } from "react";
import ProjectsList from "./ProjectsList";
import ProjectsForm from "./ProjectsForm";

const Page = () => {
  const [showModal, setShowModal] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const handleProjectAdded = () => {
    setShowModal(false);
    setRefresh((r) => r + 1);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <button
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition"
          onClick={() => setShowModal(true)}
        >
          New Project
        </button>
      </div>
      <ProjectsList key={refresh} />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card p-6 rounded shadow-lg w-full max-w-lg relative">
            <button
              className="absolute top-2 right-2 text-xl"
              onClick={() => setShowModal(false)}
            >
              &times;
            </button>
            <ProjectsForm
              isOpen={showModal}
              onClose={() => setShowModal(false)}
              onProjectAdded={handleProjectAdded}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;