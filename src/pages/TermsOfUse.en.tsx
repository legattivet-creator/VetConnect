import React from "react";

const TermsOfUseEN: React.FC = () => {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-white p-6">
      <div className="max-w-3xl mx-auto py-8">

        <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-primary">
          Terms of Use – VetConnect
        </h1>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Last updated: November 21, 2025
        </p>

        <p className="mb-4">
          Welcome to <strong>VetConnect</strong>, an application designed to help pet owners organize 
          their pets’ medical records, appointments, files, and reminders.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">1. About the App</h2>
        <p className="mb-4">
          VetConnect is a personal organization tool and does not replace veterinary medical care.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">2. Allowed Use</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>Register pet information;</li>
          <li>Store files (photos, videos, audio, PDFs);</li>
          <li>Receive reminders and notifications;</li>
          <li>Use medical records, scheduling, and Quick Start.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">3. Data Storage</h2>
        <p className="mb-4">
          All data is stored <strong>locally on the user's device</strong>.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">4. Official Contact</h2>
        <p className="mb-2"><strong>Emerson Legatti</strong></p>
        <p className="mb-2">Country: <strong>Portugal</strong></p>
        <p className="mb-2">NIF: <strong>309250641</strong></p>
        <p className="mb-6">Email: <strong>legattivet@gmail.com</strong></p>

      </div>
    </div>
  );
};

export default TermsOfUseEN;

