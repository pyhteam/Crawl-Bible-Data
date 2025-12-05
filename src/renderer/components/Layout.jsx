import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button, Tooltip } from '@fluentui/react-components';
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
  PanelLeft24Regular,
  PanelLeftExpand24Regular,
  WeatherMoon24Regular,
  WeatherSunny24Regular,
} from '@fluentui/react-icons';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { path: '/', label: 'Trang chủ', icon: Home24Regular, iconActive: Home24Filled },
  { path: '/download', label: 'Tải Kinh Thánh', icon: ArrowDownload24Regular, iconActive: ArrowDownload24Filled },
  { path: '/library', label: 'Thư viện', icon: Library24Regular, iconActive: Library24Filled },
  { path: '/settings', label: 'Cài đặt', icon: Settings24Regular, iconActive: Settings24Filled },
];

function Layout({ children }) {
  const location = useLocation();
  const { isDarkMode, toggleDarkMode, sidebarCollapsed, toggleSidebar } = useTheme();

  return (
    <div className={`app-container ${isDarkMode ? 'dark' : ''}`}>
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h1>
            <Book24Regular />
            {!sidebarCollapsed && <span>Bible Crawler</span>}
          </h1>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = isActive ? item.iconActive : item.icon;
            
            return (
              <Tooltip 
                key={item.path}
                content={sidebarCollapsed ? item.label : ''} 
                relationship="label"
                positioning="after"
              >
                <NavLink
                  to={item.path}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon className="nav-item-icon" />
                  {!sidebarCollapsed && <span className="nav-item-text">{item.label}</span>}
                </NavLink>
              </Tooltip>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <Tooltip content={isDarkMode ? 'Chế độ sáng' : 'Chế độ tối'} relationship="label">
            <Button
              appearance="subtle"
              icon={isDarkMode ? <WeatherSunny24Regular /> : <WeatherMoon24Regular />}
              onClick={toggleDarkMode}
              className="sidebar-btn"
            />
          </Tooltip>
          <Tooltip content={sidebarCollapsed ? 'Mở rộng' : 'Thu gọn'} relationship="label">
            <Button
              appearance="subtle"
              icon={sidebarCollapsed ? <PanelLeftExpand24Regular /> : <PanelLeft24Regular />}
              onClick={toggleSidebar}
              className="sidebar-btn"
            />
          </Tooltip>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;
