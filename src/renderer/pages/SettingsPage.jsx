import React from 'react';
import {
  Switch,
} from '@fluentui/react-components';
import {
  WeatherMoon24Regular,
  WeatherSunny24Regular,
} from '@fluentui/react-icons';
import { useTheme } from '../context/ThemeContext';

function SettingsPage() {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <>
      <header className="page-header">
        <h2>Cài đặt</h2>
        <p>Cấu hình ứng dụng Bible Crawler</p>
      </header>
      
      <div className="page-content">
        {/* Theme Settings */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isDarkMode ? <WeatherMoon24Regular /> : <WeatherSunny24Regular />}
              Giao diện
            </h3>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>Chế độ tối</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Bật chế độ tối để giảm mỏi mắt khi đọc trong môi trường thiếu sáng
              </div>
            </div>
            <Switch
              checked={isDarkMode}
              onChange={toggleDarkMode}
            />
          </div>
        </div>
        
        {/* About */}
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <h3 className="card-title">Thông tin ứng dụng</h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', fontSize: 14 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Tên ứng dụng:</span>
            <span>Bible Crawler</span>
            
            <span style={{ color: 'var(--text-secondary)' }}>Phiên bản:</span>
            <span>1.0.0</span>
            
            <span style={{ color: 'var(--text-secondary)' }}>Nguồn dữ liệu:</span>
            <span>Bible.com (YouVersion)</span>
            
            <span style={{ color: 'var(--text-secondary)' }}>Định dạng hỗ trợ:</span>
            <span>JSON, CSV, XML, SQLite</span>
          </div>
        </div>
        
        {/* Features */}
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <h3 className="card-title">Tính năng</h3>
          </div>
          
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8, fontSize: 14, color: 'var(--text-primary)' }}>
            <li>Tải toàn bộ nội dung Kinh Thánh theo phiên bản</li>
            <li>Lọc theo ngôn ngữ và tìm kiếm phiên bản</li>
            <li>Xuất dữ liệu sang nhiều định dạng: JSON, CSV, XML, SQLite</li>
            <li>Đọc Kinh Thánh offline với giao diện thân thiện</li>
            <li>Quản lý thư viện các phiên bản đã tải</li>
            <li>Điều chỉnh cỡ chữ khi đọc</li>
            <li>Tải đa luồng để tăng tốc độ</li>
            <li>Chế độ tối để đọc ban đêm</li>
          </ul>
        </div>
      </div>
    </>
  );
}

export default SettingsPage;
