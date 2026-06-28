const tones = {
  success: 'border-[rgb(var(--success))]',
  error: 'border-[rgb(var(--signal))]',
  info: 'border-[rgb(var(--info))]',
};

const Toast = ({ message, type = 'info', onClose }) => {
  return (
    <div className={`fixed bottom-4 right-4 z-50 rounded-lg border bg-[rgb(var(--panel))] p-4 shadow-xl ${tones[type] || tones.info}`}>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-bold">{message}</span>
        <button className="font-black" onClick={onClose} type="button" aria-label="Close">
          x
        </button>
      </div>
    </div>
  );
};

export default Toast;
