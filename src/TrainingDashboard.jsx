import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './TrainingDashboard.css';

const socket = io('http://localhost:3001');

function TrainingDashboard({ onFinish }) {
    const [time, setTime] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [metrics, setMetrics] = useState({
        level: 1,
        reactionTime: '0.0s',
        distance: '0cm',
        hitMiss: '-'
    });

    useEffect(() => {
        // Socket.IO 연결 상태 확인
        socket.on('connect', () => {
            console.log('Socket.IO connected');
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('Socket.IO disconnected');
            setIsConnected(false);
        });

        // 센서 데이터 수신
        socket.on('sensor-data', (data) => {
            console.log('Received:', data);

            if (data.type === 'distance') {
                setMetrics(prev => ({
                    ...prev,
                    distance: `${data.dist.toFixed(1)}cm`
                }));
            } else if (data.type === 'escape') {
                setMetrics(prev => ({
                    ...prev,
                    reactionTime: `${(data.reaction / 1000).toFixed(2)}s`
                }));
            } else if (data.type === 'result') {
                let resultText = '-';
                if (data.result === 'success') resultText = '성공';
                else if (data.result === 'fail') resultText = '실패';
                else if (data.result === 'invalid') resultText = '무효';

                setMetrics(prev => ({
                    ...prev,
                    level: data.level,
                    hitMiss: resultText,
                    reactionTime: data.reaction ? `${(data.reaction / 1000).toFixed(2)}s` : prev.reactionTime
                }));
            } else if (data.type === 'ready') {
                setMetrics(prev => ({
                    ...prev,
                    level: data.level
                }));
            }
        });

        // 연결 시도
        if (!socket.connected) {
            socket.connect();
        } else {
            setIsConnected(true);
        }

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('sensor-data');
        };
    }, []);

    // 타이머
    useEffect(() => {
        const timer = setInterval(() => {
            if (isConnected) {
                setTime(prevTime => prevTime + 1);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [isConnected]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2>훈련 진행 중</h2>
                <div className="controls">
                    <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                        {isConnected ? '🟢 연결됨' : '🔴 연결 안됨'}
                    </div>
                    <div className="timer">{formatTime(time)}</div>
                </div>
            </div>

            <div className="metrics-grid">
                <div className="metric-card">
                    <h3>레벨</h3>
                    <p>{metrics.level}</p>
                </div>
                <div className="metric-card">
                    <h3>반응 시간</h3>
                    <p>{metrics.reactionTime}</p>
                </div>
                <div className="metric-card">
                    <h3>거리</h3>
                    <p>{metrics.distance}</p>
                </div>
                <div className="metric-card">
                    <h3>결과</h3>
                    <p className={metrics.hitMiss === '성공' ? 'success' : (metrics.hitMiss === '실패' ? 'fail' : '')}>
                        {metrics.hitMiss}
                    </p>
                </div>
            </div>

            <button className="stop-button" onClick={onFinish}>
                훈련 종료
            </button>
        </div>
    );
}

export default TrainingDashboard;
