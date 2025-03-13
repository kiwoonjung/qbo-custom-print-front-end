const Modal = ({ show, onClose, children }) => {
  if (!show) return null;

  return (
    <div className="overflow-scroll">
      <div className="w-full h-full">
        <button className="absolute top-2 right-2 text-lg" onClick={onClose}>
          X
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
