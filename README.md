# W3C Validation Scanner

A web application that scans URLs for W3C HTML validation errors. This tool helps you identify and fix HTML validation issues on your websites.

## Features

- Two input methods:
  - Direct list of URLs to scan
  - Single URL with automatic internal link scanning
- Batch validation of multiple URLs
- Separation of valid and invalid URLs in results
- Detailed error reporting for each invalid URL
- Progress tracking during validation

## How to Use

1. Open `index.html` in a web browser.

2. Input URLs in one of two ways:
   - **List of URLs**: Enter URLs line by line in the text area.
   - **Single URL with Scan**: Enter a single URL and click "Scan for Internal Links" to find all internal links on that page, then select which ones to validate.

3. Click "Validate URLs" to start the validation process.

4. View the results:
   - **Valid URLs**: Pages with no HTML validation errors.
   - **Invalid URLs**: Pages with HTML validation errors, showing the number of errors for each.

5. Click "View Details" next to any invalid URL to see the specific errors, including line numbers and error messages.

## Technical Details

- Uses the W3C Markup Validation Service API for HTML validation.
- Employs a CORS proxy (AllOrigins) to fetch external content and validation results.
- Built with vanilla JavaScript, HTML, and CSS with no external dependencies.

## Notes

- Due to CORS limitations, the application uses a third-party proxy service (AllOrigins). If this service is unavailable, the application may not function correctly.
- Validation of some URLs may fail if they're protected by authentication or robots.txt restrictions.
- The application is client-side only and doesn't store any data on servers.

## License

MIT 