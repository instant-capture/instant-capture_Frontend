import { useState } from 'react'
import './App.css'
import PhotoSelector from './PhotoSelector'
import LandingPage from './LandingPage'
import Modal from './Modal'
import TrainingFlow from './TrainingFlow'
import TrainingDashboard from './TrainingDashboard'
import RankingPage from './RankingPage'

function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing', 'selector', 'training', 'dashboard', 'ranking'
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleStart = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleModalConfirm = () => {
    setIsModalOpen(false);
    setCurrentView('selector');
  };

  const handlePhotoConfirm = (photoId) => {
    console.log('Selected photo:', photoId);
    setCurrentView('training');
  };

  const handleStartTraining = () => {
    setCurrentView('dashboard');
  };

  const handleFinishTraining = () => {
    setCurrentView('ranking');
  };

  const handleHome = () => {
    setCurrentView('landing');
  };

  return (
    <>
      {currentView === 'landing' && (
        <LandingPage onStart={handleStart} />
      )}

      {currentView === 'selector' && (
        <PhotoSelector onConfirm={handlePhotoConfirm} />
      )}

      {currentView === 'training' && (
        <TrainingFlow onStartTraining={handleStartTraining} />
      )}

      {currentView === 'dashboard' && (
        <TrainingDashboard onFinish={handleFinishTraining} />
      )}

      {currentView === 'ranking' && (
        <RankingPage onHome={handleHome} />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
      />
    </>
  )
}

export default App
