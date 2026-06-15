import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ChatbotButton from '../assistant/ChatbotButton';
import ChatbotPanel from '../assistant/ChatbotPanel';
import { APPEARANCE_EVENT, applyAppearanceSettings, getStoredAppearanceSettings } from '../../services/settingsService';

export default function AppLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => getStoredAppearanceSettings().sidebarMode === 'compact');
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [appearance, setAppearance] = useState(getStoredAppearanceSettings);

  useEffect(() => {
    applyAppearanceSettings(appearance);

    function handleAppearance(event) {
      const next = event.detail || getStoredAppearanceSettings();
      setAppearance(next);
      applyAppearanceSettings(next);
    }

    window.addEventListener(APPEARANCE_EVENT, handleAppearance);
    window.addEventListener('storage', handleAppearance);
    return () => {
      window.removeEventListener(APPEARANCE_EVENT, handleAppearance);
      window.removeEventListener('storage', handleAppearance);
    };
  }, []);

  useEffect(() => {
    function openAssistant() {
      setAssistantOpen(true);
    }
    window.addEventListener('orbem:open-assistant', openAssistant);
    return () => window.removeEventListener('orbem:open-assistant', openAssistant);
  }, []);

  const collapsed = sidebarCollapsed;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f8fb]">
      <div
        className="fixed left-0 top-0 z-50 hidden h-screen w-4 lg:block"
        onMouseEnter={() => setSidebarCollapsed(false)}
        aria-hidden="true"
      />
      <Sidebar
        open={mobileSidebarOpen}
        collapsed={collapsed}
        onClose={() => setMobileSidebarOpen(false)}
        onExpand={() => setSidebarCollapsed(false)}
        onCollapse={() => setSidebarCollapsed(true)}
      />
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden transition-all duration-300">
        <Topbar onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4 lg:px-7 lg:py-6">
          <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-5">
            <Outlet />
          </div>
        </main>
      </div>
      <ChatbotButton onClick={() => setAssistantOpen(true)} />
      <ChatbotPanel open={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </div>
  );
}
