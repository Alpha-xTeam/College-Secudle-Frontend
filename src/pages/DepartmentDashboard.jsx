import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Alert, Modal, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { roomsAPI } from '../api/rooms';
import { getUserRole } from '../utils/auth';
import axios from 'axios';
import { getAuthHeaders } from '../utils/auth';
import Footer from '../components/Footer';
import AnnouncementCard from '../components/AnnouncementCard';
import '../styles/announcements.css';

const defaultOrigin = (() => {
  try {
    const origin = window.location.origin || `${window.location.protocol}//${window.location.hostname}`;
    return origin.replace(/:\d+$/, ':5000');
  } catch (e) {
    return 'http://127.0.0.1:5000';
  }
})();

const API_URL = process.env.REACT_APP_API_URL || defaultOrigin;

// أنماط CSS مخصصة محدثة
const modernStyles = `
  /* Modern Dashboard Styles */
  .modern-dashboard {
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    min-height: 100vh;
    position: relative;
    /* font-family inherited from main.css */
  }
  
  .modern-dashboard::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.03) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(16, 185, 129, 0.03) 0%, transparent 50%);
    pointer-events: none;
    z-index: -1;
  }
  
  /* Modern Header */
  .dashboard-header {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    padding: 2rem;
    margin-bottom: 2rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    position: relative;
    overflow: hidden;
  }
  
  .dashboard-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4);
  }
  
  .dashboard-title {
    background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 800;
    font-size: 2rem;
    margin-bottom: 0;
  }
  
  /* Modern Stats Cards */
  .modern-stats-card {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border: none;
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    height: 100%;
  }
  
  .modern-stats-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .modern-stats-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }
  
  .modern-stats-card:hover::before {
    opacity: 1;
  }
  
  .stats-number {
    font-size: 3rem;
    font-weight: 800;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.5rem;
    line-height: 1;
  }
  
  .stats-label {
    color: #64748b;
    font-weight: 600;
    font-size: 1rem;
    margin: 0;
  }
  
  /* Modern Announcement Button */
  .modern-announcement-btn {
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%) !important;
    border: none !important;
    color: white !important;
    border-radius: 16px !important;
    padding: 12px 24px !important;
    font-weight: 700 !important;
    font-size: 1rem !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3) !important;
    position: relative !important;
    overflow: hidden !important;
  }
  
  .modern-announcement-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }
  
  .modern-announcement-btn:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 12px 35px rgba(59, 130, 246, 0.4) !important;
    background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%) !important;
  }
  
  .modern-announcement-btn:hover::before {
    left: 100%;
  }
  
  /* Modern Modal */
  .modern-modal .modal-content {
    border: none;
    border-radius: 24px;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
    overflow: hidden;
  }
  
  .modern-modal .modal-header {
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    border: none;
    border-radius: 24px 24px 0 0;
    padding: 2rem;
    position: relative;
  }
  
  .modern-modal .modal-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 25%, transparent 25%);
    background-size: 20px 20px;
    opacity: 0.1;
  }
  
  .modern-modal .modal-title {
    color: white;
    font-weight: 800;
    font-size: 1.5rem;
    position: relative;
    z-index: 1;
  }
  
  .modern-modal .btn-close {
    filter: brightness(0) invert(1);
    opacity: 0.8;
    transition: all 0.3s ease;
  }
  
  .modern-modal .btn-close:hover {
    opacity: 1;
    transform: scale(1.1);
  }
  
  /* Modern Form Controls */
  .modern-form-control {
    border: 2px solid #e2e8f0 !important;
    border-radius: 12px !important;
    padding: 1rem 1.25rem !important;
    font-size: 1rem !important;
    transition: all 0.3s ease !important;
    background: rgba(255, 255, 255, 0.8) !important;
    backdrop-filter: blur(10px) !important;
  }
  
  .modern-form-control:focus {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
    background: white !important;
  }
  
  .modern-form-label {
    font-weight: 700 !important;
    color: #1e293b !important;
    margin-bottom: 0.75rem !important;
    font-size: 0.95rem !important;
  }
  
  /* Modern Cards */
  .modern-card {
    background: rgba(255, 255, 255, 0.9) !important;
    backdrop-filter: blur(20px) !important;
    border: none !important;
    border-radius: 20px !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    position: relative !important;
    overflow: hidden !important;
  }
  
  .modern-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .modern-card:hover {
    transform: translateY(-4px) !important;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important;
  }
  
  .modern-card:hover::before {
    opacity: 1;
  }
  
  .modern-card-header {
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%) !important;
    border: none !important;
    border-radius: 20px 20px 0 0 !important;
    padding: 1.5rem 2rem !important;
    position: relative !important;
  }
  
  .modern-card-title {
    background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 800;
    font-size: 1.25rem;
    margin: 0;
  }
  
  /* Modern Table */
  .modern-table {
    background: rgba(255, 255, 255, 0.9) !important;
    backdrop-filter: blur(20px) !important;
    border-radius: 16px !important;
    overflow: hidden !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
    border-collapse: separate !important;
    border-spacing: 0 !important;
  }
  
  .modern-table thead th {
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%) !important;
    color: white !important;
    border: none !important;
    font-weight: 700 !important;
    padding: 1.25rem 1rem !important;
    text-align: center !important;
    vertical-align: middle !important;
    position: relative !important;
  }
  
  .modern-table tbody td {
    padding: 1rem !important;
    border-bottom: 1px solid #f1f5f9 !important;
    vertical-align: middle !important;
    text-align: center !important;
    transition: all 0.3s ease !important;
  }
  
  .modern-table tbody tr {
    transition: all 0.3s ease !important;
  }
  
  .modern-table tbody tr:hover {
    background: rgba(59, 130, 246, 0.05) !important;
    transform: scale(1.01) !important;
  }
  
  /* Modern Buttons */
  .modern-btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
    border: none !important;
    border-radius: 12px !important;
    padding: 0.75rem 1.5rem !important;
    font-weight: 600 !important;
    transition: all 0.3s ease !important;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3) !important;
  }
  
  .modern-btn-primary:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4) !important;
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
  }
  
  .modern-btn-success {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
    border: none !important;
    border-radius: 12px !important;
    padding: 0.75rem 1.5rem !important;
    font-weight: 600 !important;
    transition: all 0.3s ease !important;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3) !important;
  }
  
  .modern-btn-success:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4) !important;
  }
  
  /* Modern Badges */
  .modern-badge {
    border-radius: 50px !important;
    padding: 0.5rem 1rem !important;
    font-weight: 600 !important;
    font-size: 0.875rem !important;
    border: none !important;
  }
  
  .modern-badge-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%) !important;
    color: white !important;
  }
  
  .modern-badge-success {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
    color: white !important;
  }
  
  .modern-badge-danger {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
    color: white !important;
  }
  
  .modern-badge-secondary {
    background: linear-gradient(135deg, #64748b 0%, #475569 100%) !important;
    color: white !important;
  }
  
  /* Mobile Responsive Styles for Department Dashboard */
  @media (max-width: 768px) {
    /* Hide table on mobile */
    .modern-table {
      display: none;
    }
    
    /* Show cards on mobile */
    .mobile-room-cards {
      display: block !important;
    }
    
    /* Mobile room cards */
    .mobile-room-card {
      background: rgba(255, 255, 255, 0.9) !important;
      backdrop-filter: blur(20px) !important;
      border: none !important;
      border-radius: 16px !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
      margin-bottom: 1rem !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      position: relative !important;
      overflow: hidden !important;
    }
    
    .mobile-room-card:hover {
      transform: translateY(-4px) !important;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important;
    }
    
    .mobile-room-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .mobile-room-card:hover::before {
      opacity: 1;
    }
    
    .mobile-room-header {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%) !important;
      border: none !important;
      border-radius: 16px 16px 0 0 !important;
      padding: 1rem 1.25rem !important;
      position: relative !important;
    }
    
    .mobile-room-title {
      background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-weight: 800;
      font-size: 1.1rem;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .mobile-room-body {
      padding: 1.25rem !important;
    }
    
    .mobile-room-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    
    .mobile-room-info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    
    .mobile-room-info-label {
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .mobile-room-info-value {
      font-size: 0.95rem;
      color: #1e293b;
      font-weight: 600;
    }
    
    .mobile-room-status {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 50px;
      font-weight: 600;
      font-size: 0.875rem;
      border: none;
    }
    
    .mobile-room-status.active {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }
    
    .mobile-room-status.inactive {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
    }
    
    .mobile-room-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    
    .mobile-room-actions .btn {
      flex: 1;
      min-width: 120px;
      font-size: 0.85rem;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
    }
  }
  
  @media (min-width: 769px) {
    /* Hide cards on desktop */
    .mobile-room-cards {
      display: none !important;
    }
    
    /* Show table on desktop */
    .modern-table {
      display: table !important;
    }
  }
  }
  
  .modern-alert-success {
    background: rgba(16, 185, 129, 0.1) !important;
    border-left-color: #10b981 !important;
    color: #065f46 !important;
  }
  
  .modern-alert-danger {
    background: rgba(239, 68, 68, 0.1) !important;
    border-left-color: #ef4444 !important;
    color: #991b1b !important;
  }
  
  /* Loading Animation */
  .modern-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    flex-direction: column;
    gap: 1rem;
  }
  
  .modern-spinner {
    width: 60px;
    height: 60px;
    border: 4px solid #e2e8f0;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: modernSpin 1s linear infinite;
  }
  
  @keyframes modernSpin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  /* Empty State */
  .modern-empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: #64748b;
  }
  
  .modern-empty-icon {
    font-size: 4rem;
    margin-bottom: 1.5rem;
    opacity: 0.5;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .modern-empty-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    color: #1e293b;
  }
  
  .modern-empty-text {
    font-size: 1rem;
    margin-bottom: 0;
    color: #64748b;
  }
  
  /* Info Card */
  .modern-info-card {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%) !important;
    border: 1px solid rgba(59, 130, 246, 0.1) !important;
    border-radius: 20px !important;
    padding: 2rem !important;
    position: relative !important;
    overflow: hidden !important;
  }
  
  .modern-info-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  }
  
  .modern-info-title {
    color: #1e293b;
    font-weight: 700;
    font-size: 1.125rem;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .modern-info-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .modern-info-list li {
    padding: 0.5rem 0;
    color: #475569;
    font-weight: 500;
    position: relative;
    padding-left: 1.5rem;
  }
  
  .modern-info-list li::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: #10b981;
    font-weight: 700;
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .dashboard-title {
      font-size: 1.5rem;
    }
    
    .stats-number {
      font-size: 2rem;
    }
    
    .modern-announcement-btn {
      padding: 10px 20px !important;
      font-size: 0.9rem !important;
    }
    
    .modern-card {
      margin-bottom: 1rem !important;
    }
    
    .modern-table {
      font-size: 0.875rem !important;
    }
    
    .dashboard-header {
      padding: 1.5rem !important;
    }
  }
  
  @media (max-width: 576px) {
    .dashboard-header {
      padding: 1rem !important;
    }
    
    .dashboard-title {
      font-size: 1.25rem;
    }
    
    .stats-number {
      font-size: 1.75rem;
    }
    
    .modern-modal .modal-header {
      padding: 1.5rem !important;
    }
    
    .modern-modal .modal-title {
      font-size: 1.25rem !important;
    }
  }
`;

const DepartmentDashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastFetch, setLastFetch] = useState(0);
  const navigate = useNavigate();
  const userRole = getUserRole();
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [annForm, setAnnForm] = useState({ title: '', body: '', starts_at: '', expires_at: '' });
  const [showEditAnnModal, setShowEditAnnModal] = useState(false);
  const [editingAnn, setEditingAnn] = useState(null);
  const [editAnnForm, setEditAnnForm] = useState({ title: '', body: '', starts_at: '', expires_at: '', is_active: true });

  useEffect(() => {
    fetchData();
    
    // إضافة الأنماط CSS المخصصة
    const styleElement = document.createElement('style');
    styleElement.textContent = modernStyles;
    styleElement.setAttribute('data-modern-styles', 'true');
    document.head.appendChild(styleElement);
    
    // تنظيف الأنماط عند إزالة المكون
    return () => {
      const existingStyle = document.head.querySelector('style[data-modern-styles]');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // إضافة CSS responsive للموبايل
    const mobileCSS = `
      /* Mobile Responsive Styles for Department Dashboard */
      @media (max-width: 768px) {
        /* Hide table on mobile */
        .modern-table {
          display: none;
        }
        
        /* Show cards on mobile */
        .mobile-room-cards {
          display: block !important;
        }
        
        /* Mobile room cards */
        .mobile-room-card {
          background: rgba(255, 255, 255, 0.9) !important;
          backdrop-filter: blur(20px) !important;
          border: none !important;
          border-radius: 16px !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
          margin-bottom: 1rem !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          position: relative !important;
          overflow: hidden !important;
        }
        
        .mobile-room-card:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important;
        }
        
        .mobile-room-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .mobile-room-card:hover::before {
          opacity: 1;
        }
        
        .mobile-room-header {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%) !important;
          border: none !important;
          border-radius: 16px 16px 0 0 !important;
          padding: 1rem 1.25rem !important;
          position: relative !important;
        }
        
        .mobile-room-title {
          background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 800;
          font-size: 1.1rem;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .mobile-room-body {
          padding: 1.25rem !important;
        }
        
        .mobile-room-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .mobile-room-info-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .mobile-room-info-label {
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .mobile-room-info-value {
          font-size: 0.95rem;
          color: #1e293b;
          font-weight: 600;
        }
        
        .mobile-room-status {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 50px;
          font-weight: 600;
          font-size: 0.875rem;
          border: none;
        }
        
        .mobile-room-status.active {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }
        
        .mobile-room-status.inactive {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }
        
        .mobile-room-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        
        .mobile-room-actions .btn {
          flex: 1;
          min-width: 120px;
          font-size: 0.85rem;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
        }
      }
      
      @media (min-width: 769px) {
        /* Hide cards on desktop */
        .mobile-room-cards {
          display: none !important;
        }
        
        /* Show table on desktop */
        .modern-table {
          display: table !important;
        }
      }
    `;

    const existingMobileStyle = document.querySelector('#mobile-room-styles');
    if (existingMobileStyle) {
      existingMobileStyle.remove();
    }

    const mobileStyleElement = document.createElement('style');
    mobileStyleElement.id = 'mobile-room-styles';
    mobileStyleElement.textContent = mobileCSS;
    document.head.appendChild(mobileStyleElement);

    return () => {
      const styleToRemove = document.querySelector('#mobile-room-styles');
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, []);

  const fetchData = async () => {
    // منع تكرار الطلبات خلال فترة قصيرة
    const now = Date.now();
    if (now - lastFetch < 5000) { // منع التكرار لمدة 5 ثواني
      return;
    }
    
    try {
      setLastFetch(now);
      setLoading(true);
      const roomsResponse = await roomsAPI.getRooms();
      // جلب إعلانات القسم
      try {
        const headers = getAuthHeaders();
        const res = await axios.get(`${API_URL}/api/department/announcements`, { headers });
        if (res.data?.success) {
          setAnnouncements(res.data.data || []);
        }
      } catch (_) {}
      
      if (roomsResponse.success) {
        setRooms(roomsResponse.data);
      }
    } catch (error) {
      setError('فشل في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const headers = getAuthHeaders();
      const payload = { title: annForm.title, body: annForm.body };
      if (annForm.starts_at) payload.starts_at = annForm.starts_at;
      if (annForm.expires_at) payload.expires_at = annForm.expires_at;
      const res = await axios.post(`${API_URL}/api/department/announcements`, payload, { headers });
      if (res.data?.success) {
        setSuccess('تم إنشاء الإعلان بنجاح');
        setShowAnnModal(false);
        setAnnForm({ title: '', body: '', starts_at: '', expires_at: '' });
        fetchData();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'فشل في إنشاء الإعلان');
    }
  };

  const openEditAnnouncement = (ann) => {
    setEditingAnn(ann);
    setEditAnnForm({
      title: ann.title || '',
      body: ann.body || '',
      starts_at: (ann.starts_at || '').slice(0,16),
      expires_at: (ann.expires_at || '').slice(0,16),
      is_active: !!ann.is_active
    });
    setShowEditAnnModal(true);
  };

  const handleUpdateAnnouncement = async (e) => {
    e.preventDefault();
    if (!editingAnn) return;
    try {
      const headers = getAuthHeaders();
      const payload = {
        title: editAnnForm.title,
        body: editAnnForm.body,
        is_active: editAnnForm.is_active
      };
      if (editAnnForm.starts_at) payload.starts_at = editAnnForm.starts_at;
      if (editAnnForm.expires_at) payload.expires_at = editAnnForm.expires_at;
      const res = await axios.put(`${API_URL}/api/department/announcements/${editingAnn.id}`, payload, { headers });
      if (res.data?.success) {
        setSuccess('تم تحديث الإعلان بنجاح');
        setShowEditAnnModal(false);
        setEditingAnn(null);
        fetchData();
      } else {
        setError(res.data?.message || 'فشل في تحديث الإعلان');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'فشل في تحديث الإعلان');
    }
  };

  const handleDeleteAnnouncement = async (annId) => {
    if (!window.confirm('هل تريد حذف هذا الإعلان؟')) return;
    try {
      const headers = getAuthHeaders();
      const res = await axios.delete(`${API_URL}/api/department/announcements/${annId}`, { headers });
      if (res.data?.success) {
        setSuccess('تم حذف الإعلان بنجاح');
        fetchData();
      } else {
        setError(res.data?.message || 'فشل في حذف الإعلان');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'فشل في حذف الإعلان');
    }
  };

  const handleManageSchedule = (roomId) => {
    navigate(`/edit-schedule/${roomId}`);
  };

  const downloadQR = async (roomCode) => {
    try {
      const blob = await roomsAPI.downloadQR(roomCode);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `room_${roomCode}_qr.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError('فشل في تحميل QR Code');
    }
  };

  const getRoleText = () => {
    switch (userRole) {
      case 'department_head': return 'رئيس القسم';
      case 'supervisor': return 'مشرف';
      default: return 'مستخدم';
    }
  };

  if (loading) {
    return (
      <div className="modern-dashboard">
        <Container>
          <div className="modern-loading">
            <div className="modern-spinner"></div>
            <h4 className="text-muted">جاري تحميل البيانات...</h4>
            <p className="text-muted mb-0">يرجى الانتظار قليلاً</p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="modern-dashboard">
      <Container className="py-4">
        {/* Header Section */}
        <div className="dashboard-header">
          <Row className="align-items-center">
            <Col lg={8}>
              <h1 className="dashboard-title">
                <i className="fas fa-tachometer-alt me-3"></i>
                لوحة تحكم {getRoleText()}
              </h1>
              <p className="text-muted mb-0 fs-5">
                إدارة شاملة لقاعات القسم والجداول الدراسية
              </p>
            </Col>
            <Col lg={4} className="text-lg-end mt-3 mt-lg-0">
              {(userRole === 'department_head' || userRole === 'supervisor') && (
                <Button 
                  onClick={() => setShowAnnModal(true)}
                  className="modern-announcement-btn"
                >
                  <i className="fas fa-bullhorn me-2"></i>
                  إدارة الإعلانات
                </Button>
              )}
            </Col>
          </Row>
        </div>
        
        {/* Alerts */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')} className="modern-alert modern-alert-danger">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess('')} className="modern-alert modern-alert-success">
            <i className="fas fa-check-circle me-2"></i>
            {success}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Row className="g-4 mb-4">
          <Col md={4}>
            <Card className="modern-stats-card text-center">
              <Card.Body className="p-4">
                <div className="stats-number">{rooms.length}</div>
                <p className="stats-label">
                  <i className="fas fa-door-open me-2"></i>
                  إجمالي القاعات
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="modern-stats-card text-center">
              <Card.Body className="p-4">
                <div className="stats-number">{rooms.filter(room => room.is_active).length}</div>
                <p className="stats-label">
                  <i className="fas fa-check-circle me-2"></i>
                  القاعات النشطة
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="modern-stats-card text-center">
              <Card.Body className="p-4">
                <div className="stats-number">{rooms.filter(room => room.qr_code_path).length}</div>
                <p className="stats-label">
                  <i className="fas fa-qrcode me-2"></i>
                  أكواد QR متوفرة
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Announcements Modal */}
        <Modal show={showAnnModal} onHide={() => setShowAnnModal(false)} size="xl" className="modern-modal">
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="fas fa-bullhorn me-2"></i>
              إدارة إعلانات القسم
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            {(userRole === 'department_head' || userRole === 'supervisor') && (
              <Card className="modern-card mb-4">
                <Card.Header className="modern-card-header">
                  <h5 className="modern-card-title">
                    <i className="fas fa-plus-circle me-2"></i>
                    إضافة إعلان جديد
                  </h5>
                </Card.Header>
                <Card.Body className="p-4">
                  <Form onSubmit={handleCreateAnnouncement}>
                    <Row className="g-4">
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="modern-form-label">
                            <i className="fas fa-heading me-2"></i>
                            عنوان الإعلان
                          </Form.Label>
                          <Form.Control 
                            type="text"
                            placeholder="أدخل عنوان واضح ومختصر للإعلان..."
                            value={annForm.title} 
                            onChange={(e)=>setAnnForm({...annForm, title: e.target.value})} 
                            required 
                            className="modern-form-control"
                          />
                          <Form.Text className="text-muted">
                            <i className="fas fa-info-circle me-1"></i>
                            عنوان جذاب يلفت انتباه الطلاب
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="modern-form-label">
                            <i className="fas fa-file-alt me-2"></i>
                            محتوى الإعلان
                          </Form.Label>
                          <Form.Control 
                            as="textarea" 
                            rows={8}
                            placeholder="اكتب تفاصيل الإعلان هنا...

يمكنك إضافة:
• تفاصيل الفعالية أو الحدث
• المواعيد والأوقات المهمة
• التعليمات والإرشادات
• معلومات التواصل
• أي معلومات إضافية مفيدة"
                            value={annForm.body} 
                            onChange={(e)=>setAnnForm({...annForm, body: e.target.value})} 
                            required 
                            className="modern-form-control"
                            style={{ minHeight: '200px', resize: 'vertical' }}
                          />
                          <Form.Text className="text-muted">
                            <i className="fas fa-lightbulb me-1"></i>
                            اكتب محتوى شامل ومفيد للطلاب
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="modern-form-label">
                            <i className="fas fa-calendar-plus me-2"></i>
                            تاريخ البداية
                          </Form.Label>
                          <Form.Control 
                            type="datetime-local" 
                            value={annForm.starts_at} 
                            onChange={(e)=>setAnnForm({...annForm, starts_at: e.target.value})}
                            className="modern-form-control"
                          />
                          <Form.Text className="text-muted">
                            <i className="fas fa-clock me-1"></i>
                            متى يبدأ ظهور الإعلان (اختياري)
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="modern-form-label">
                            <i className="fas fa-calendar-minus me-2"></i>
                            تاريخ الانتهاء
                          </Form.Label>
                          <Form.Control 
                            type="datetime-local" 
                            value={annForm.expires_at} 
                            onChange={(e)=>setAnnForm({...annForm, expires_at: e.target.value})}
                            className="modern-form-control"
                          />
                          <Form.Text className="text-muted">
                            <i className="fas fa-hourglass-end me-1"></i>
                            متى ينتهي ظهور الإعلان (اختياري)
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      
                      <Col md={12}>
                        <div className="d-flex justify-content-end gap-3">
                          <Button 
                            variant="outline-secondary" 
                            onClick={() => setShowAnnModal(false)}
                            className="px-4 py-2"
                          >
                            <i className="fas fa-times me-2"></i>
                            إلغاء
                          </Button>
                          <Button 
                            type="submit" 
                            className="modern-btn-primary px-4 py-2"
                          >
                            <i className="fas fa-paper-plane me-2"></i>
                            نشر الإعلان
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Form>
                </Card.Body>
              </Card>
            )}

            {/* Current Announcements */}
            <div className="announcements-section">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="modern-card-title">
                  <i className="fas fa-list me-2"></i>
                  الإعلانات الحالية
                </h4>
                <Badge className="modern-badge modern-badge-primary px-3 py-2">
                  {announcements.length} إعلان
                </Badge>
              </div>
              
              <div className="row g-4">
                {announcements.map((announcement) => (
                  <div className="col-12" key={announcement.id}>
                    <AnnouncementCard 
                      ann={announcement}
                      showActions={true}
                      onEdit={openEditAnnouncement}
                      onDelete={handleDeleteAnnouncement}
                    />
                  </div>
                ))}
                
                {announcements.length === 0 && (
                  <div className="col-12">
                    <div className="modern-empty-state">
                      <div className="modern-empty-icon">
                        <i className="fas fa-inbox"></i>
                      </div>
                      <h5 className="modern-empty-title">لا توجد إعلانات حالياً</h5>
                      <p className="modern-empty-text">
                        ابدأ بإضافة إعلان جديد لإعلام طلاب القسم بالأخبار والفعاليات المهمة
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Modal.Body>
        </Modal>

        {/* Edit Announcement Modal */}
        <Modal show={showEditAnnModal} onHide={() => setShowEditAnnModal(false)} size="xl" className="modern-modal">
          <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <Modal.Title>
              <i className="fas fa-edit me-2"></i>
              تعديل الإعلان
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleUpdateAnnouncement}>
            <Modal.Body className="p-4">
              <Row className="g-4">
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="modern-form-label">
                      <i className="fas fa-heading me-2"></i>
                      عنوان الإعلان
                    </Form.Label>
                    <Form.Control 
                      type="text"
                      placeholder="أدخل عنوان الإعلان..."
                      value={editAnnForm.title} 
                      onChange={(e)=>setEditAnnForm({...editAnnForm, title: e.target.value})} 
                      required 
                      className="modern-form-control"
                    />
                  </Form.Group>
                </Col>
                
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="modern-form-label">
                      <i className="fas fa-file-alt me-2"></i>
                      محتوى الإعلان
                    </Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={8}
                      placeholder="محتوى الإعلان..."
                      value={editAnnForm.body} 
                      onChange={(e)=>setEditAnnForm({...editAnnForm, body: e.target.value})} 
                      required 
                      className="modern-form-control"
                      style={{ minHeight: '200px', resize: 'vertical' }}
                    />
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="modern-form-label">
                      <i className="fas fa-calendar-plus me-2"></i>
                      تاريخ البداية
                    </Form.Label>
                    <Form.Control 
                      type="datetime-local" 
                      value={editAnnForm.starts_at} 
                      onChange={(e)=>setEditAnnForm({...editAnnForm, starts_at: e.target.value})}
                      className="modern-form-control"
                    />
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="modern-form-label">
                      <i className="fas fa-calendar-minus me-2"></i>
                      تاريخ الانتهاء
                    </Form.Label>
                    <Form.Control 
                      type="datetime-local" 
                      value={editAnnForm.expires_at} 
                      onChange={(e)=>setEditAnnForm({...editAnnForm, expires_at: e.target.value})}
                      className="modern-form-control"
                    />
                  </Form.Group>
                </Col>
                
                <Col md={12}>
                  <Card className="modern-card">
                    <Card.Body className="p-3">
                      <Form.Check
                        type="switch"
                        id="ann-active-switch"
                        label={
                          <span className="modern-form-label">
                            <i className="fas fa-toggle-on me-2"></i>
                            تفعيل الإعلان
                          </span>
                        }
                        checked={editAnnForm.is_active}
                        onChange={(e)=>setEditAnnForm({...editAnnForm, is_active: e.target.checked})}
                      />
                      <Form.Text className="text-muted">
                        <i className="fas fa-info-circle me-1"></i>
                        الإعلان النشط سيظهر للطلاب، والإعلان المتوقف لن يظهر
                      </Form.Text>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer className="bg-light">
              <Button 
                variant="outline-secondary" 
                onClick={()=>setShowEditAnnModal(false)}
                className="px-4 py-2"
              >
                <i className="fas fa-times me-2"></i>
                إلغاء
              </Button>
              <Button 
                type="submit"
                className="modern-btn-success px-4 py-2"
              >
                <i className="fas fa-save me-2"></i>
                حفظ التعديلات
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Rooms Management */}
        <Row>
          <Col>
            <Card className="modern-card">
              <Card.Header className="modern-card-header d-flex justify-content-between align-items-center">
                <h5 className="modern-card-title">
                  <i className="fas fa-door-open me-2"></i>
                  قاعات القسم
                </h5>
                {userRole === 'department_head' && (
                  <Button 
                    onClick={() => navigate('/manage-rooms')}
                    className="modern-btn-primary"
                  >
                    <i className="fas fa-cog me-2"></i>
                    إدارة القاعات
                  </Button>
                )}
              </Card.Header>
              <Card.Body className="p-0">
                {rooms.length === 0 ? (
                  <div className="modern-empty-state">
                    <div className="modern-empty-icon">
                      <i className="fas fa-door-closed"></i>
                    </div>
                    <h5 className="modern-empty-title">لا توجد قاعات مسجلة</h5>
                    <p className="modern-empty-text">
                      اتصل برئيس القسم لإضافة قاعات جديدة للنظام
                    </p>
                  </div>
                ) : (
                  <>
                    <Table className="modern-table mb-0">
                      <thead>
                        <tr>
                          <th>
                            <i className="fas fa-door-open me-2"></i>
                            اسم القاعة
                          </th>
                          <th>
                            <i className="fas fa-hashtag me-2"></i>
                            الرمز
                          </th>
                          <th>
                            <i className="fas fa-users me-2"></i>
                            السعة
                          </th>
                          <th>
                            <i className="fas fa-building me-2"></i>
                            القسم
                          </th>
                          <th>
                            <i className="fas fa-toggle-on me-2"></i>
                            الحالة
                          </th>
                          <th>
                            <i className="fas fa-tools me-2"></i>
                            الإجراءات
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rooms.map(room => (
                          <tr key={room.id}>
                            <td>
                              <strong className="text-dark">{room.name}</strong>
                            </td>
                            <td>
                              <Badge className="modern-badge modern-badge-secondary">
                                {room.code}
                              </Badge>
                            </td>
                            <td>
                              <span className="text-muted">
                                <i className="fas fa-user-friends me-1"></i>
                                {room.capacity || 'غير محدد'}
                              </span>
                            </td>
                            <td>
                              <span className="text-muted">
                                {room.department?.name || room.department_name || 'غير محدد'}
                              </span>
                            </td>
                            <td>
                              <Badge className={`modern-badge ${room.is_active ? 'modern-badge-success' : 'modern-badge-danger'}`}>
                                <i className={`fas ${room.is_active ? 'fa-check-circle' : 'fa-times-circle'} me-1`}></i>
                                {room.is_active ? 'نشط' : 'غير نشط'}
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex gap-2 flex-wrap">
                                <Button
                                  onClick={() => handleManageSchedule(room.id)}
                                  className="modern-btn-primary"
                                  size="sm"
                                >
                                  <i className="fas fa-calendar-alt me-1"></i>
                                  إدارة الجدول
                                </Button>
                                
                                {room.qr_code_path && (
                                  <Button
                                    onClick={() => downloadQR(room.code)}
                                    className="modern-btn-success"
                                    size="sm"
                                  >
                                    <i className="fas fa-qrcode me-1"></i>
                                    تحميل QR
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                    
                    {/* Mobile Cards View */}
                    <div className="mobile-room-cards">
                      {rooms.map(room => (
                        <Card key={room.id} className="mobile-room-card">
                          <Card.Header className="mobile-room-header">
                            <h6 className="mobile-room-title">
                              <i className="fas fa-door-open"></i>
                              {room.name}
                            </h6>
                          </Card.Header>
                          <Card.Body className="mobile-room-body">
                            <div className="mobile-room-info">
                              <div className="mobile-room-info-item">
                                <div className="mobile-room-info-label">الرمز</div>
                                <div className="mobile-room-info-value">
                                  <Badge className="modern-badge modern-badge-secondary">
                                    {room.code}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="mobile-room-info-item">
                                <div className="mobile-room-info-label">السعة</div>
                                <div className="mobile-room-info-value">
                                  <i className="fas fa-user-friends me-1"></i>
                                  {room.capacity || 'غير محدد'}
                                </div>
                              </div>
                              
                              <div className="mobile-room-info-item">
                                <div className="mobile-room-info-label">القسم</div>
                                <div className="mobile-room-info-value">
                                  {room.department?.name || room.department_name || 'غير محدد'}
                                </div>
                              </div>
                              
                              <div className="mobile-room-info-item">
                                <div className="mobile-room-info-label">الحالة</div>
                                <div className="mobile-room-info-value">
                                  <span className={`mobile-room-status ${room.is_active ? 'active' : 'inactive'}`}>
                                    <i className={`fas ${room.is_active ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                                    {room.is_active ? 'نشط' : 'غير نشط'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mobile-room-actions">
                              <Button
                                onClick={() => handleManageSchedule(room.id)}
                                className="modern-btn-primary"
                                size="sm"
                              >
                                <i className="fas fa-calendar-alt me-1"></i>
                                إدارة الجدول
                              </Button>
                              
                              {room.qr_code_path && (
                                <Button
                                  onClick={() => downloadQR(room.code)}
                                  className="modern-btn-success"
                                  size="sm"
                                >
                                  <i className="fas fa-qrcode me-1"></i>
                                  تحميل QR
                                </Button>
                              )}
                            </div>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Information Card */}
        <Row className="mt-4">
          <Col>
            <Card className="modern-info-card">
              <Card.Body>
                <h6 className="modern-info-title">
                  <i className="fas fa-info-circle"></i>
                  معلومات مهمة ونصائح للاستخدام
                </h6>
                <ul className="modern-info-list">
                  <li>يمكنك إدارة جداول جميع القاعات في قسمك بسهولة ومرونة</li>
                  <li>كل قاعة لها QR Code فريد يحتوي على رابط مباشر لعرض الجدول</li>
                  <li>الطلاب يمكنهم مسح QR Code لرؤية الجدول فوراً دون الحاجة لتسجيل الدخول</li>
                  <li>يتم تحديث الجداول والإعلانات فورياً عند إجراء أي تعديل</li>
                  <li>يمكنك إنشاء إعلانات مجدولة تظهر وتختفي تلقائياً في أوقات محددة</li>
                  {userRole === 'department_head' && (
                    <>
                      <li>كرئيس قسم، يمكنك إضافة مشرفين جدد وإدارة صلاحياتهم</li>
                      <li>يمكنك إضافة قاعات جديدة وتعديل معلومات القاعات الموجودة</li>
                    </>
                  )}
                  <li>استخدم الإعلانات لإبلاغ الطلاب بالتغييرات المهمة في الجداول</li>
                  <li>تأكد من تحديث معلومات القاعات بانتظام للحصول على أفضل تجربة</li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Quick Actions Card */}
        <Row className="mt-4">
          <Col>
            <Card className="modern-card">
              <Card.Header className="modern-card-header">
                <h5 className="modern-card-title">
                  <i className="fas fa-bolt me-2"></i>
                  إجراءات سريعة
                </h5>
              </Card.Header>
              <Card.Body className="p-4">
                <Row className="g-3">
                  {userRole === 'department_head' && (
                    <Col md={6} lg={3}>
                      <Button
                        variant="outline-primary"
                        className="w-100 p-3 h-100 d-flex flex-column align-items-center justify-content-center"
                        onClick={() => navigate('/manage-rooms')}
                        style={{ minHeight: '120px' }}
                      >
                        <i className="fas fa-plus-circle fa-2x mb-2"></i>
                        <span className="fw-bold">إضافة قاعة جديدة</span>
                      </Button>
                    </Col>
                  )}
                  
                  <Col md={6} lg={3}>
                    <Button
                      variant="outline-success"
                      className="w-100 p-3 h-100 d-flex flex-column align-items-center justify-content-center"
                      onClick={() => setShowAnnModal(true)}
                      style={{ minHeight: '120px' }}
                    >
                      <i className="fas fa-bullhorn fa-2x mb-2"></i>
                      <span className="fw-bold">إعلان جديد</span>
                    </Button>
                  </Col>
                  
                  <Col md={6} lg={3}>
                    <Button
                      variant="outline-info"
                      className="w-100 p-3 h-100 d-flex flex-column align-items-center justify-content-center"
                      onClick={() => window.location.reload()}
                      style={{ minHeight: '120px' }}
                    >
                      <i className="fas fa-sync-alt fa-2x mb-2"></i>
                      <span className="fw-bold">تحديث البيانات</span>
                    </Button>
                  </Col>
                  
                  <Col md={6} lg={3}>
                    <Button
                      variant="outline-warning"
                      className="w-100 p-3 h-100 d-flex flex-column align-items-center justify-content-center"
                      onClick={() => navigate('/help')}
                      style={{ minHeight: '120px' }}
                    >
                      <i className="fas fa-question-circle fa-2x mb-2"></i>
                      <span className="fw-bold">المساعدة</span>
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Recent Activity Card */}
        <Row className="mt-4 mb-5">
          <Col>
            <Card className="modern-card">
              <Card.Header className="modern-card-header">
                <h5 className="modern-card-title">
                  <i className="fas fa-clock me-2"></i>
                  النشاط الأخير
                </h5>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="d-flex align-items-center justify-content-center py-5">
                  <div className="text-center text-muted">
                    <i className="fas fa-history fa-3x mb-3 opacity-50"></i>
                    <h6>سيتم عرض النشاط الأخير هنا</h6>
                    <p className="mb-0 small">
                      التعديلات على الجداول، الإعلانات الجديدة، وإضافة القاعات
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      
      {/* Footer Component */}
      <Footer />
    </div>
  );
};

export default DepartmentDashboard;