"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Modal from './Modal';
import DemoAccessModal from './DemoAccessModal';
import ConsultationModal from './ConsultationModal';
import KPModal from './KPModal';
import SolutionRequestModal from './SolutionRequestModal';

interface ModalContextProps {
  openRegister: () => void;
  openDemo: () => void;
  openConsult: () => void;
  openKP: () => void;
  openSolutionRequest: () => void;
}

export const ModalContext = createContext<ModalContextProps | undefined>(undefined);

export const useModal = () => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within ModalContext');
  return ctx;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [consultModalOpen, setConsultModalOpen] = useState(false);
  const [kpModalOpen, setKpModalOpen] = useState(false);
  const [solutionRequestModalOpen, setSolutionRequestModalOpen] = useState(false);

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);
  const openDemoModal = () => setDemoModalOpen(true);
  const closeDemoModal = () => setDemoModalOpen(false);
  const openConsultModal = () => setConsultModalOpen(true);
  const closeConsultModal = () => setConsultModalOpen(false);
  const openKpModal = () => setKpModalOpen(true);
  const closeKpModal = () => setKpModalOpen(false);
  const openSolutionRequestModal = () => setSolutionRequestModalOpen(true);
  const closeSolutionRequestModal = () => setSolutionRequestModalOpen(false);

  // Обработчик событий для открытия модальных окон
  useEffect(() => {
    const handleOpenKPModal = () => {
      openKpModal();
    };

    const handleOpenConsultModal = () => {
      openConsultModal();
    };

    window.addEventListener('openKPModal', handleOpenKPModal);
    window.addEventListener('openConsultModal', handleOpenConsultModal);

    return () => {
      window.removeEventListener('openKPModal', handleOpenKPModal);
      window.removeEventListener('openConsultModal', handleOpenConsultModal);
    };
  }, []);

  return (
    <ModalContext.Provider value={{ 
      openRegister: openModal, 
      openDemo: openDemoModal, 
      openConsult: openConsultModal, 
      openKP: openKpModal,
      openSolutionRequest: openSolutionRequestModal
    }}>
      {children}
      <Modal open={modalOpen} onClose={closeModal} />
      <DemoAccessModal open={demoModalOpen} onClose={closeDemoModal} />
      <ConsultationModal open={consultModalOpen} onClose={closeConsultModal} />
      <KPModal open={kpModalOpen} onClose={closeKpModal} />
      <SolutionRequestModal open={solutionRequestModalOpen} onClose={closeSolutionRequestModal} />
    </ModalContext.Provider>
  );
}; 