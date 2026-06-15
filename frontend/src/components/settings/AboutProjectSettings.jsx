import { Boxes, Building2, Code2, GraduationCap, Info, Scale } from 'lucide-react';
import SettingsRow from './SettingsRow';

export default function AboutProjectSettings() {
  const buildDate = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' });
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-950">About Project</h1>
        <p className="mt-1 text-sm text-gray-500">Project metadata and academic usage information.</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
        <div className="divide-y divide-gray-100">
          <SettingsRow icon={Info} title="Operations Performance Dashboard" description="Version 1.0.0 for logistics operations management." />
          <SettingsRow icon={Building2} title="ORBEM Solutions Private Limited" description="Air cargo, shipment tracking, documents, payments, alerts, reporting, and assistant workflows." />
          <SettingsRow icon={Code2} title="Tech stack" description="React, Vite, Tailwind CSS, Node.js, Express, MySQL, JWT, Axios, Recharts, and Lucide React." />
          <SettingsRow icon={GraduationCap} title="Internship project information" description="Built as an academic/internship operations dashboard project with room for production hardening." />
          <SettingsRow icon={Boxes} title="Team members" description="Team member names can be added here before final submission." />
          <SettingsRow icon={Scale} title="Build and license" description={`Build date: ${buildDate}. Academic use note: for learning, demonstration, and internal evaluation.`} />
        </div>
      </div>
    </div>
  );
}
