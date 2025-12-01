import React, { useState, useEffect } from 'react';
import { FaDownload, FaCheck } from 'react-icons/fa';

const InstallButton = ({ className = '' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setShowButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app was already installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowButton(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowButton(false);
  };

  if (isInstalled) {
    return (
      <button
        disabled
        className={`flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-lg cursor-not-allowed ${className}`}
        title="App is installed"
      >
        <FaCheck className="text-sm" />
        <span className="text-sm">Installed</span>
      </button>
    );
  }

  if (!showButton) {
    return null;
  }

  return (
    <button
      onClick={handleInstallClick}
      className={`flex items-center space-x-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors ${className}`}
      title="Install App"
    >
      <FaDownload className="text-sm" />
      <span className="text-sm">Install App</span>
    </button>
  );
};

export default InstallButton;

