'use client';

import React from 'react';
import { useSpeakingAudio } from './hooks/useSpeakingAudio';
import { useSpeakingTimer } from './hooks/useSpeakingTimer';
import { useSpeakingExam } from './hooks/useSpeakingExam';
import { SpeakingHeader } from './components/SpeakingHeader';
import { SpeakingTimerBar } from './components/SpeakingTimerBar';
import { SpeakingExamEditor } from './components/SpeakingExamEditor';
import { SpeakingAudioControls } from './components/SpeakingAudioControls';
import { SpeakingSidebarPanel } from './components/SpeakingSidebarPanel';
import { SpeakingPreparationOverlay } from './components/SpeakingPreparationOverlay';
import { ExamHintDrawer } from '@/components/ExamHintDrawer';
import { useHintOpen } from '@/hooks/useHintOpen';
import type { SpeakingPart } from './types';

export default function SpeakingSimulation() {
  const {
    activePart,
    activePrompts,
    isLoadingHint,
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

  const [isHintOpen, setIsHintOpen] = useHintOpen();
  const hasHint = activePrompts.some((prompt) => Boolean(prompt.hint));

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

  const hintItems = activePrompts.map((prompt) => ({
    id: prompt.id,
    title: prompt.title,
    hint: prompt.hint,
  }));

  return (
    <>
      <div
        className={`w-full transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isHintOpen ? 'md:pr-[30vw]' : 'md:pr-0'
        }`}
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col space-y-2 animate-fade-in pb-12 sm:pb-6">
          <SpeakingHeader
            onRandomPrompt={handleRandomPrompt}
            isLoadingRandomPrompt={isLoadingRandomPrompt}
            hasHint={hasHint}
            isHintOpen={isHintOpen}
            onToggleHint={() => setIsHintOpen((prev) => !prev)}
          />

          {timerPhase === 'preparing' && preparationRemaining !== null && (
            <SpeakingPreparationOverlay
              remainingSeconds={preparationRemaining}
              durationSeconds={getSeconds('prep')}
            />
          )}

          <div className="w-full">
            {/* Core Speaking Simulation */}
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
          </div>

          <ExamHintDrawer
            mode="inline"
            isOpen={isHintOpen}
            onClose={() => setIsHintOpen(false)}
            isLoading={isLoadingHint}
            items={hintItems}
          />
        </div>
      </div>

      {/* Rendered outside animate-fade-in so fixed 30vw pane anchors to the real viewport */}
      <ExamHintDrawer
        mode="desktop"
        isOpen={isHintOpen}
        onClose={() => setIsHintOpen(false)}
        isLoading={isLoadingHint}
        items={hintItems}
      />
    </>
  );
}