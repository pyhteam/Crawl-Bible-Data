import React, { useState, useEffect, useMemo } from 'react';
import {
  Button,
  Spinner,
  Combobox,
  Option,
  Input,
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
  Badge,
} from '@fluentui/react-components';
import {
  ArrowDownload24Regular,
  Search24Regular,
  MusicNote224Regular,
  Checkmark24Regular,
  Filter24Regular,
} from '@fluentui/react-icons';

function DownloadPage() {
  const [loading, setLoading] = useState(true);
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [languageSearchQuery, setLanguageSearchQuery] = useState('');
  const [versions, setVersions] = useState([]);
  const [filteredVersions, setFilteredVersions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadedBibles, setDownloadedBibles] = useState(new Set());
  
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [exportFormat, setExportFormat] = useState('json');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedLanguage) {
      loadVersions(selectedLanguage);
    }
  }, [selectedLanguage]);

  useEffect(() => {
    filterVersions();
  }, [versions, searchQuery]);

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

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load languages
      const langs = await window.electronAPI.getLanguages();
      setLanguages(langs);
      
      // Load downloaded bibles
      const downloaded = await window.electronAPI.getDownloadedBibles();
      setDownloadedBibles(new Set(downloaded.map(d => d.abbreviation)));
      
      // Set default language to Vietnamese
      const defaultLang = langs.find(l => l.language_tag === 'vie') || langs[0];
      if (defaultLang) {
        setSelectedLanguage(defaultLang.language_tag);
      }
      
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVersions = async (languageTag) => {
    try {
      const vers = await window.electronAPI.getVersionsByLanguage(languageTag);
      setVersions(vers);
    } catch (error) {
      console.error('Error loading versions:', error);
      setVersions([]);
    }
  };

  const filterVersions = () => {
    if (!searchQuery.trim()) {
      setFilteredVersions(versions);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = versions.filter(v => 
      v.abbreviation.toLowerCase().includes(query) ||
      v.title.toLowerCase().includes(query) ||
      v.local_title?.toLowerCase().includes(query)
    );
    setFilteredVersions(filtered);
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
      
      const token = await window.electronAPI.getToken();
      
      const bibleData = await window.electronAPI.downloadBible({
        versionId: selectedVersion.id,
        versionInfo: selectedVersion,
        token,
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
      
      // Update downloaded set
      setDownloadedBibles(prev => new Set([...prev, selectedVersion.abbreviation]));
      
      setDownloadModalOpen(false);
      setDownloadProgress(null);
      
    } catch (error) {
      console.error('Error downloading bible:', error);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <>
        <header className="page-header">
          <h2>Tải Kinh Thánh</h2>
          <p>Tìm kiếm và tải các phiên bản Kinh Thánh</p>
        </header>
        <div className="page-content">
          <div className="loading-container">
            <Spinner size="large" label="Đang tải danh sách ngôn ngữ..." />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="page-header">
        <h2>Tải Kinh Thánh</h2>
        <p>Tìm kiếm và tải các phiên bản Kinh Thánh từ Bible.com</p>
      </header>
      
      <div className="page-content">
        {/* Filters */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="filters-container">
            <div className="filter-group">
              <label className="filter-label">Ngôn ngữ</label>
              <Combobox
                placeholder="Tìm kiếm ngôn ngữ..."
                value={languageSearchQuery}
                selectedOptions={selectedLanguage ? [selectedLanguage] : []}
                onOptionSelect={(e, data) => {
                  setSelectedLanguage(data.optionValue);
                  const lang = languages.find(l => l.language_tag === data.optionValue);
                  if (lang) {
                    setLanguageSearchQuery(`${lang.local_name} (${lang.name})`);
                  }
                }}
                onChange={(e) => setLanguageSearchQuery(e.target.value)}
                freeform
                style={{ minWidth: 300 }}
              >
                {languages
                  .filter(lang => {
                    if (!languageSearchQuery) return true;
                    const query = languageSearchQuery.toLowerCase();
                    return lang.local_name?.toLowerCase().includes(query) ||
                           lang.name?.toLowerCase().includes(query) ||
                           lang.language_tag?.toLowerCase().includes(query);
                  })
                  .slice(0, 50) // Limit to 50 results for performance
                  .map((lang) => (
                    <Option key={lang.language_tag} value={lang.language_tag} text={`${lang.local_name} (${lang.name})`}>
                      {lang.local_name} ({lang.name})
                    </Option>
                  ))}
              </Combobox>
            </div>
            
            <div className="filter-group" style={{ flex: 1 }}>
              <label className="filter-label">Tìm kiếm</label>
              <Input
                placeholder="Tìm theo tên hoặc mã phiên bản..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                contentBefore={<Search24Regular />}
                style={{ width: '100%', maxWidth: 400 }}
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              Các phiên bản ({filteredVersions.length})
            </h3>
          </div>
          
          {filteredVersions.length === 0 ? (
            <div className="empty-state">
              <Filter24Regular className="empty-state-icon" />
              <div className="empty-state-title">Không tìm thấy phiên bản</div>
              <div className="empty-state-text">
                Thử chọn ngôn ngữ khác hoặc thay đổi từ khóa tìm kiếm
              </div>
            </div>
          ) : (
            <div className="grid grid-3">
              {filteredVersions.map((version) => {
                const isDownloaded = downloadedBibles.has(version.abbreviation);
                
                return (
                  <div key={version.id} className="bible-card">
                    <div className="bible-card-title">{version.abbreviation}</div>
                    <div className="bible-card-subtitle" style={{ minHeight: 40 }}>
                      {version.local_title || version.title}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                      {isDownloaded && (
                        <span className="bible-card-badge badge-downloaded">
                          <Checkmark24Regular style={{ fontSize: 12 }} />
                          Đã tải
                        </span>
                      )}
                      {version.audio && (
                        <Tooltip content="Có audio" relationship="label">
                          <span className="bible-card-badge badge-audio">
                            <MusicNote224Regular style={{ fontSize: 12 }} />
                            Audio
                          </span>
                        </Tooltip>
                      )}
                    </div>
                    <Button
                      appearance={isDownloaded ? 'secondary' : 'primary'}
                      icon={isDownloaded ? <Checkmark24Regular /> : <ArrowDownload24Regular />}
                      size="small"
                      onClick={() => handleDownloadClick(version)}
                    >
                      {isDownloaded ? 'Tải lại' : 'Tải về'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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
                    <strong>{selectedVersion?.local_title || selectedVersion?.title}</strong>
                  </p>
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

export default DownloadPage;
