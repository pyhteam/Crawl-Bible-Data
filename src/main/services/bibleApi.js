const axios = require('axios');
const cheerio = require('cheerio');
const he = require('he');

class BibleApiService {
  constructor() {
    this.baseUrl = 'https://www.bible.com/api/bible';
    this.nextDataUrl = 'https://www.bible.com/_next/data';
  }

  async getLanguages() {
    try {
      const response = await axios.get(`${this.baseUrl}/configuration`);
      const data = response.data.response?.data;
      
      if (data && data.default_versions) {
        // Extract unique languages from default_versions
        const languagesMap = new Map();
        
        data.default_versions.forEach(version => {
          if (version.language && !languagesMap.has(version.language.language_tag)) {
            languagesMap.set(version.language.language_tag, version.language);
          }
        });
        
        return Array.from(languagesMap.values()).sort((a, b) => 
          a.local_name.localeCompare(b.local_name)
        );
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching languages:', error);
      throw error;
    }
  }

  async getVersionsByLanguage(languageTag) {
    try {
      const response = await axios.get(`${this.baseUrl}/versions`, {
        params: {
          language_tag: languageTag,
          type: 'all',
        },
      });
      
      const versions = response.data.response?.data?.versions || [];
      return versions;
    } catch (error) {
      console.error('Error fetching versions:', error);
      throw error;
    }
  }

  async getBooksByVersion(versionId) {
    try {
      const response = await axios.get(`${this.baseUrl}/version/${versionId}`);
      const data = response.data.response?.data;
      
      if (data) {
        return {
          versionInfo: {
            id: data.id,
            abbreviation: data.abbreviation,
            local_abbreviation: data.local_abbreviation,
            title: data.title,
            local_title: data.local_title,
            language: data.language,
            copyright: data.copyright_short,
          },
          books: data.books || [],
        };
      }
      
      return { versionInfo: null, books: [] };
    } catch (error) {
      console.error('Error fetching books:', error);
      throw error;
    }
  }

  async getChapterContent(versionId, usfm, abbreviation, token) {
    try {
      const url = `${this.nextDataUrl}/${token}/en/bible/${versionId}/${usfm}.${abbreviation}.json`;
      
      const response = await axios.get(url, {
        params: {
          versionId: versionId,
          usfm: `${usfm}.${abbreviation}`,
        },
      });
      
      const pageProps = response.data.pageProps;
      
      if (pageProps && pageProps.chapterInfo) {
        const content = pageProps.chapterInfo.content;
        const verses = this.parseVerses(content);
        
        return {
          reference: pageProps.chapterInfo.reference,
          verses: verses,
          copyright: pageProps.chapterInfo.copyright,
          next: pageProps.chapterInfo.next,
          previous: pageProps.chapterInfo.previous,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching chapter content:', error);
      throw error;
    }
  }

  parseVerses(htmlContent) {
    const $ = cheerio.load(htmlContent);
    const verses = [];
    
    $('span.verse').each((index, element) => {
      const $verse = $(element);
      const usfm = $verse.attr('data-usfm');
      
      if (usfm) {
        // Get all text content from .content spans
        let content = '';
        $verse.find('span.content').each((i, contentEl) => {
          content += $(contentEl).text();
        });
        
        // Also include italic text
        $verse.find('span.it span.content').each((i, itEl) => {
          // Already included above, but ensure formatting
        });
        
        // Decode HTML entities
        content = he.decode(content.trim());
        
        // Extract verse number from usfm (e.g., "GEN.1.1" -> "1")
        const parts = usfm.split('.');
        const verseNum = parts[parts.length - 1];
        
        if (content) {
          verses.push({
            id: usfm,
            verse: parseInt(verseNum),
            content: content,
          });
        }
      }
    });
    
    return verses;
  }

  async downloadFullBible(versionId, versionInfo, token, onProgress) {
    const { books } = await this.getBooksByVersion(versionId);
    
    const bibleData = {
      id: versionInfo.id,
      abbreviation: versionInfo.abbreviation || versionInfo.local_abbreviation,
      title: versionInfo.title,
      local_title: versionInfo.local_title,
      language: versionInfo.language,
      copyright: versionInfo.copyright,
      downloadedAt: new Date().toISOString(),
      books: [],
    };
    
    let totalChapters = 0;
    books.forEach(book => {
      totalChapters += book.chapters?.length || 0;
    });
    
    let processedChapters = 0;
    
    for (const book of books) {
      const bookData = {
        id: book.usfm,
        name: book.human,
        local_name: book.human_long,
        chapters: [],
      };
      
      for (const chapter of (book.chapters || [])) {
        try {
          const chapterContent = await this.getChapterContent(
            versionId,
            chapter.usfm,
            versionInfo.abbreviation || versionInfo.local_abbreviation,
            token
          );
          
          if (chapterContent) {
            bookData.chapters.push({
              id: chapter.usfm,
              chapter: parseInt(chapter.human),
              verses: chapterContent.verses,
            });
          }
          
          processedChapters++;
          
          if (onProgress) {
            onProgress({
              current: processedChapters,
              total: totalChapters,
              book: book.human,
              chapter: chapter.human,
              percentage: Math.round((processedChapters / totalChapters) * 100),
            });
          }
          
          // Rate limiting - wait 100ms between requests
          await this.delay(100);
          
        } catch (error) {
          console.error(`Error downloading ${chapter.usfm}:`, error.message);
          // Continue with next chapter
        }
      }
      
      bibleData.books.push(bookData);
    }
    
    return bibleData;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { BibleApiService };
