Tool Crawl Bible Data from https://bible.com

# Yều cầu như sau:
Dựa vào api trong Bible.com.postman_collection.json (đây là api tôi lấy từ bible.com)
Hãy thực hiện viết 1 tool chuyên lấy dữ liệu từ api này để lưu lại thành 1 file json duy nhất, hoặc csv, hoặc sqlLite, xml

Luồng thực hiện như sau: 
Người dùng vào tool tại trang chủ của tool hiện sẵn 1 số các Phiên bản của Bible ngẫu nhiên mà người dùng chưa download dữ liệu về local
(Nghĩa là chưa tải file về local)
Người dùng có thể cấm nút tải file của phiên bản gợi ý nhanh đó. (hiện lên popup để lựa chọn đuôi file để tải về: json, csv, sqlLite, xml..v.v)

## Tại trang tải chính cho phép người dùng filter các phiên bản của Bible theo các tiêu chí sau:
- 1. Ngôn ngữ
- 2. Tên kinh thánh (thuộc ngôn ngữ đó)


## Đối với khi call api lấy content của sách thì phải nhập TOKENGETBOOK theo như api. nhớ lưu lại token này để sử dụng trong quá trình call api lấy content của sách 

Đối với conntent của book thì phải dencode html để lấy ra nội dung raw. và tách các câu kinh thánh ra.

## Ví dụ format tôi cần khi xử lý xong hết:
format tên file: Mã phiên bản kinh thánh + đuôi file
ví dụ: HMOWSV.json
{
... các thông tin về kinh thánh,
 "language": {
        ... các thông tin về ngôn ngữ
    },
 books: [
    {
        id: "... id của sách",
        ... các thông tin về sách,
        chapters: [
            {
                id: "... id của chapter",
                ... các thông tin về chapter,
                verses: [
                    {
                        id: "... id của verse",
                        content: "... nội dung của verse"
                    }
                ]
            }
        ]
    }
]
}
/// dữ liệu tải về được lưu trong thư mục data

## Có module xem các kinh thánh đã build 
và có thể đọc lại nội dung của kinh thánh đó 
với UI đọc dễ dàng như các app kinh thánh hiện tại đang làm.
(Kiều như là chọn Kinh Thánh -> chọn sách -> chọn chapter -> chọn verse) 

# Yêu cầu về công nghệ
- UI Tool thiết kế đẹp theo phong cách fluent UI mới nhất của microsoft
- Sử dụng  Golang hoặc NodeJS (xem cái nào phù hợp hơn để viết ra tool có thể build Windows, macOS tốt nhất)
- Layout UI thiết kế theo Admin Dashboard (có sidebar, header, footer)
- Tổ chức code chuyên nghiệp sạch sẽ, dễ dàng phát triển lớn
- Cơ chế build tự nâng cấp version.