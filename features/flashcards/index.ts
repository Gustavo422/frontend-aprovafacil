// Services
export { FlashcardsService } from './services/flashcards-service';

// Components
export { Flashcard } from './components/flashcard';

// Hooks
export { useFlashcards, useFlashcardStudy } from './hooks/use-flashcards';

// Types (re-export from central types)
export type {
  FlashcardProgressData,
  FlashcardFilters,
  FlashcardInsert,
  FlashcardUpdate,
} from '../../core/database/types'; 