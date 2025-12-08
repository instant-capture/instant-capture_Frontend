import './RankingPage.css';

const mockRankings = [
    { rank: 1, name: '김철수', score: 'Level 5 - 00:45' },
    { rank: 2, name: '이영희', score: 'Level 4 - 01:12' },
    { rank: 3, name: '박지성', score: 'Level 4 - 01:30' },
    { rank: 4, name: '손흥민', score: 'Level 3 - 00:50' },
    { rank: 5, name: '류현진', score: 'Level 2 - 02:00' },
];

function RankingPage({ onHome }) {
    return (
        <div className="ranking-container">
            <div className="ranking-content">
                <h2>랭킹</h2>
                <div className="ranking-list">
                    <div className="ranking-header">
                        <span>순위</span>
                        <span>이름</span>
                        <span>기록</span>
                    </div>
                    {mockRankings.map((item) => (
                        <div key={item.rank} className={`ranking-item rank-${item.rank}`}>
                            <span className="rank">{item.rank}</span>
                            <span className="name">{item.name}</span>
                            <span className="score">{item.score}</span>
                        </div>
                    ))}
                </div>
                <button className="home-button" onClick={onHome}>
                    처음으로
                </button>
            </div>
        </div>
    );
}

export default RankingPage;
