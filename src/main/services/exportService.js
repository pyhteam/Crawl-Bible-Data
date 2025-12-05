const fs = require('fs');
const path = require('path');
const { XMLBuilder } = require('fast-xml-parser');

class ExportService {
  async export(bibleData, filePath, format) {
    switch (format) {
      case 'json':
        return this.exportToJson(bibleData, filePath);
      case 'csv':
        return this.exportToCsv(bibleData, filePath);
      case 'xml':
        return this.exportToXml(bibleData, filePath);
      case 'sqlite':
        return this.exportToSqlite(bibleData, filePath);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  async exportToJson(bibleData, filePath) {
    fs.writeFileSync(filePath, JSON.stringify(bibleData, null, 2), 'utf-8');
    return filePath;
  }

  async exportToCsv(bibleData, filePath) {
    const rows = [];
    
    // Header
    rows.push(['Bible', 'Book', 'Chapter', 'Verse', 'Content'].join(','));
    
    // Data
    for (const book of bibleData.books) {
      for (const chapter of book.chapters) {
        for (const verse of chapter.verses) {
          const content = this.escapeCsvValue(verse.content);
          rows.push([
            bibleData.abbreviation,
            book.name,
            chapter.chapter,
            verse.verse,
            content,
          ].join(','));
        }
      }
    }
    
    fs.writeFileSync(filePath, rows.join('\n'), 'utf-8');
    return filePath;
  }

  escapeCsvValue(value) {
    if (typeof value !== 'string') return value;
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  async exportToXml(bibleData, filePath) {
    const xmlData = {
      bible: {
        '@_id': bibleData.id,
        '@_abbreviation': bibleData.abbreviation,
        '@_title': bibleData.title,
        '@_localTitle': bibleData.local_title,
        language: bibleData.language,
        copyright: bibleData.copyright,
        books: {
          book: bibleData.books.map(book => ({
            '@_id': book.id,
            '@_name': book.name,
            '@_localName': book.local_name,
            chapters: {
              chapter: book.chapters.map(chapter => ({
                '@_id': chapter.id,
                '@_number': chapter.chapter,
                verses: {
                  verse: chapter.verses.map(verse => ({
                    '@_id': verse.id,
                    '@_number': verse.verse,
                    '#text': verse.content,
                  })),
                },
              })),
            },
          })),
        },
      },
    };

    const builder = new XMLBuilder({
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      ignoreAttributes: false,
      format: true,
      indentBy: '  ',
    });

    const xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n' + builder.build(xmlData);
    fs.writeFileSync(filePath, xmlContent, 'utf-8');
    return filePath;
  }

  async exportToSqlite(bibleData, filePath) {
    // Dynamic import for better-sqlite3
    const Database = require('better-sqlite3');
    
    // Remove existing file if exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    const db = new Database(filePath);
    
    // Create tables
    db.exec(`
      CREATE TABLE bible_info (
        id INTEGER PRIMARY KEY,
        abbreviation TEXT,
        title TEXT,
        local_title TEXT,
        language_tag TEXT,
        language_name TEXT,
        language_local_name TEXT,
        copyright_text TEXT,
        downloaded_at TEXT
      );
      
      CREATE TABLE books (
        id TEXT PRIMARY KEY,
        name TEXT,
        local_name TEXT,
        book_order INTEGER
      );
      
      CREATE TABLE chapters (
        id TEXT PRIMARY KEY,
        book_id TEXT,
        chapter_number INTEGER,
        FOREIGN KEY (book_id) REFERENCES books(id)
      );
      
      CREATE TABLE verses (
        id TEXT PRIMARY KEY,
        chapter_id TEXT,
        verse_number INTEGER,
        content TEXT,
        FOREIGN KEY (chapter_id) REFERENCES chapters(id)
      );
      
      CREATE INDEX idx_chapters_book ON chapters(book_id);
      CREATE INDEX idx_verses_chapter ON verses(chapter_id);
      CREATE INDEX idx_verses_content ON verses(content);
    `);
    
    // Insert bible info
    const insertBibleInfo = db.prepare(`
      INSERT INTO bible_info (id, abbreviation, title, local_title, language_tag, language_name, language_local_name, copyright_text, downloaded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertBibleInfo.run(
      bibleData.id,
      bibleData.abbreviation,
      bibleData.title,
      bibleData.local_title,
      bibleData.language?.language_tag || '',
      bibleData.language?.name || '',
      bibleData.language?.local_name || '',
      bibleData.copyright?.text || '',
      bibleData.downloadedAt
    );
    
    // Insert books, chapters, verses
    const insertBook = db.prepare('INSERT INTO books (id, name, local_name, book_order) VALUES (?, ?, ?, ?)');
    const insertChapter = db.prepare('INSERT INTO chapters (id, book_id, chapter_number) VALUES (?, ?, ?)');
    const insertVerse = db.prepare('INSERT INTO verses (id, chapter_id, verse_number, content) VALUES (?, ?, ?, ?)');
    
    const insertAll = db.transaction(() => {
      let bookOrder = 0;
      
      for (const book of bibleData.books) {
        insertBook.run(book.id, book.name, book.local_name, bookOrder++);
        
        for (const chapter of book.chapters) {
          insertChapter.run(chapter.id, book.id, chapter.chapter);
          
          for (const verse of chapter.verses) {
            insertVerse.run(verse.id, chapter.id, verse.verse, verse.content);
          }
        }
      }
    });
    
    insertAll();
    db.close();
    
    return filePath;
  }
}

module.exports = { ExportService };
