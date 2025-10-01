import React from 'react';
import { Navbar as BSNavbar, Nav, NavDropdown, Container } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { getUser, logout, getUserRole } from '../utils/auth';

const Navbar = () => {
  const user = getUser();
  const userRole = getUserRole();

  const handleLogout = () => {
    logout();
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'dean':
        return 'عميد الكلية';
      case 'department_head':
        return 'رئيس القسم';
      case 'supervisor':
        return 'مشرف';
      default:
        return role;
    }
  };

  return (
    <BSNavbar bg="primary" variant="dark" expand="lg" fixed="top" className="shadow-lg site-navbar">
      <Container fluid>
        <BSNavbar.Brand href="/dashboard" className="d-flex align-items-center fw-bold">
          <i className="fas fa-university me-2"></i>
          <span className="d-none d-md-inline">نظام إدارة جداول الكلية</span>
          <span className="d-inline d-md-none">جداول الكلية</span>
        </BSNavbar.Brand>
        
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" className="border-0" />
        
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <LinkContainer to="/dashboard">
              <Nav.Link className="d-flex align-items-center rounded-3 mx-1">
                <i className="fas fa-home me-2"></i>
                <span className="d-none d-lg-inline">الرئيسية</span>
              </Nav.Link>
            </LinkContainer>
            
            {userRole === 'dean' && (
              <>
                <LinkContainer to="/manage-users">
                  <Nav.Link className="d-flex align-items-center rounded-3 mx-1">
                    <i className="fas fa-users me-2"></i>
                    <span className="d-none d-lg-inline">إدارة المستخدمين</span>
                  </Nav.Link>
                </LinkContainer>
                <LinkContainer to="/manage-rooms">
                  <Nav.Link className="d-flex align-items-center rounded-3 mx-1">
                    <i className="fas fa-door-open me-2"></i>
                    <span className="d-none d-lg-inline">إدارة القاعات</span>
                  </Nav.Link>
                </LinkContainer>
                {user && user.email === 'dean@example.com' && (
                  <LinkContainer to="/manage-doctors">
                    <Nav.Link className="d-flex align-items-center rounded-3 mx-1">
                      <i className="fas fa-user-md me-2"></i> {/* Icon for doctors */}
                      <span className="d-none d-lg-inline">إدارة الدكاترة</span>
                    </Nav.Link>
                  </LinkContainer>
                )}
              </>
            )}
            
            {(userRole === 'department_head' || userRole === 'supervisor') && (
              <>
                <LinkContainer to="/manage-users">
                  <Nav.Link className="d-flex align-items-center rounded-3 mx-1">
                    <i className="fas fa-users me-2"></i>
                    <span className="d-none d-lg-inline">إدارة المستخدمين</span>
                  </Nav.Link>
                </LinkContainer>
                <LinkContainer to="/manage-rooms">
                  <Nav.Link className="d-flex align-items-center rounded-3 mx-1">
                    <i className="fas fa-door-open me-2"></i>
                    <span className="d-none d-lg-inline">إدارة القاعات</span>
                  </Nav.Link>
                </LinkContainer>
                {userRole === 'department_head' && (
                  <LinkContainer to="/manage-supervisors">
                    <Nav.Link className="d-flex align-items-center rounded-3 mx-1">
                      <i className="fas fa-users-cog me-2"></i>
                      <span className="d-none d-lg-inline">إدارة المشرفين</span>
                    </Nav.Link>
                  </LinkContainer>
                )}
              </>
            )}
          </Nav>
          
          <Nav>
            <NavDropdown 
              title={
                <span className="d-flex align-items-center">
                  <i className="fas fa-user-circle me-2"></i>
                  <span className="d-none d-md-inline">{user?.full_name}</span>
                  <span className="d-inline d-md-none">الحساب</span>
                  <small className="text-light opacity-75 d-none d-lg-inline ms-1">
                    ({getRoleText(userRole)})
                  </small>
                </span>
              } 
              id="user-dropdown"
              align="end"
              className="user-dropdown rounded-3"
            >
              <NavDropdown.Item 
                onClick={handleLogout} 
                className="d-flex align-items-center text-danger rounded-3"
              >
                <i className="fas fa-sign-out-alt me-2"></i>
                تسجيل الخروج
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;
