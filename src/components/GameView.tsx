import React from 'react';
import { GameState, HostPersonality, ScoreBreakdown, TriviaQuestion } from '../types';
import { HostStage } from './HostStage';
import { GameSetupModal } from './GameSetupModal';
import { TriviaQuestionCard } from './TriviaQuestionCard';
import { GameOverSummary } from './GameOverSummary';

interface GameViewProps {
  gameState: GameState;
  personality: HostPersonality;
  onStartGame: (settings: any) => Promise<void>;
  onOpenPersonalitySelector: () => void;
  onOpenDailyBonus: () => void;
  isLoadingTrivia: boolean;
  selectedOption: number | null;
  hasAnswered: boolean;
  onSelectOption: (optionIndex: number) => Promise<void>;
  onNextQuestion: () => Promise<void>;
  onUse5050: () => Promise<void>;
  onUseHint: () => Promise<void>;
  onUseSearchGrounding: () => Promise<void>;
  onToggleDoubleDown: () => void;
  isLoadingLifeline: boolean;
  timeRemaining: number;
  maxTime: number;
  scoreBreakdown: ScoreBreakdown | null;
  onPlayAgain: () => void;
  onSelectNewHost: () => void;
  onReplaySpeech: () => void;
  onOpenLeaderboard: (id?: string) => void;
}

export const GameView: React.FC<GameViewProps> = ({
  gameState,
  personality,
  onStartGame,
  onOpenPersonalitySelector,
  onOpenDailyBonus,
  isLoadingTrivia,
  selectedOption,
  hasAnswered,
  onSelectOption,
  onNextQuestion,
  onUse5050,
  onUseHint,
  onUseSearchGrounding,
  onToggleDoubleDown,
  isLoadingLifeline,
  timeRemaining,
  maxTime,
  scoreBreakdown,
  onPlayAgain,
  onSelectNewHost,
  onReplaySpeech,
  onOpenLeaderboard,
}) => {
  return (
    <>
      <HostStage
        personality={personality}
        mood={gameState.hostMood}
        speechText={gameState.hostSpeechText}
        isSpeaking={gameState.isHostSpeaking}
        isLoadingVoice={false} // Should be passed in
        onReplayVoice={onReplaySpeech}
        onOpenLiveVoice={() => {}} // Should be passed in
      />

      {gameState.status === 'setup' && (
        <GameSetupModal
          personality={personality}
          onStartGame={onStartGame}
          onOpenPersonalitySelector={onOpenPersonalitySelector}
          onOpenDailyBonus={onOpenDailyBonus}
          isLoading={isLoadingTrivia}
        />
      )}

      {gameState.status === 'playing' && gameState.questions.length > 0 && (
        <TriviaQuestionCard
          question={gameState.questions[gameState.currentIndex]}
          selectedOption={selectedOption}
          hasAnswered={hasAnswered}
          onSelectOption={onSelectOption}
          onNextQuestion={onNextQuestion}
          lifelines={gameState.lifelines}
          eliminatedOptions={gameState.eliminatedOptions}
          onUse5050={onUse5050}
          onUseHint={onUseHint}
          onUseSearchGrounding={onUseSearchGrounding}
          onToggleDoubleDown={onToggleDoubleDown}
          currentHint={gameState.currentHint}
          searchFact={gameState.currentSearchFact}
          isLoadingLifeline={isLoadingLifeline}
          timeRemaining={timeRemaining}
          maxTime={maxTime}
          isDoubleDownActive={gameState.lifelines.doubleDownActive}
          scoreBreakdown={scoreBreakdown}
        />
      )}

      {gameState.status === 'game_over' && (
        <GameOverSummary
          state={gameState}
          personality={personality}
          onPlayAgain={onPlayAgain}
          onSelectNewHost={onSelectNewHost}
          onReplayFinalSpeech={onReplaySpeech}
          onOpenLeaderboard={onOpenLeaderboard}
          onOpenDailyBonus={onOpenDailyBonus}
        />
      )}
    </>
  );
};
