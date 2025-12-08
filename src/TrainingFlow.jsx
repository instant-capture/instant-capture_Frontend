import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './TrainingFlow.css';

const socket = io('http://localhost:3001');

function TrainingFlow({ onStartTraining }) {
    const [step, setStep] = useState(0);
    const [distance, setDistance] = useState(null);

    useEffect(() => {
        socket.on('sensor-data', (data) => {
            if (data.type === 'distance') {
                setDistance(data.dist);
            }
        });

        return () => {
            socket.off('sensor-data');
        };
    }, []);

    const handleNextStep = () => {
        socket.emit('send-command', 'n'); // Send 'n' to proceed to next calibration step
        setStep(prev => prev + 1);
    };

    return (
        <div className="training-container">
            <div className="training-content">
                {step === 0 && (
                    <div className="message fade-in">
                        <h2>기구에서 벗어나시오</h2>
                        <p>센서 측정을 위해 잠시 물러나 주세요.</p>
                        <div className="distance-display">
                            현재 거리: {distance ? `${distance} cm` : '측정 중...'}
                        </div>
                        <button className="primary-button" onClick={handleNextStep}>
                            측정 완료
                        </button>
                    </div>
                )}
                {step === 1 && (
                    <div className="message fade-in">
                        <h2>기구 앞에 서시오</h2>
                        <p>거리 측정을 시작합니다.</p>
                        <div className="distance-display">
                            현재 거리: {distance ? `${distance} cm` : '측정 중...'}
                        </div>
                        <button className="primary-button" onClick={handleNextStep}>
                            거리 측정 완료
                        </button>
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
