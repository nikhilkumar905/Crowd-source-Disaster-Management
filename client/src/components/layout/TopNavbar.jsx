import { FiBell, FiMoon } from 'react-icons/fi';

const TopNavbar = () => {
  return (
    <div className="flex items-center justify-between border-b border-[rgb(var(--line))] bg-[rgb(var(--panel))] p-4">
      <div>
        <div className="text-lg font-black">Dashboard</div>
        <div className="ops-mono text-xs text-[rgb(var(--muted))]">Operational console</div>
      </div>
      <div className="flex items-center gap-2">
        <button className="btn-ghost" type="button" aria-label="Notifications">
          <FiBell />
        </button>
        <button className="btn-ghost" type="button" aria-label="Theme">
          <FiMoon />
        </button>
      </div>
    </div>
  );
};

export default TopNavbar;
