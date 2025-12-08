import './Modal.css';

function Modal({ isOpen, onClose, onConfirm }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>사진 촬영</h2>
                <p>사진을 촬영하시겠습니까?</p>
                <div className="modal-actions">
                    <button className="modal-button cancel" onClick={onClose}>
                        취소
                    </button>
                    <button className="modal-button confirm" onClick={onConfirm}>
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Modal;
