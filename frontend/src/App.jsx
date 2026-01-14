import { useState, useEffect } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { Consent } from './components/steps/Consent';
import { Demographics } from './components/steps/Demographics';
import { ConditionTask } from './components/steps/ConditionTask';
import { GenuineFlow } from './components/steps/genuine/GenuineFlow';
import { PostSurvey } from './components/steps/PostSurvey';
import { Payout } from './components/steps/Payout';
import { ApparentFlow } from './components/steps/apparent/ApparentFlow';
import { CoercionFlow } from './components/steps/coercion/CoercionFlow';

import { api } from './services/api';

const STEP_NAMES = {
  1: 'Consent',
  2: 'Demographics',
  3: 'Genuine Assent',
  4: 'Apparent Assent',
  5: 'Coercion',
  6: 'Post Survey',
  7: 'Payout'
};

function App() {
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem('brp_step');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [genuineChoices, setGenuineChoices] = useState(() => {
    const saved = localStorage.getItem('brp_choices');
    return saved ? JSON.parse(saved) : null;
  });
  const [participantId, setParticipantId] = useState(() => {
    return localStorage.getItem('brp_pid') || null;
  });
  const [condition, setCondition] = useState(() => {
    return localStorage.getItem('brp_condition') || null;
  });

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('brp_step', currentStep.toString());
  }, [currentStep]);

  useEffect(() => {
    if (participantId) localStorage.setItem('brp_pid', participantId);
  }, [participantId]);

  useEffect(() => {
    if (condition) localStorage.setItem('brp_condition', condition);
  }, [condition]);

  useEffect(() => {
    if (genuineChoices) localStorage.setItem('brp_choices', JSON.stringify(genuineChoices));
  }, [genuineChoices]);

  const handleNext = (pid, cond, choices) => {
    // Logic to update state if provided
    if (pid) setParticipantId(pid);
    if (cond) setCondition(Array.isArray(cond) ? cond.join('-') : cond);
    if (choices && typeof choices === 'object') setGenuineChoices(prev => ({ ...prev, ...choices }));

    // Move to next step
    if (currentStep < 7) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      window.scrollTo(0, 0);

      // Sync to backend
      if (participantId) {
        api.updateParticipant(participantId, {
          currentStep: STEP_NAMES[nextStep] || `Step ${nextStep}`
        }).catch(err => console.error("Step sync error:", err));
      }
    }
  };

  const handleReset = () => {
    // Clear all local storage keys
    localStorage.removeItem('brp_step');
    localStorage.removeItem('brp_pid');
    localStorage.removeItem('brp_condition');
    localStorage.removeItem('brp_choices');

    // Reset state
    setParticipantId(null);
    setCondition(null);
    setGenuineChoices(null);
    setCurrentStep(1);

    // Scroll to top
    window.scrollTo(0, 0);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Consent onNext={handleNext} />;
      case 2:
        return <Demographics onNext={handleNext} participantId={participantId} />;
      case 3:
        return <GenuineFlow onNext={handleNext} participantId={participantId} />;
      case 4:
        return <ApparentFlow onNext={handleNext} participantId={participantId} genuineChoices={genuineChoices} />;
      case 5:
        return <CoercionFlow onNext={handleNext} participantId={participantId} genuineChoices={genuineChoices} />;
      case 6:
        return <PostSurvey onNext={handleNext} />;
      case 7:
        return <Payout onReset={handleReset} />;
      default:
        return <div>Unknown Step</div>;
    }
  };

  return (
    <MainLayout
      currentStep={currentStep}
      participantId={participantId}
      condition={condition}
    >
      {renderStep()}
    </MainLayout>
  );
}

export default App;
