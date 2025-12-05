const https = require('https');
const cheerio = require('cheerio');
const he = require('he');

class BibleApiService {
  constructor() {
    this.baseUrl = 'https://www.bible.com/api/bible';
    this.nextDataUrl = 'https://www.bible.com/_next/data';
    this.cachedToken = null;
    this.tokenExpiry = null;
    this.isCancelled = false;
  }

  cancelDownload() {
    this.isCancelled = true;
  }

  resetCancel() {
    this.isCancelled = false;
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

  // Fetch build token from Bible.com page for a specific version
  // Each version may have different token, so we fetch from the actual bible page
  async fetchBuildToken(versionId = 1, abbreviation = 'KJV') {
    try {
      // Build URL for first chapter of the version
      const pageUrl = `https://www.bible.com/bible/${versionId}/GEN.1.${abbreviation}`;
      console.log('Fetching build token from:', pageUrl);
      
      const html = await this.httpGet(pageUrl, false);
      
      // Look for buildId in the HTML (Next.js build ID)
      // Pattern: "buildId":"rWH85fiNVJ7L9K85GEf0o"
      const tokenMatch = html.match(/"buildId"\s*:\s*"([a-zA-Z0-9_-]+)"/);
      if (tokenMatch && tokenMatch[1]) {
        console.log('Got build token:', tokenMatch[1]);
        return tokenMatch[1];
      }
      
      // Try alternative pattern: _next/data/{token}/ 
      const altMatch = html.match(/_next\/data\/([a-zA-Z0-9_-]+)\//);
      if (altMatch && altMatch[1]) {
        console.log('Got build token (alt):', altMatch[1]);
        return altMatch[1];
      }
      
      // Fallback: try generic page
      console.log('Could not extract token from version page, trying generic...');
      const genericHtml = await this.httpGet('https://www.bible.com/bible/1/GEN.1.KJV', false);
      const genericMatch = genericHtml.match(/"buildId"\s*:\s*"([a-zA-Z0-9_-]+)"/);
      if (genericMatch && genericMatch[1]) {
        console.log('Got generic token:', genericMatch[1]);
        return genericMatch[1];
      }
      
      throw new Error('Could not extract build token');
    } catch (error) {
      console.error('Error fetching build token:', error);
      throw error;
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
    const versesMap = new Map(); // Use map to merge verses with same id
    
    $('span.verse').each((index, element) => {
      const $verse = $(element);
      const usfm = $verse.attr('data-usfm');
      
      if (usfm) {
        // Get all text content from .content spans
        let content = '';
        $verse.find('span.content').each((i, contentEl) => {
          content += $(contentEl).text();
        });
        
        // Decode HTML entities
        content = he.decode(content.trim());
        
        // Extract verse number from usfm (e.g., "GEN.1.1" -> "1")
        const parts = usfm.split('.');
        const verseNum = parseInt(parts[parts.length - 1]);
        
        if (content) {
          // If verse already exists, append content (for poetry/multi-line verses)
          if (versesMap.has(usfm)) {
            const existing = versesMap.get(usfm);
            existing.content += ' ' + content;
          } else {
            versesMap.set(usfm, {
              id: usfm,
              verse: verseNum,
              content: content,
            });
          }
        }
      }
    });
    
    // Convert map to array and sort by verse number
    const verses = Array.from(versesMap.values()).sort((a, b) => a.verse - b.verse);
    
    return verses;
  }

  async downloadFullBible(versionId, versionInfo, token, onProgress, concurrency = 5) {
    console.log('Starting download for version:', versionId);
    console.log('Version info:', JSON.stringify(versionInfo, null, 2));
    console.log('Concurrency:', concurrency);
    
    const { books } = await this.getBooksByVersion(versionId);
    console.log('Got books:', books.length);
    
    const abbr = versionInfo.abbreviation || versionInfo.local_abbreviation;
    
    // Fetch fresh token for this specific version
    console.log('Fetching fresh token for version:', versionId, abbr);
    const freshToken = await this.fetchBuildToken(versionId, abbr);
    console.log('Using fresh token:', freshToken);
    
    const bibleData = {
      id: versionInfo.id,
      abbreviation: abbr,
      title: versionInfo.title,
      local_title: versionInfo.local_title,
      language: versionInfo.language,
      copyright: versionInfo.copyright,
      downloadedAt: new Date().toISOString(),
      books: [],
    };
    
    // Build flat list of all chapters to download
    const allChapters = [];
    for (const book of books) {
      for (const chapter of (book.chapters || [])) {
        allChapters.push({
          book,
          chapter,
        });
      }
    }
    
    const totalChapters = allChapters.length;
    let processedChapters = 0;
    console.log('Using abbreviation:', abbr);
    console.log('Total chapters to download:', totalChapters);
    
    // Results map: bookUsfm -> { bookData, chapters: Map<chapterUsfm, chapterData> }
    const resultsMap = new Map();
    for (const book of books) {
      resultsMap.set(book.usfm, {
        bookData: {
          id: book.usfm,
          name: book.human,
          local_name: book.human_long,
          chapters: [],
        },
        chaptersMap: new Map(),
      });
    }
    
    // Concurrent download function
    const downloadChapter = async ({ book, chapter }) => {
      try {
        const chapterContent = await this.getChapterContent(
          versionId,
          chapter.usfm,
          abbr,
          freshToken
        );
        
        if (chapterContent) {
          const bookResult = resultsMap.get(book.usfm);
          bookResult.chaptersMap.set(chapter.usfm, {
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
        
      } catch (error) {
        console.error(`Error downloading ${chapter.usfm}:`, error.message);
        processedChapters++;
        // Continue with next chapter
      }
    };
    
    // Process chapters with concurrency limit
    const queue = [...allChapters];
    const executing = new Set();
    this.resetCancel(); // Reset cancel flag at start
    
    while (queue.length > 0 || executing.size > 0) {
      // Check if cancelled
      if (this.isCancelled) {
        console.log('Download cancelled by user');
        throw new Error('DOWNLOAD_CANCELLED');
      }
      
      // Fill up to concurrency limit
      while (queue.length > 0 && executing.size < concurrency) {
        const item = queue.shift();
        const promise = downloadChapter(item).then(() => {
          executing.delete(promise);
        });
        executing.add(promise);
      }
      
      // Wait for at least one to complete
      if (executing.size > 0) {
        await Promise.race(executing);
      }
      
      // Small delay to avoid rate limiting
      await this.delay(20);
    }
    
    // Assemble final data in correct order
    for (const book of books) {
      const bookResult = resultsMap.get(book.usfm);
      // Sort chapters by their order in the original book
      for (const chapter of (book.chapters || [])) {
        const chapterData = bookResult.chaptersMap.get(chapter.usfm);
        if (chapterData) {
          bookResult.bookData.chapters.push(chapterData);
        }
      }
      bibleData.books.push(bookResult.bookData);
    }
    
    return bibleData;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { BibleApiService };
