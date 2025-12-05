import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Spinner,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  Radio,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from '@fluentui/react-components';
import {
  Open24Regular,
  Delete24Regular,
  MoreHorizontal24Regular,
  ArrowExportUp24Regular,
  Library24Regular,
  Checkmark24Regular,
} from '@fluentui/react-icons';

function LibraryPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bibles, setBibles] = useState([]);
  const [selectedBible, setSelectedBible] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadBibles();
  }, []);

  const loadBibles = async () => {
    try {
      setLoading(true);
      const downloaded = await window.electronAPI.getDownloadedBibles();
      setBibles(downloaded);
    } catch (error) {
      console.error('Error loading bibles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReader = (bible) => {
    navigate(`/reader/${bible.abbreviation}`);
  };

  const handleDeleteClick = (bible) => {
    setSelectedBible(bible);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedBible) return;
    
    try {
      await window.electronAPI.deleteDownloadedBible(selectedBible.abbreviation);
      setDeleteDialogOpen(false);
      loadBibles();
    } catch (error) {
      console.error('Error deleting bible:', error);
    }
  };

  const handleExportClick = (bible) => {
    setSelectedBible(bible);
    setExportDialogOpen(true);
  };

  const handleExport = async () => {
    if (!selectedBible) return;
    
    try {
      setExporting(true);
      const bibleData = await window.electronAPI.readDownloadedBible(selectedBible.filePath);
      await window.electronAPI.exportBible({
        bibleData,
        format: exportFormat,
      });
      setExportDialogOpen(false);
    } catch (error) {
      console.error('Error exporting bible:', error);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <>
        <header className="page-header">
          <h2>Thư viện</h2>
          <p>Quản lý các phiên bản Kinh Thánh đã tải</p>
        </header>
        <div className="page-content">
          <div className="loading-container">
            <Spinner size="large" label="Đang tải..." />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="page-header">
        <h2>Thư viện</h2>
        <p>Quản lý các phiên bản Kinh Thánh đã tải ({bibles.length} phiên bản)</p>
      </header>
      
      <div className="page-content">
        {bibles.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <Library24Regular className="empty-state-icon" />
              <div className="empty-state-title">Chưa có Kinh Thánh nào</div>
              <div className="empty-state-text">
                Hãy tải một phiên bản Kinh Thánh để bắt đầu đọc
              </div>
              <Button 
                appearance="primary" 
                onClick={() => navigate('/download')}
                style={{ marginTop: 16 }}
              >
                Tải Kinh Thánh
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-3">
            {bibles.map((bible) => (
              <div key={bible.abbreviation} className="bible-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="bible-card-title">{bible.abbreviation}</div>
                    <div className="bible-card-subtitle">{bible.local_title || bible.title}</div>
                  </div>
                  <Menu>
                    <MenuTrigger disableButtonEnhancement>
                      <Button appearance="subtle" icon={<MoreHorizontal24Regular />} size="small" />
                    </MenuTrigger>
                    <MenuPopover>
                      <MenuList>
                        <MenuItem icon={<ArrowExportUp24Regular />} onClick={() => handleExportClick(bible)}>
                          Xuất file
                        </MenuItem>
                        <MenuItem icon={<Delete24Regular />} onClick={() => handleDeleteClick(bible)}>
                          Xóa
                        </MenuItem>
                      </MenuList>
                    </MenuPopover>
                  </Menu>
                </div>
                
                <div style={{ marginTop: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: '#605e5c' }}>
                    {bible.language?.local_name} • {bible.booksCount} sách
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    appearance="primary"
                    icon={<Open24Regular />}
                    size="small"
                    onClick={() => handleOpenReader(bible)}
                  >
                    Đọc
                  </Button>
                  <Button
                    appearance="secondary"
                    icon={<ArrowExportUp24Regular />}
                    size="small"
                    onClick={() => handleExportClick(bible)}
                  >
                    Xuất
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(e, data) => setDeleteDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogContent>
              <p>
                Bạn có chắc chắn muốn xóa <strong>{selectedBible?.abbreviation}</strong>?
              </p>
              <p style={{ color: '#605e5c', marginTop: 8 }}>
                Hành động này không thể hoàn tác. Bạn sẽ cần tải lại nếu muốn sử dụng phiên bản này.
              </p>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setDeleteDialogOpen(false)}>
                Hủy
              </Button>
              <Button appearance="primary" onClick={handleDelete} style={{ backgroundColor: '#d13438' }}>
                Xóa
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={(e, data) => setExportDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Xuất {selectedBible?.abbreviation}</DialogTitle>
            <DialogContent>
              <p style={{ marginBottom: 16 }}>
                Chọn định dạng file để xuất:
              </p>
              <RadioGroup value={exportFormat} onChange={(e, data) => setExportFormat(data.value)}>
                <Radio value="json" label="JSON (.json)" />
                <Radio value="csv" label="CSV (.csv)" />
                <Radio value="xml" label="XML (.xml)" />
                <Radio value="sqlite" label="SQLite (.db)" />
              </RadioGroup>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setExportDialogOpen(false)} disabled={exporting}>
                Hủy
              </Button>
              <Button appearance="primary" onClick={handleExport} disabled={exporting}>
                {exporting ? 'Đang xuất...' : 'Xuất file'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
}

export default LibraryPage;
