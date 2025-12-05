import React, { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Text,
  Card,
  Label,
  Field,
  Divider,
} from '@fluentui/react-components';
import {
  Save24Regular,
  Key24Regular,
  Info24Regular,
  Checkmark24Regular,
} from '@fluentui/react-icons';

function SettingsPage() {
  const [token, setToken] = useState('');
  const [savedToken, setSavedToken] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      const currentToken = await window.electronAPI.getToken();
      setToken(currentToken);
      setSavedToken(currentToken);
    } catch (error) {
      console.error('Error loading token:', error);
    }
  };

  const handleSaveToken = async () => {
    try {
      await window.electronAPI.setToken(token);
      setSavedToken(token);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  };

  return (
    <>
      <header className="page-header">
        <h2>Cài đặt</h2>
        <p>Cấu hình ứng dụng Bible Crawler</p>
      </header>
      
      <div className="page-content">
        {/* Token Settings */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Key24Regular />
              Token API
            </h3>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <div style={{ 
              padding: 12, 
              background: '#f3f2f1', 
              borderRadius: 4, 
              marginBottom: 16,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8
            }}>
              <Info24Regular style={{ color: '#0078d4', flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 13, color: '#605e5c' }}>
                <p style={{ marginBottom: 8 }}>
                  Token được sử dụng để lấy nội dung các chương Kinh Thánh từ Bible.com.
                </p>
                <p style={{ marginBottom: 8 }}>
                  Để lấy token mới:
                </p>
                <ol style={{ marginLeft: 20, marginBottom: 0 }}>
                  <li>Truy cập <a href="https://bible.com" target="_blank" rel="noreferrer">bible.com</a></li>
                  <li>Mở DevTools (F12) → Network tab</li>
                  <li>Chọn một chương Kinh Thánh bất kỳ</li>
                  <li>Tìm request có URL chứa <code>/_next/data/[TOKEN]/</code></li>
                  <li>Sao chép phần TOKEN và dán vào đây</li>
                </ol>
              </div>
            </div>
            
            <Field label="Token">
              <Input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Nhập token..."
                style={{ width: '100%', maxWidth: 500 }}
              />
            </Field>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button 
              appearance="primary" 
              icon={<Save24Regular />}
              onClick={handleSaveToken}
              disabled={token === savedToken}
            >
              Lưu Token
            </Button>
            
            {saved && (
              <span style={{ color: '#107c10', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                <Checkmark24Regular style={{ fontSize: 16 }} />
                Đã lưu
              </span>
            )}
          </div>
        </div>
        
        {/* About */}
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <h3 className="card-title">Thông tin ứng dụng</h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', fontSize: 14 }}>
            <span style={{ color: '#605e5c' }}>Tên ứng dụng:</span>
            <span>Bible Crawler</span>
            
            <span style={{ color: '#605e5c' }}>Phiên bản:</span>
            <span>1.0.0</span>
            
            <span style={{ color: '#605e5c' }}>Nguồn dữ liệu:</span>
            <span>Bible.com (YouVersion)</span>
            
            <span style={{ color: '#605e5c' }}>Định dạng hỗ trợ:</span>
            <span>JSON, CSV, XML, SQLite</span>
          </div>
        </div>
        
        {/* Features */}
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <h3 className="card-title">Tính năng</h3>
          </div>
          
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8, fontSize: 14, color: '#323130' }}>
            <li>Tải toàn bộ nội dung Kinh Thánh theo phiên bản</li>
            <li>Lọc theo ngôn ngữ và tìm kiếm phiên bản</li>
            <li>Xuất dữ liệu sang nhiều định dạng: JSON, CSV, XML, SQLite</li>
            <li>Đọc Kinh Thánh offline với giao diện thân thiện</li>
            <li>Quản lý thư viện các phiên bản đã tải</li>
            <li>Điều chỉnh cỡ chữ khi đọc</li>
          </ul>
        </div>
      </div>
    </>
  );
}

export default SettingsPage;
