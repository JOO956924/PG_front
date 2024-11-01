// ReservationContext.tsx
import React, {createContext, useContext, useState, ReactNode} from 'react'

interface ReservationContextProps {
  reservationCounts: Record<number, number>
  setReservationCounts: React.Dispatch<React.SetStateAction<Record<number, number>>>
}

const ReservationContext = createContext<ReservationContextProps | undefined>(undefined)

export const ReservationProvider = ({children}: {children: ReactNode}) => {
  const [reservationCounts, setReservationCounts] = useState<Record<number, number>>({})

  return (
    <ReservationContext.Provider value={{reservationCounts, setReservationCounts}}>
      {children}
    </ReservationContext.Provider>
  )
}

export const useReservationContext = () => {
  const context = useContext(ReservationContext)
  if (!context) {
    throw new Error('useReservationContext must be used within a ReservationProvider')
  }
  return context
}
