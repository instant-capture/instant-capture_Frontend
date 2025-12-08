import { useState } from 'react';
import photo1 from './assets/photo1.svg';
import photo2 from './assets/photo2.svg';
import photo3 from './assets/photo3.svg';
import photo4 from './assets/photo4.svg';
import './PhotoSelector.css';

const photos = [
    { id: 1, src: photo1, alt: '사진 1' },
    { id: 2, src: photo2, alt: '사진 2' },
    { id: 3, src: photo3, alt: '사진 3' },
    { id: 4, src: photo4, alt: '사진 4' },
];

function PhotoSelector({ onConfirm }) {
    const [selectedPhotoId, setSelectedPhotoId] = useState(null);

    const handlePhotoClick = (id) => {
        setSelectedPhotoId(id);
    };

    return (
        <div className="photo-selector-container">
            <h2>사진을 선택하세요</h2>
            <div className="photo-grid">
                {photos.map((photo) => (
                    <div
                        key={photo.id}
                        className={`photo-item ${selectedPhotoId === photo.id ? 'selected' : ''}`}
                        onClick={() => handlePhotoClick(photo.id)}
                    >
                        <img src={photo.src} alt={photo.alt} />
                        {selectedPhotoId === photo.id && <div className="overlay">선택됨</div>}
                    </div>
                ))}
            </div>
            {selectedPhotoId && (
                <div className="selection-message">
                    사진 {selectedPhotoId}번을 선택하셨습니다
                </div>
            )}
            <button
                className="confirm-button"
                disabled={!selectedPhotoId}
                onClick={() => onConfirm(selectedPhotoId)}
            >
                선택 완료
            </button>
        </div>
    );
}

export default PhotoSelector;
