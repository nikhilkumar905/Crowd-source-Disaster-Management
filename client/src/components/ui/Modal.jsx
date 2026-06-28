const Modal = ({ isOpen, onClose, title, children, actions = null }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-lg p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black">{title}</h3>
          <button className="btn-ghost" onClick={onClose} type="button" aria-label="Close">
            x
          </button>
        </div>
        <div className="mb-4">{children}</div>
        {actions && <div className="flex justify-end gap-2">{actions}</div>}
      </div>
    </div>
  );
};

export default Modal;
