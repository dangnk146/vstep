'use client';

import React, { useState } from 'react';
import { useSpeakingAudio } from './hooks/useSpeakingAudio';
import { useSpeakingTimer } from './hooks/useSpeakingTimer';
import { useSpeakingExam } from './hooks/useSpeakingExam';
import { SpeakingHeader } from './components/SpeakingHeader';
import { SpeakingTimerBar } from './components/SpeakingTimerBar';
import { SpeakingExamEditor } from './components/SpeakingExamEditor';
import { SpeakingAudioControls } from './components/SpeakingAudioControls';
import { SpeakingSidebarPanel } from './components/SpeakingSidebarPanel';
import { SpeakingPreparationOverlay } from './components/SpeakingPreparationOverlay';
import { SpeakingHintPanel } from './components/SpeakingHintPanel';
import type { SpeakingPart } from './types';

export default function SpeakingSimulation() {
  const {
    activePart,
    activeExamId,
    examHtml,
    examKey,
    hasExamContent,
    isSubmitted,
    isLoadingRandomPrompt,
    setActivePart,
    setIsSubmitted,
    handleRandomPrompt,
    handleEditorInput,
  } = useSpeakingExam();

  const [isHintOpen, setIsHintOpen] = useState<boolean>(true);

  const {
    recorderStatus,
    recorderError,
    audioUrl,
    waveformLevels,
    audioRef,
    startRecording,
    stopMedia,
    clearRecording,
  } = useSpeakingAudio(activePart);

  const {
    settings,
    remainingTimes,
    preparationRemaining,
    timerPhase,
    runningPart,
    getSeconds,
    updateSetting,
    clearTimers,
    runSpeakingTimer,
    startPreparationCountdown,
    setRunningPart,
    setTimerPhase,
    setPreparationRemaining,
    setRemainingTimes,
  } = useSpeakingTimer();

  const beginSpeaking = async (part: SpeakingPart, duration: number) => {
    const recordingStarted = await startRecording();
    if (!recordingStarted) {
      clearTimers();
      setRunningPart(null);
      setTimerPhase('idle');
      return;
    }

    setTimerPhase('speaking');
    runSpeakingTimer(part, duration, () => {
      stopMedia(false);
    });
  };

  const handleRunPart = (part: SpeakingPart) => {
    clearTimers();
    stopMedia(true);
    setActivePart(part);
    setIsSubmitted(false);
    setRunningPart(part);
    setRemainingTimes((previous) => ({ ...previous, [part]: getSeconds(part) }));

    const prepDuration = part === 'part1' ? 0 : getSeconds('prep');
    const speakingDuration = getSeconds(part);

    if (prepDuration === 0) {
      setPreparationRemaining(0);
      setTimerPhase('speaking');
      void beginSpeaking(part, speakingDuration);
      return;
    }

    startPreparationCountdown(part, prepDuration, () => {
      void beginSpeaking(part, speakingDuration);
    });
  };

  const handleStopRecording = () => {
    clearTimers();
    setRunningPart(null);
    setPreparationRemaining(null);
    setTimerPhase('idle');
    stopMedia(false);
  };

  const handleSubmitPractice = () => {
    clearTimers();
    setRunningPart(null);
    setPreparationRemaining(null);
    setTimerPhase('complete');
    stopMedia(false);
    setIsSubmitted(true);
  };

  const handleResetTimers = () => {
    clearTimers();
    setRunningPart(null);
    setPreparationRemaining(null);
    setTimerPhase('idle');
    setIsSubmitted(false);
    stopMedia(true);
    void clearRecording();
    setRemainingTimes({
      part1: getSeconds('part1'),
      part2: getSeconds('part2'),
      part3: getSeconds('part3'),
    });
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto flex flex-col space-y-2 animate-fade-in px-2 sm:px-4 pb-12 sm:pb-6">
      <SpeakingHeader
        onRandomPrompt={handleRandomPrompt}
        isLoadingRandomPrompt={isLoadingRandomPrompt}
        isHintOpen={isHintOpen}
        onToggleHint={() => setIsHintOpen((prev) => !prev)}
      />

      {timerPhase === 'preparing' && preparationRemaining !== null && (
        <SpeakingPreparationOverlay
          remainingSeconds={preparationRemaining}
          durationSeconds={getSeconds('prep')}
        />
      )}

      {/* Container fluid: 70% left (Simulation) + 30% right (Speaking Hint Outline Table) */}
      <div
        className={`grid w-full items-start gap-2.5 ${isHintOpen
            ? 'grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]'
            : 'grid-cols-1'
          }`}
      >
        {/* Left Column (70%): Core Speaking Simulation */}
        <section className="grid overflow-hidden rounded-sm border border-border bg-card shadow-xs lg:grid-cols-[minmax(0,1fr)_195px]">
          <main className="min-w-0 border-b border-border lg:border-b-0 lg:border-r">
            <SpeakingTimerBar
              activePart={activePart}
              runningPart={runningPart}
              recorderStatus={recorderStatus}
              timerPhase={timerPhase}
              preparationRemaining={preparationRemaining}
              remainingTime={remainingTimes[activePart]}
              maxDuration={getSeconds(activePart)}
              onToggleRun={() =>
                runningPart ? handleStopRecording() : handleRunPart(activePart)
              }
            />

            <SpeakingExamEditor
              examHtml={examHtml}
              examKey={examKey}
              onInput={handleEditorInput}
            />

            <SpeakingAudioControls
              recorderStatus={recorderStatus}
              recorderError={recorderError}
              timerPhase={timerPhase}
              isRunning={runningPart !== null}
              audioUrl={audioUrl}
              audioRef={audioRef}
              onManualRecord={() => handleRunPart(activePart)}
              onStopRecording={handleStopRecording}
              onResetTimers={handleResetTimers}
            />
          </main>

          <SpeakingSidebarPanel
            recorderStatus={recorderStatus}
            waveformLevels={waveformLevels}
            isSubmitted={isSubmitted}
            hasExamContent={hasExamContent}
            timerPhase={timerPhase}
            activePart={activePart}
            preparationRemaining={preparationRemaining}
            remainingTimes={remainingTimes}
            settings={settings}
            getSeconds={getSeconds}
            updateSetting={updateSetting}
          />
        </section>

        {/* Right Column: Speaking Hint & Outline Table */}
        {isHintOpen && (
          <div className="min-w-0 sticky top-2 flex flex-col h-[calc(100vh-60px)] min-h-[550px]">
            <SpeakingHintPanel
              activeExamId={activeExamId}
              isOpen={isHintOpen}
              onToggle={() => setIsHintOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Floating button when collapsed */}
      {!isHintOpen && (
        <SpeakingHintPanel
          activeExamId={activeExamId}
          isOpen={false}
          onToggle={() => setIsHintOpen(true)}
        />
      )}
    </div>
  );
}