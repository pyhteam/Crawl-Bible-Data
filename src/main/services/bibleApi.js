const https = require('https');
const cheerio = require('cheerio');
const he = require('he');

class BibleApiService {
  constructor() {
    this.baseUrl = 'https://www.bible.com/api/bible';
    this.nextDataUrl = 'https://www.bible.com/_next/data';
    this.cachedToken = null;
    this.tokenExpiry = null;
  }

  // Helper method to make HTTPS GET requests
  httpGet(url, isJson = true) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': isJson ? 'application/json, text/plain, */*' : 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (isJson) {
            try {
              const parsed = JSON.parse(data);
              resolve(parsed);
            } catch (e) {
              console.error('Failed to parse JSON:', data.substring(0, 200));
              reject(new Error('Failed to parse JSON response'));
            }
          } else {
            resolve(data);
          }
        });
      });
      
      req.on('error', reject);
      req.end();
    });
  }

  // Fetch build token from Bible.com page
  async fetchBuildToken() {
    try {
      // Check if cached token is still valid (cache for 1 hour)
      if (this.cachedToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.cachedToken;
      }

      console.log('Fetching new build token from Bible.com...');
      const html = await this.httpGet('https://www.bible.com/bible/1/GEN.1.KJV', false);
      
      // Look for buildId in the HTML (Next.js build ID)
      // Pattern: "buildId":"fxAgRC8gE-rJH0I7i37xV"
      const tokenMatch = html.match(/"buildId"\s*:\s*"([a-zA-Z0-9_-]+)"/);
      if (tokenMatch && tokenMatch[1]) {
        this.cachedToken = tokenMatch[1];
        this.tokenExpiry = Date.now() + 3600000; // Cache for 1 hour
        console.log('Got new token:', this.cachedToken);
        return this.cachedToken;
      }
      
      // Try alternative pattern: _next/data/{token}/ 
      const altMatch = html.match(/_next\/data\/([a-zA-Z0-9_-]+)\//);
      if (altMatch && altMatch[1]) {
        this.cachedToken = altMatch[1];
        this.tokenExpiry = Date.now() + 3600000;
        console.log('Got new token (alt):', this.cachedToken);
        return this.cachedToken;
      }
      
      // Fallback to default token
      console.log('Could not extract token, using default');
      return 'fxAgRC8gE-rJH0I7i37xV';
    } catch (error) {
      console.error('Error fetching build token:', error);
      return 'fxAgRC8gE-rJH0I7i37xV';
    }
  }

  async getLanguages() {
    try {
      console.log('Fetching languages from:', `${this.baseUrl}/configuration`);
      const response = await this.httpGet(`${this.baseUrl}/configuration`);
      const data = response.response?.data;
      
      if (data && data.default_versions) {
        // default_versions is now a list of languages directly
        // Each item has: iso_639_3, language_tag, local_name, name, text_direction, etc.
        const languages = data.default_versions
          .filter(lang => lang.language_tag && lang.has_text)
          .map(lang => ({
            iso_639_1: lang.iso_639_1,
            iso_639_3: lang.iso_639_3,
            name: lang.name,
            local_name: lang.local_name,
            text_direction: lang.text_direction,
            language_tag: lang.language_tag,
          }))
          .sort((a, b) => a.local_name.localeCompare(b.local_name));
        
        console.log('Loaded', languages.length, 'languages');
        return languages;
      }
      
      console.log('No languages found in response');
      return [];
    } catch (error) {
      console.error('Error fetching languages:', error);
      throw error;
    }
  }

  async getVersionsByLanguage(languageTag) {
    try {
      const url = `${this.baseUrl}/versions?language_tag=${encodeURIComponent(languageTag)}&type=all`;
      console.log('Fetching versions for:', languageTag);
      const response = await this.httpGet(url);
      
      const versions = response.response?.data?.versions || [];
      console.log('Loaded', versions.length, 'versions for', languageTag);
      return versions;
    } catch (error) {
      console.error('Error fetching versions:', error);
      throw error;
    }
  }

  async getBooksByVersion(versionId) {
    try {
      // This API returns JSON directly without response.data wrapper
      const data = await this.httpGet(`${this.baseUrl}/version/${versionId}`);
      
      if (data && data.books) {
        console.log('Loaded', data.books.length, 'books for version', versionId);
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
      
      console.log('No books found in response for version', versionId);
      return { versionInfo: null, books: [] };
    } catch (error) {
      console.error('Error fetching books:', error);
      throw error;
    }
  }

  async getChapterContent(versionId, usfm, abbreviation, token) {
    try {
      const url = `${this.nextDataUrl}/${token}/en/bible/${versionId}/${usfm}.${abbreviation}.json?versionId=${versionId}&usfm=${encodeURIComponent(`${usfm}.${abbreviation}`)}`;
      
      const response = await this.httpGet(url);
      
      const pageProps = response.pageProps;
      
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
    console.log('Starting download for version:', versionId);
    console.log('Version info:', JSON.stringify(versionInfo, null, 2));
    console.log('Token:', token);
    
    const { books } = await this.getBooksByVersion(versionId);
    console.log('Got books:', books.length);
    
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
    const abbr = versionInfo.abbreviation || versionInfo.local_abbreviation;
    console.log('Using abbreviation:', abbr);
    
    for (const book of books) {
      const bookData = {
        id: book.usfm,
        name: book.human,
        local_name: book.human_long,
        chapters: [],
      };
      
      for (const chapter of (book.chapters || [])) {
        try {
          console.log(`Downloading ${chapter.usfm}...`);
          const chapterContent = await this.getChapterContent(
            versionId,
            chapter.usfm,
            abbr,
            token
          );
          
          if (chapterContent) {
            console.log(`  Got ${chapterContent.verses.length} verses`);
            bookData.chapters.push({
              id: chapter.usfm,
              chapter: parseInt(chapter.human),
              verses: chapterContent.verses,
            });
          } else {
            console.log(`  No content returned`);
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
