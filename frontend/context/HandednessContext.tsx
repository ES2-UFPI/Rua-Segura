import React, { createContext, useContext, useState } from 'react';

interface HandednessContextProps {
  isRightHanded: boolean;
  setIsRightHanded: (val: boolean) => void;
}

const HandednessContext = createContext<HandednessContextProps | undefined>(undefined);

export function HandednessProvider({ children }: { children: React.ReactNode }) {
  const [isRightHanded, setIsRightHanded] = useState(true);

  return (
    <HandednessContext.Provider value={{ isRightHanded, setIsRightHanded }}>
      {children}
    </HandednessContext.Provider>
  );
}

export function useHandedness() {
  const context = useContext(HandednessContext);
  if (context === undefined) {
    throw new Error('useHandedness must be used within a HandednessProvider');
  }
  return context;
}
