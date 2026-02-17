import { useState, useEffect } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { Consent } from './components/steps/Consent';
import { WelcomeScreen } from './components/steps/WelcomeScreen';
import { Demographics } from './components/steps/Demographics';
import { ConditionTask } from './components/steps/ConditionTask';
import { GenuineFlow } from './components/steps/genuine/GenuineFlow';
import { PostSurvey } from './components/steps/PostSurvey';
import { Payout } from './components/steps/Payout';
import { PreTrainingFlow } from './components/steps/PreTrainingFlow';
import { ApparentFlow } from './components/steps/apparent/ApparentFlow';
import { CoercionFlow } from './components/steps/coercion/CoercionFlow';

import { AdminApp } from './AdminApp';

import { api } from './services/api';

const STEP_NAMES = {
  1: 'Consent',
  2: 'Demographics',
  3: 'Pre-Training',
  4: 'Genuine Assent',
  5: 'Apparent Assent',
  6: 'Coercion',
  7: 'Post Survey',
  8: 'Payout'
};

function App() {
  // Simple check for Admin Route
  // In a full app with React Router, this would be a <Route>
  // Here we check pathname directly on init.
  const isAdminRoute = window.location.pathname === '/admin';

  if (isAdminRoute) {
    return <AdminApp />;
  }

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

  const [daysCompleted, setDaysCompleted] = useState(0);
  const [startingBalance, setStartingBalance] = useState(0);

  const [showWelcome, setShowWelcome] = useState(() => {
    // If we have a saved participant, don't show welcome — we'll auto-resume
    return !localStorage.getItem('brp_pid');
  });
  const [isAutoResuming, setIsAutoResuming] = useState(() => {
    return !!localStorage.getItem('brp_pid');
  });

  // Auto-resume: if participantId is saved, validate with backend and restore session
  useEffect(() => {
    const savedPid = localStorage.getItem('brp_pid');
    if (!savedPid) return;

    const autoResume = async () => {
      try {
        const data = await api.validateParticipant(savedPid);
        if (data.success) {
          setParticipantId(data.participantId);
          if (data.conditionOrder) setCondition(data.conditionOrder.join('-'));
          setDaysCompleted(data.days_completed || 0);
          setStartingBalance(data.startingBalance || 0);

          // Restore genuine choices from backend or localStorage
          if (data.genuineChoices) {
            setGenuineChoices(data.genuineChoices);
          }

          // Map currentStep name to step number
          let stepNum = 1;
          const stepName = data.currentStep;
          const entry = Object.entries(STEP_NAMES).find(([key, val]) => val === stepName);
          if (entry) {
            stepNum = parseInt(entry[0], 10);
          } else if (stepName && stepName.startsWith('Step ')) {
            stepNum = parseInt(stepName.split(' ')[1], 10);
          }
          if (isNaN(stepNum) || stepNum < 1) stepNum = 1;

          setCurrentStep(stepNum);
          setShowWelcome(false);
        } else {
          // Participant not found or invalid — fall back to welcome
          setShowWelcome(true);
        }
      } catch (err) {
        console.error("Auto-resume failed:", err);
        // Fall back to welcome screen
        setShowWelcome(true);
      } finally {
        setIsAutoResuming(false);
      }
    };

    autoResume();
  }, []);

  const handleStartNew = () => {
    // Start Study: Go to Consent (Step 1)
    setShowWelcome(false);
    setParticipantId(null);
    setCondition(null);
    setGenuineChoices(null);
    setCurrentStep(1);
    setDaysCompleted(0);
    setStartingBalance(0);

    localStorage.removeItem('brp_pid');
    localStorage.removeItem('brp_step');
    localStorage.removeItem('brp_condition');
    localStorage.removeItem('brp_choices');
  };

  const handleLogout = () => {
    // Logout: Go to Welcome Screen
    setShowWelcome(true);
    setParticipantId(null);
    setCondition(null);
    setGenuineChoices(null);
    setCurrentStep(1);
    setDaysCompleted(0);
    setStartingBalance(0);

    // Keep brp_enrolled!
    localStorage.removeItem('brp_pid');
    localStorage.removeItem('brp_step');
    localStorage.removeItem('brp_condition');
    localStorage.removeItem('brp_choices');
  };

  const handleResume = (data) => {
    setParticipantId(data.participantId);
    if (data.conditionOrder) setCondition(data.conditionOrder.join('-'));
    setDaysCompleted(data.days_completed || 0);
    setStartingBalance(data.startingBalance || 0);

    let stepNum = 1;
    const stepName = data.currentStep;

    const entry = Object.entries(STEP_NAMES).find(([key, val]) => val === stepName);
    if (entry) {
      stepNum = parseInt(entry[0], 10);
    } else if (stepName && stepName.startsWith('Step ')) {
      stepNum = parseInt(stepName.split(' ')[1], 10);
    }

    if (isNaN(stepNum) || stepNum < 1) stepNum = 1;

    setCurrentStep(stepNum);
    setShowWelcome(false);
  };

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('brp_step', currentStep.toString());
  }, [currentStep]);

  useEffect(() => {
    if (participantId) {
      localStorage.setItem('brp_pid', participantId);
      localStorage.setItem('brp_enrolled', 'true');
    }
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
    if (currentStep < 8) {
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

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Consent onNext={handleNext} />;
      case 2:
        return <Demographics onNext={handleNext} participantId={participantId} />;
      case 3:
        if (daysCompleted >= 1) {
          // Auto-skip Pre-Training for returning participants
          setTimeout(() => handleNext(), 0);
          return <div className="p-10 text-center">Loading next section...</div>;
        }
        return <PreTrainingFlow onNext={handleNext} participantId={participantId} daysCompleted={daysCompleted} />;
      case 4:
        return <GenuineFlow onNext={handleNext} participantId={participantId} genuineChoices={genuineChoices} daysCompleted={daysCompleted} />;
      case 5:
        return <ApparentFlow onNext={handleNext} participantId={participantId} genuineChoices={genuineChoices} daysCompleted={daysCompleted} />;
      case 6:
        return <CoercionFlow onNext={handleNext} participantId={participantId} genuineChoices={genuineChoices} daysCompleted={daysCompleted} />;
      case 7:
        return <PostSurvey onNext={handleNext} participantId={participantId} />;
      case 8:
        return <Payout participantId={participantId} onReset={handleLogout} startingBalance={startingBalance} />;
      default:
        return <div>Unknown Step</div>;
    }
  };

  if (isAutoResuming) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 font-medium">Resuming your session...</p>
        </div>
      </div>
    );
  }

  if (showWelcome) {
    return <WelcomeScreen onStartNew={handleStartNew} onResume={handleResume} />;
  }

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
