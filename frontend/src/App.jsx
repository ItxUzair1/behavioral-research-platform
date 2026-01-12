import { useState, useEffect } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { Consent } from './components/steps/Consent';
import { Demographics } from './components/steps/Demographics';
import { ConditionTask } from './components/steps/ConditionTask';
import { GenuineFlow } from './components/steps/genuine/GenuineFlow';
import { PostSurvey } from './components/steps/PostSurvey';
import { Payout } from './components/steps/Payout';

function App() {
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem('brp_step');
    return saved ? parseInt(saved, 10) : 1;
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

  const handleNext = (pid, cond) => {
    // Logic to update state if provided
    if (pid) setParticipantId(pid);
    if (cond) setCondition(Array.isArray(cond) ? cond.join('-') : cond);

    // Move to next step
    if (currentStep < 7) {
      setCurrentStep(curr => curr + 1);
      window.scrollTo(0, 0);
    }
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
        return <ConditionTask variant="apparent" onNext={handleNext} />;
      case 5:
        return <ConditionTask variant="coercion" onNext={handleNext} />;
      case 6:
        return <PostSurvey onNext={handleNext} />;
      case 7:
        return <Payout />;
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
