import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Alert } from 'react-bootstrap';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScannerModal = ({ show, onHide, onScanSuccess }) => {
  const [error, setError] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    if (show) {
      setError('');
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [show]);

  const startScanner = () => {
    if (scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        "qr-scanner-container",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        false
      );

      scanner.render(
        (decodedText) => {
          // نجح المسح
          handleScanSuccess(decodedText);
          scanner.clear();
        },
        (error) => {
          // خطأ في المسح (طبيعي، لا نحتاج لإظهاره)
          console.log(`QR scan error: ${error}`);
        }
      );

      scannerRef.current = scanner;
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (error) {
        console.log('Error stopping scanner:', error);
      }
    }
  };

  const handleScanSuccess = (decodedText) => {
    try {
      // التحقق من أن الرابط يحتوي على room code
      const url = new URL(decodedText);
      const pathParts = url.pathname.split('/');
      const roomIndex = pathParts.indexOf('room');
      
      if (roomIndex !== -1 && pathParts[roomIndex + 1]) {
        const roomCode = pathParts[roomIndex + 1];
        onScanSuccess(roomCode);
        onHide();
      } else {
        setError('الرابط المسحوب لا يحتوي على رمز قاعة صحيح');
      }
    } catch (error) {
      setError('الرابط المسحوب غير صحيح');
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>مسح QR Code للقاعة</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}
        
        <div className="text-center mb-3">
          <p>وجه الكاميرا نحو QR Code الموجود على باب القاعة</p>
        </div>
        
        <div id="qr-scanner-container" style={{ width: '100%' }}></div>
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          إغلاق
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default QRScannerModal;
