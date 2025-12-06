import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Spinner,
  Badge,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  Radio,
  Tooltip,
} from '@fluentui/react-components';
import {
  ArrowDownload24Regular,
  Checkmark24Regular,
  MusicNote224Regular,
  Delete24Regular,
  Open24Regular,
} from '@fluentui/react-icons';

function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [suggestedVersions, setSuggestedVersions] = useState([]);
  const [downloadedBibles, setDownloadedBibles] = useState([]);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [exportFormat, setExportFormat] = useState('json');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onDownloadProgress((progress) => {
        setDownloadProgress(progress);
      });

      return () => {
        window.electronAPI.removeDownloadProgressListener();
      };
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load downloaded bibles
      const downloaded = await window.electronAPI.getDownloadedBibles();
      setDownloadedBibles(downloaded);
      
      // Get random versions from popular languages
      // vie = Vietnamese, eng = English, kor = Korean, zho = Chinese
      const languages = ['vie', 'eng', 'kor', 'zho'];
      const allVersions = [];
      
      for (const lang of languages) {
        try {
          const versions = await window.electronAPI.getVersionsByLanguage(lang);
          allVersions.push(...versions.slice(0, 3));
        } catch (e) {
          console.error(`Error loading ${lang} versions:`, e);
        }
      }
      
      // Filter out already downloaded
      const downloadedAbbrs = new Set(downloaded.map(d => d.abbreviation));
      const notDownloaded = allVersions.filter(v => !downloadedAbbrs.has(v.abbreviation));
      
      // Shuffle and take random 8
      const shuffled = notDownloaded.sort(() => 0.5 - Math.random());
      setSuggestedVersions(shuffled.slice(0, 8));
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadClick = (version) => {
    setSelectedVersion(version);
    setDownloadModalOpen(true);
  };

  const handleDownload = async () => {
    if (!selectedVersion) return;
    
    try {
      setDownloading(true);
      setDownloadProgress({ percentage: 0, book: '', chapter: '' });
      
      const bibleData = await window.electronAPI.downloadBible({
        versionId: selectedVersion.id,
        versionInfo: selectedVersion,
      });
      
      // Save to local
      await window.electronAPI.saveBibleLocal(bibleData);
      
      // Export if format selected
      if (exportFormat !== 'local') {
        await window.electronAPI.exportBible({
          bibleData,
          format: exportFormat,
        });
      }
      
      setDownloadModalOpen(false);
      setDownloadProgress(null);
      loadData();
      
    } catch (error) {
      console.error('Error downloading bible:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenReader = (bible) => {
    navigate(`/reader/${bible.abbreviation}`);
  };

  if (loading) {
    return (
      <>
        <header className="page-header">
          <h2>Trang chủ</h2>
          <p>Chào mừng bạn đến với Bible Crawler</p>
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
        <h2>Trang chủ</h2>
        <p>Chào mừng bạn đến với Bible Crawler - Công cụ tải dữ liệu Kinh Thánh</p>
      </header>
      
      <div className="page-content">
        {/* Downloaded Bibles Section */}
        {downloadedBibles.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Kinh Thánh đã tải ({downloadedBibles.length})</h3>
                <Button appearance="subtle" onClick={() => navigate('/library')}>
                  Xem tất cả
                </Button>
              </div>
              <div className="grid grid-4">
                {downloadedBibles.slice(0, 4).map((bible) => (
                  <div key={bible.abbreviation} className="bible-card" onClick={() => handleOpenReader(bible)}>
                    <div className="bible-card-title">{bible.abbreviation}</div>
                    <div className="bible-card-subtitle">{bible.local_title || bible.title}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="bible-card-badge badge-downloaded">
                        <Checkmark24Regular style={{ fontSize: 12 }} />
                        Đã tải
                      </span>
                      <span style={{ fontSize: 12, color: '#605e5c' }}>
                        {bible.booksCount} sách
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Suggested Versions Section */}
        <section>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Gợi ý tải về</h3>
              <Button appearance="subtle" onClick={() => navigate('/download')}>
                Xem thêm
              </Button>
            </div>
            <div className="grid grid-4">
              {suggestedVersions.map((version) => (
                <div key={version.id} className="bible-card">
                  <div className="bible-card-title">{version.abbreviation}</div>
                  <div className="bible-card-subtitle">{version.local_title || version.title}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                    {version.audio && (
                      <Tooltip content="Có audio" relationship="label">
                        <span className="bible-card-badge badge-audio">
                          <MusicNote224Regular style={{ fontSize: 12 }} />
                          Audio
                        </span>
                      </Tooltip>
                    )}
                    <span style={{ fontSize: 12, color: '#605e5c' }}>
                      {version.language?.local_name}
                    </span>
                  </div>
                  <Button
                    appearance="primary"
                    icon={<ArrowDownload24Regular />}
                    size="small"
                    onClick={() => handleDownloadClick(version)}
                  >
                    Tải về
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Download Dialog */}
      <Dialog open={downloadModalOpen} onOpenChange={(e, data) => setDownloadModalOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              Tải {selectedVersion?.abbreviation}
            </DialogTitle>
            <DialogContent>
              {downloading ? (
                <div className="progress-container">
                  <p className="progress-text">
                    Đang tải: {downloadProgress?.book} - Chương {downloadProgress?.chapter}
                  </p>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar" 
                      style={{ width: `${downloadProgress?.percentage || 0}%` }}
                    />
                  </div>
                  <p style={{ fontSize: 12, color: '#605e5c', marginTop: 8 }}>
                    {downloadProgress?.percentage}% ({downloadProgress?.current}/{downloadProgress?.total} chương)
                  </p>
                </div>
              ) : (
                <>
                  <p style={{ marginBottom: 16 }}>
                    Chọn định dạng file để lưu:
                  </p>
                  <RadioGroup value={exportFormat} onChange={(e, data) => setExportFormat(data.value)}>
                    <Radio value="local" label="Chỉ lưu nội bộ (để đọc trong app)" />
                    <Radio value="json" label="JSON (.json)" />
                    <Radio value="csv" label="CSV (.csv)" />
                    <Radio value="xml" label="XML (.xml)" />
                    <Radio value="sqlite" label="SQLite (.db)" />
                  </RadioGroup>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button 
                appearance="secondary" 
                onClick={() => setDownloadModalOpen(false)}
                disabled={downloading}
              >
                Hủy
              </Button>
              <Button 
                appearance="primary" 
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? 'Đang tải...' : 'Bắt đầu tải'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
}

export default HomePage;
