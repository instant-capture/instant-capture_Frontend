import { useState, useEffect } from 'react';
import './TrainingFlow.css';

function TrainingFlow({ onStartTraining }) {
    const [step, setStep] = useState(0);

    useEffect(() => {
        // Step 0: "기구에서 벗어나시오" (Initial state)
        // Wait 3 seconds, then move to Step 1
        const timer1 = setTimeout(() => {
            setStep(1);
        }, 3000);

        return () => clearTimeout(timer1);
    }, []);

    useEffect(() => {
        if (step === 1) {
            // Step 1: "기구 앞에 서시오"
            // Wait 3 seconds (simulating distance measurement), then move to Step 2
            const timer2 = setTimeout(() => {
                setStep(2);
            }, 3000);
            return () => clearTimeout(timer2);
        }
    }, [step]);

    return (
        <div className="training-container">
            <div className="training-content">
                {step === 0 && (
                    <div className="message fade-in">
                        <h2>기구에서 벗어나시오</h2>
                        <p>센서 측정을 위해 잠시 물러나 주세요.</p>
                    </div>
                )}
                {step === 1 && (
                    <div className="message fade-in">
                        <h2>기구 앞에 서시오</h2>
                        <p>거리 측정을 시작합니다.</p>
                    </div>
                )}
                {step === 2 && (
                    <div className="message fade-in">
                        <h2>훈련을 시작하겠습니까?</h2>
                        <button className="start-training-button" onClick={onStartTraining}>
                            훈련 시작
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TrainingFlow;
