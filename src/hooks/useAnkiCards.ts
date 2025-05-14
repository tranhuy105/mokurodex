import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AnkiCardsStore {
  cardsToClean: number[]; // Array of card IDs that need cleaning
  addCardToClean: (cardId: number) => void;
  removeCardFromClean: (cardId: number) => void;
  clearCardsToClean: () => void;
}

export const useAnkiCards = create<AnkiCardsStore>()(
  persist(
    (set) => ({
      cardsToClean: [],
      addCardToClean: (cardId) =>
        set((state) => ({
          cardsToClean: state.cardsToClean.includes(cardId)
            ? state.cardsToClean
            : [...state.cardsToClean, cardId]
        })),
      removeCardFromClean: (cardId) =>
        set((state) => ({
          cardsToClean: state.cardsToClean.filter((id) => id !== cardId)
        })),
      clearCardsToClean: () => set({ cardsToClean: [] })
    }),
    {
      name: 'manga-reader-anki-cards'
    }
  )
);
