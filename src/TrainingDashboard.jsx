import { useState, useEffect, useRef } from 'react';
import './TrainingDashboard.css';

function TrainingDashboard({ onFinish }) {
    const [time, setTime] = useState(0);
    const [metrics, setMetrics] = useState({
        level: 1,
        reactionTime: '0.0s',
        distance: '0cm',
        hitMiss: '-'
    });

    const [isConnected, setIsConnected] = useState(false);
    const portRef = useRef(null);
    const readerRef = useRef(null);

    const connectSerial = async () => {
        try {
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 9600 });

            portRef.current = port;
            setIsConnected(true);
            console.log('Connected to Arduino via Serial');

            const textDecoder = new TextDecoderStream();
            const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
            const reader = textDecoder.readable.getReader();
            readerRef.current = reader;

            try {
                let buffer = '';
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) {
                        break;
                    }

                    buffer += value;
                    const lines = buffer.split('\n');
                    buffer = lines.pop(); // Keep incomplete line in buffer

                    for (const line of lines) {
                        if (!line.trim()) continue;

                        try {
                            const data = JSON.parse(line);
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
                            }
                        } catch (e) {
                            console.error('Error parsing JSON:', e, 'Line:', line);
                        }
                    }
                }
            } catch (error) {
                console.error('Error reading serial data:', error);
            } finally {
                reader.releaseLock();
            }

        } catch (error) {
            console.error('Failed to connect to serial port:', error);
        }
    };

    useEffect(() => {
        const timer = setInterval(() => {
            if (isConnected) {
                setTime(prevTime => prevTime + 1);
            }
        }, 1000);

        return () => {
            clearInterval(timer);
            if (readerRef.current) {
                readerRef.current.cancel();
            }
            if (portRef.current) {
                portRef.current.close();
            }
        };
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
                    {!isConnected && (
                        <button className="connect-button" onClick={connectSerial}>
                            Arduino 연결
                        </button>
                    )}
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
