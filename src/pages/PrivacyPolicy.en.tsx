import React from "react";

const PrivacyPolicyEN: React.FC = () => {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-white p-6">
      <div className="max-w-3xl mx-auto py-8">

        <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-primary">
          Privacy Policy – VetConnect
        </h1>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Last updated: November 21, 2025
        </p>

        <p className="mb-4">
          <strong>VetConnect</strong> is an application designed to help pet owners
          organize and manage their pets’ information, including medical records,
          appointments, files, reminders, and health notes.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">1. Information Collected</h2>
        <p className="mb-4">The app may store:</p>

        <ul className="list-disc pl-6 mb-4">
          <li>Registered email;</li>
          <li>Pet details (name, breed, age, photo, etc.);</li>
          <li>Appointments and reminders;</li>
          <li>Uploaded files (PDF, photos, videos, audio);</li>
          <li>Quick Start captures (photo, video, audio);</li>
          <li>User preferences (theme, language, background);</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">2. Where Data Is Stored</h2>
        <p className="mb-4">
          All data is stored <strong>locally on the user's device</strong>, using:
        </p>

        <ul className="list-disc pl-6 mb-4">
          <li><strong>localStorage</strong> for app data;</li>
          <li><strong>local files</strong> for photos, videos, and documents.</li>
        </ul>

        <p className="mb-4">
          No data is automatically sent to external servers. Cloud sync will only be included in future paid versions.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">3. How Information Is Used</h2>
        <p className="mb-4">Data is used solely for:</p>

        <ul className="list-disc pl-6 mb-4">
          <li>Pet organization and records;</li>
          <li>Medical history and reminders;</li>
          <li>Quick Start functionality;</li>
          <li>User personalization;</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">4. Security</h2>
        <p className="mb-4">
          Since data is stored locally, security depends on the user's device (password, biometrics, updates, and physical protection).
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">5. User Rights</h2>
        <p className="mb-4">The user may:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>delete any stored data;</li>
          <li>delete pets or files individually;</li>
          <li>uninstall the app to remove all data;</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">6. Changes to This Policy</h2>
        <p className="mb-4">
          This policy may be updated for improvements, compliance or technical reasons. The latest version is always available in the app.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">7. Official Contact</h2>

        <p className="mb-2"><strong>Emerson Legatti</strong></p>
        <p className="mb-2">Country: <strong>Portugal</strong></p>
        <p className="mb-2">NIF: <strong>309250641</strong></p>
        <p className="mb-6">Email: <strong>legattivet@gmail.com</strong></p>

        <p className="mt-10 text-gray-600 dark:text-gray-300">
          By using VetConnect, you agree to this Privacy Policy.
        </p>

      </div>
    </div>
  );
};

export default PrivacyPolicyEN;

