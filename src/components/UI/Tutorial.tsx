import { useState, useEffect } from 'react';

export function Tutorial() {
  const [showTutorial, setShowTutorial] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if tutorial was dismissed before
    const dismissed = localStorage.getItem('tutorial_dismissed');
    if (dismissed === 'true') {
      setShowTutorial(false);
    }
  }, []);

  const dismissTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('tutorial_dismissed', 'true');
  };

  const steps = [
    {
      title: 'Welcome to R.E.N.D.E.R.',
      content: [
        'You are an orange cube in a procedurally generated world.',
        'Enemies (red/purple/cyan cubes) will attack you.',
        'Survive and collect loot to progress!',
      ],
    },
    {
      title: 'Movement',
      content: [
        'WASD or Arrow Keys: Move',
        'In ISO mode, you move on a flat plane.',
        'In 2D mode, you move left/right.',
        'In FPS mode, you move in 3D space.',
      ],
    },
    {
      title: 'Combat',
      content: [
        'J or Click: Shoot projectiles',
        'Aim at enemies (colored cubes) to damage them.',
        'Watch their health bars above them.',
        'Enemies flash red when attacking you.',
      ],
    },
    {
      title: 'Planes',
      content: [
        'Tab: Cycle between camera perspectives',
        '1: 2D Side-scrolling view',
        '2: ISO Top-down view',
        '3: FPS First-person view',
        'Each plane changes how you move and fight!',
      ],
    },
    {
      title: 'Survival',
      content: [
        'Avoid enemies - they deal damage when close.',
        'Kill enemies to earn Pixels (currency).',
        'Collect green items, yellow pixels, and cyan upgrades.',
        'Press R to restart your run.',
      ],
    },
  ];

  if (!showTutorial) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
        color: '#00ff00',
        padding: '40px',
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          backgroundColor: '#000000',
          border: '3px solid #00ff00',
          padding: '30px',
          borderRadius: '8px',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '24px' }}>
          {steps[currentStep].title}
        </h2>
        
        <ul style={{ fontSize: '16px', lineHeight: '1.8', paddingLeft: '20px' }}>
          {steps[currentStep].content.map((item, idx) => (
            <li key={idx} style={{ marginBottom: '10px' }}>
              {item}
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: currentStep === 0 ? '#333' : '#00ff00',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'monospace',
              fontWeight: 'bold',
            }}
          >
            Previous
          </button>

          <div>
            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#00ff00',
                  color: '#000',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  marginRight: '10px',
                }}
              >
                Next
              </button>
            ) : null}
            <button
              onClick={dismissTutorial}
              style={{
                padding: '10px 20px',
                backgroundColor: '#ff0000',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontWeight: 'bold',
              }}
            >
              Start Playing
            </button>
          </div>
        </div>

        <div style={{ marginTop: '20px', fontSize: '12px', opacity: 0.7, textAlign: 'center' }}>
          {currentStep + 1} / {steps.length}
        </div>
      </div>
    </div>
  );
}

