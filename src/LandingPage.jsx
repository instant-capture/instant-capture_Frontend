import './LandingPage.css';

function LandingPage({ onStart }) {
    return (
        <div className="landing-container">
            <div className="landing-content">
                <h1>Instant Capture</h1>
                <p>당신의 훈련을 "순간포착"과 함께하세요</p>
                <button className="start-button" onClick={onStart}>
                    시작하기
                </button>
            </div>
        </div>
    );
}

export default LandingPage;
