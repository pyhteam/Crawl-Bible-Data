import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Spinner,
  Dropdown,
  Option,
  Text,
} from '@fluentui/react-components';
import {
  ArrowLeft24Regular,
  ChevronLeft24Regular,
  ChevronRight24Regular,
  TextFont24Regular,
} from '@fluentui/react-icons';

function ReaderPage() {
  const { abbreviation } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [bibleData, setBibleData] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [fontSize, setFontSize] = useState(18);

  useEffect(() => {
    loadBible();
  }, [abbreviation]);

  const loadBible = async () => {
    try {
      setLoading(true);
      const bibles = await window.electronAPI.getDownloadedBibles();
      const bible = bibles.find(b => b.abbreviation === abbreviation);
      
      if (bible) {
        const fullData = await window.electronAPI.readDownloadedBible(bible.filePath);
        setBibleData(fullData);
        
        // Auto-select first book and chapter
        if (fullData.books && fullData.books.length > 0) {
          setSelectedBook(fullData.books[0]);
          if (fullData.books[0].chapters && fullData.books[0].chapters.length > 0) {
            setSelectedChapter(fullData.books[0].chapters[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading bible:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookChange = (bookId) => {
    const book = bibleData.books.find(b => b.id === bookId);
    if (book) {
      setSelectedBook(book);
      if (book.chapters && book.chapters.length > 0) {
        setSelectedChapter(book.chapters[0]);
      }
    }
  };

  const handleChapterChange = (chapterNum) => {
    const chapter = selectedBook?.chapters?.find(c => c.chapter === parseInt(chapterNum));
    if (chapter) {
      setSelectedChapter(chapter);
    }
  };

  const goToPreviousChapter = () => {
    if (!selectedBook || !selectedChapter) return;
    
    const currentIndex = selectedBook.chapters.findIndex(c => c.chapter === selectedChapter.chapter);
    
    if (currentIndex > 0) {
      // Previous chapter in same book
      setSelectedChapter(selectedBook.chapters[currentIndex - 1]);
    } else {
      // Previous book, last chapter
      const bookIndex = bibleData.books.findIndex(b => b.id === selectedBook.id);
      if (bookIndex > 0) {
        const prevBook = bibleData.books[bookIndex - 1];
        setSelectedBook(prevBook);
        if (prevBook.chapters && prevBook.chapters.length > 0) {
          setSelectedChapter(prevBook.chapters[prevBook.chapters.length - 1]);
        }
      }
    }
  };

  const goToNextChapter = () => {
    if (!selectedBook || !selectedChapter) return;
    
    const currentIndex = selectedBook.chapters.findIndex(c => c.chapter === selectedChapter.chapter);
    
    if (currentIndex < selectedBook.chapters.length - 1) {
      // Next chapter in same book
      setSelectedChapter(selectedBook.chapters[currentIndex + 1]);
    } else {
      // Next book, first chapter
      const bookIndex = bibleData.books.findIndex(b => b.id === selectedBook.id);
      if (bookIndex < bibleData.books.length - 1) {
        const nextBook = bibleData.books[bookIndex + 1];
        setSelectedBook(nextBook);
        if (nextBook.chapters && nextBook.chapters.length > 0) {
          setSelectedChapter(nextBook.chapters[0]);
        }
      }
    }
  };

  if (loading) {
    return (
      <>
        <header className="page-header">
          <Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={() => navigate('/library')}>
            Quay lại
          </Button>
        </header>
        <div className="page-content">
          <div className="loading-container">
            <Spinner size="large" label="Đang tải Kinh Thánh..." />
          </div>
        </div>
      </>
    );
  }

  if (!bibleData) {
    return (
      <>
        <header className="page-header">
          <Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={() => navigate('/library')}>
            Quay lại
          </Button>
        </header>
        <div className="page-content">
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-title">Không tìm thấy Kinh Thánh</div>
              <Button appearance="primary" onClick={() => navigate('/library')} style={{ marginTop: 16 }}>
                Về thư viện
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="reader-container">
      {/* Reader Sidebar */}
      <div className="reader-sidebar">
        <div style={{ padding: 16, borderBottom: '1px solid #edebe9' }}>
          <Button 
            appearance="subtle" 
            icon={<ArrowLeft24Regular />} 
            onClick={() => navigate('/library')}
            style={{ marginBottom: 12 }}
          >
            Quay lại
          </Button>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
            {bibleData.abbreviation}
          </h3>
          <p style={{ fontSize: 12, color: '#605e5c' }}>
            {bibleData.local_title || bibleData.title}
          </p>
        </div>
        
        <div style={{ padding: 16, flex: 1, overflowY: 'auto' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#605e5c', display: 'block', marginBottom: 4 }}>
              Sách
            </label>
            <Dropdown
              placeholder="Chọn sách"
              value={selectedBook?.id}
              selectedOptions={selectedBook ? [selectedBook.id] : []}
              onOptionSelect={(e, data) => handleBookChange(data.optionValue)}
              style={{ width: '100%' }}
            >
              {bibleData.books.map((book) => (
                <Option key={book.id} value={book.id}>
                  {book.local_name || book.name}
                </Option>
              ))}
            </Dropdown>
          </div>
          
          {selectedBook && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#605e5c', display: 'block', marginBottom: 4 }}>
                Chương
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {selectedBook.chapters.map((chapter) => (
                  <Button
                    key={chapter.chapter}
                    appearance={selectedChapter?.chapter === chapter.chapter ? 'primary' : 'subtle'}
                    size="small"
                    style={{ minWidth: 40 }}
                    onClick={() => handleChapterChange(chapter.chapter)}
                  >
                    {chapter.chapter}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#605e5c', display: 'block', marginBottom: 4 }}>
              Cỡ chữ
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button 
                appearance="subtle" 
                size="small"
                onClick={() => setFontSize(Math.max(12, fontSize - 2))}
              >
                A-
              </Button>
              <span style={{ fontSize: 14 }}>{fontSize}px</span>
              <Button 
                appearance="subtle" 
                size="small"
                onClick={() => setFontSize(Math.min(32, fontSize + 2))}
              >
                A+
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Navigation Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '12px 32px',
          borderBottom: '1px solid #edebe9',
          background: 'white'
        }}>
          <Button 
            appearance="subtle" 
            icon={<ChevronLeft24Regular />}
            onClick={goToPreviousChapter}
            disabled={!selectedBook || !selectedChapter}
          >
            Trước
          </Button>
          
          <Text weight="semibold" size={400}>
            {selectedBook?.local_name || selectedBook?.name} {selectedChapter?.chapter}
          </Text>
          
          <Button 
            appearance="subtle" 
            icon={<ChevronRight24Regular />}
            iconPosition="after"
            onClick={goToNextChapter}
            disabled={!selectedBook || !selectedChapter}
          >
            Sau
          </Button>
        </div>
        
        {/* Verses Content */}
        <div className="reader-content" style={{ fontSize }} key={`${selectedBook?.id}-${selectedChapter?.chapter}`}>
          {selectedChapter ? (
            <>
              <h2 style={{ 
                textAlign: 'center', 
                marginBottom: 24,
                fontSize: fontSize + 4,
                fontWeight: 600,
                color: '#323130'
              }}>
                {selectedBook?.local_name || selectedBook?.name} - Chương {selectedChapter.chapter}
              </h2>
              
              {selectedChapter.verses?.map((verse, index) => (
                <div key={`${selectedChapter.chapter}-${verse.id}-${index}`} className="verse">
                  <sup className="verse-number">{verse.verse}</sup>
                  <span className="verse-content" style={{ fontSize }}>
                    {verse.content}
                  </span>
                </div>
              ))}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-title">Chọn một chương để đọc</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReaderPage;
