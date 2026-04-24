import React, { createContext, useContext, useState, useCallback } from 'react';

const ConfirmContext = createContext(null);

export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider = ({ children }) => {
  const [state, setState] = useState({ isOpen: false, title: '', message: '', resolve: null });

  const confirm = useCallback((title, message) => {
    return new Promise((resolve) => {
      setState({ isOpen: true, title, message, resolve });
    });
  }, []);

  const handleConfirm = () => {
    state.resolve?.(true);
    setState({ isOpen: false, title: '', message: '', resolve: null });
  };

  const handleCancel = () => {
    state.resolve?.(false);
    setState({ isOpen: false, title: '', message: '', resolve: null });
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state.isOpen && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <h3 className="confirm-title">{state.title}</h3>
            <p className="confirm-message">{state.message}</p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
              <button className="btn btn-danger" onClick={handleConfirm}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export default ConfirmContext;
