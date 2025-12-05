# Bible Crawler

Công cụ tải và quản lý dữ liệu Kinh Thánh từ Bible.com (YouVersion)

## Tính năng

- ✅ Tải toàn bộ nội dung Kinh Thánh theo phiên bản
- ✅ Lọc theo ngôn ngữ và tìm kiếm phiên bản
- ✅ Xuất dữ liệu sang nhiều định dạng: JSON, CSV, XML, SQLite
- ✅ Đọc Kinh Thánh offline với giao diện thân thiện
- ✅ Quản lý thư viện các phiên bản đã tải
- ✅ Giao diện Fluent UI của Microsoft

## Yêu cầu

- Node.js 18+
- npm hoặc yarn

## Cài đặt

```bash
# Clone hoặc tải project
cd Crawl-Bible-Data

# Cài đặt dependencies
npm install

# Chạy ở chế độ development
npm run dev

# Build cho production
npm run build

# Build cho Windows
npm run build:win

# Build cho macOS
npm run build:mac

# Build cho Linux
npm run build:linux
```

## Cấu trúc project

```
Crawl-Bible-Data/
├── assets/                    # Icons và assets
├── src/
│   ├── main/                  # Electron main process
│   │   ├── main.js           # Entry point
│   │   ├── preload.js        # Preload script
│   │   └── services/         # Backend services
│   │       ├── bibleApi.js   # Bible.com API service
│   │       └── exportService.js # Export service
│   └── renderer/             # React frontend
│       ├── components/       # UI components
│       ├── pages/           # Page components
│       ├── styles/          # CSS styles
│       ├── App.jsx          # Main app component
│       ├── main.jsx         # React entry point
│       └── index.html       # HTML template
├── package.json
├── vite.config.js
└── README.md
```

## Cấu hình Token

Ứng dụng cần một token để lấy nội dung các chương Kinh Thánh. Token mặc định đã được cấu hình, nhưng có thể hết hạn.

### Cách lấy token mới:

1. Truy cập [bible.com](https://bible.com)
2. Mở DevTools (F12) → Network tab
3. Chọn một chương Kinh Thánh bất kỳ
4. Tìm request có URL chứa `/_next/data/[TOKEN]/`
5. Sao chép phần TOKEN và dán vào phần Cài đặt của ứng dụng

## Format dữ liệu xuất

### JSON
```json
{
  "id": 114,
  "abbreviation": "NKJV",
  "title": "New King James Version",
  "local_title": "New King James Version",
  "language": {
    "iso_639_1": "en",
    "iso_639_3": "eng",
    "name": "English",
    "local_name": "English"
  },
  "books": [
    {
      "id": "GEN",
      "name": "Genesis",
      "local_name": "Genesis",
      "chapters": [
        {
          "id": "GEN.1",
          "chapter": 1,
          "verses": [
            {
              "id": "GEN.1.1",
              "verse": 1,
              "content": "In the beginning God created the heavens and the earth."
            }
          ]
        }
      ]
    }
  ]
}
```

### CSV
```csv
Bible,Book,Chapter,Verse,Content
NKJV,Genesis,1,1,"In the beginning God created the heavens and the earth."
```

### XML
```xml
<?xml version="1.0" encoding="UTF-8"?>
<bible id="114" abbreviation="NKJV" title="New King James Version">
  <language>...</language>
  <books>
    <book id="GEN" name="Genesis">
      <chapters>
        <chapter id="GEN.1" number="1">
          <verses>
            <verse id="GEN.1.1" number="1">In the beginning...</verse>
          </verses>
        </chapter>
      </chapters>
    </book>
  </books>
</bible>
```

### SQLite
Database với các bảng:
- `bible_info` - Thông tin phiên bản
- `books` - Danh sách sách
- `chapters` - Danh sách chương
- `verses` - Các câu Kinh Thánh

## Công nghệ sử dụng

- **Electron** - Cross-platform desktop app framework
- **React** - UI library
- **Fluent UI** - Microsoft's design system
- **Vite** - Build tool
- **better-sqlite3** - SQLite database
- **cheerio** - HTML parsing
- **axios** - HTTP client

## Lưu ý

- Dữ liệu được lưu trong thư mục userData của ứng dụng
- Token có thể hết hạn và cần cập nhật trong Cài đặt
- Quá trình tải có thể mất thời gian do rate limiting

## License

MIT
