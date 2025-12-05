import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home24Regular,
  Home24Filled,
  ArrowDownload24Regular,
  ArrowDownload24Filled,
  Library24Regular,
  Library24Filled,
  Settings24Regular,
  Settings24Filled,
  Book24Regular,
} from '@fluentui/react-icons';

const navItems = [
  { path: '/', label: 'Trang chủ', icon: Home24Regular, iconActive: Home24Filled },
  { path: '/download', label: 'Tải Kinh Thánh', icon: ArrowDownload24Regular, iconActive: ArrowDownload24Filled },
  { path: '/library', label: 'Thư viện', icon: Library24Regular, iconActive: Library24Filled },
  { path: '/settings', label: 'Cài đặt', icon: Settings24Regular, iconActive: Settings24Filled },
];

function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>
            <Book24Regular />
            Bible Crawler
          </h1>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = isActive ? item.iconActive : item.icon;
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="nav-item-icon" />
                <span className="nav-item-text">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;
