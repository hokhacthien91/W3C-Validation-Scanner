document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const resultTabButtons = document.querySelectorAll('.result-tab-btn');
    const resultTabContents = document.querySelectorAll('.result-tab-content');
    const validateBtn = document.getElementById('validate-btn');
    const urlList = document.getElementById('url-list');
    const singleUrlInput = document.getElementById('single-url-input');
    const scanLinksBtn = document.getElementById('scan-links-btn');
    // const internalLinksContainer = document.getElementById('internal-links-container');
    const internalLinksList = document.getElementById('internal-links-list');
    const selectAllBtn = document.getElementById('select-all-btn');
    const deselectAllBtn = document.getElementById('deselect-all-btn');
    const resultsSection = document.querySelector('.results-section');
    const progressBar = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    const validList = document.querySelector('.valid-list');
    const invalidList = document.querySelector('.invalid-list');
    const validCount = document.getElementById('valid-count');
    const invalidCount = document.getElementById('invalid-count');
    const summaryValid = document.querySelector('#summary-valid .summary-count');
    const summaryInvalid = document.querySelector('#summary-invalid .summary-count');
    const warningList = document.querySelector('.warning-list');
    const warningCount = document.getElementById('warning-count');
    const summaryWarning = document.querySelector('#summary-warning .summary-count');
    // const errorDetails = document.getElementById('error-details');
    // const errorContent = document.querySelector('.error-content');
    // const closeDetailsBtn = document.getElementById('close-details');

    // Tab switching logic
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Update tab buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update tab contents
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Result tab switching logic
    resultTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-result-tab');
            
            // Update tab buttons
            resultTabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update tab contents
            resultTabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Accordion logic
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const accordionItem = header.parentElement;
            accordionItem.classList.toggle('open');
            
            // Update icon
            const icon = header.querySelector('.accordion-icon i');
            if (accordionItem.classList.contains('open')) {
                icon.className = 'fas fa-chevron-down';
            } else {
                icon.className = 'fas fa-chevron-right';
            }
        });
    });

    // Scan for internal links
    scanLinksBtn.addEventListener('click', async () => {
        const url = singleUrlInput.value.trim();
        if (!url) {
            alert('Please enter a valid URL');
            return;
        }

        try {
            internalLinksList.innerHTML = '<p>Scanning for links...</p>';
            const links = await scanForInternalLinks(url);
            
            // Update the header with the number of links found
            const linkCountHeader = document.querySelector('#internal-links-container h3');
            
            if (links.length === 0) {
                internalLinksList.innerHTML = '<p>No internal links found.</p>';
                linkCountHeader.textContent = 'Internal Links (0)';
                selectAllBtn.classList.add('hidden');
                deselectAllBtn.classList.add('hidden');
                return;
            }
            
            linkCountHeader.textContent = `Internal Links (${links.length})`;
            renderInternalLinks(links);
            selectAllBtn.classList.remove('hidden');
            deselectAllBtn.classList.remove('hidden');
        } catch (error) {
            internalLinksList.innerHTML = `<p>Error: ${error.message}</p>`;
            const linkCountHeader = document.querySelector('#internal-links-container h3');
            linkCountHeader.textContent = 'Internal Links (0)';
            selectAllBtn.classList.add('hidden');
            deselectAllBtn.classList.add('hidden');
        }
    });

    // Select/Deselect all links
    selectAllBtn.addEventListener('click', () => {
        const checkboxes = internalLinksList.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => checkbox.checked = true);
    });

    deselectAllBtn.addEventListener('click', () => {
        const checkboxes = internalLinksList.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => checkbox.checked = false);
    });

    // Validate URLs
    validateBtn.addEventListener('click', async () => {
        let urls = [];
        
        // Get URLs based on active tab
        const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');
        
        if (activeTab === 'list-input') {
            // Get URLs from textarea
            urls = urlList.value.trim().split('\n')
                .map(url => url.trim())
                .filter(url => url);
        } else {
            // Get selected URLs from internal links
            const checkboxes = internalLinksList.querySelectorAll('input[type="checkbox"]:checked');
            urls = Array.from(checkboxes).map(checkbox => checkbox.value);
        }
        
        if (urls.length === 0) {
            alert('Please enter at least one URL to validate');
            return;
        }
        
        // Reset and show results section
        validList.innerHTML = '';
        invalidList.innerHTML = '';
        warningList.innerHTML = '';
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        validCount.textContent = '0';
        invalidCount.textContent = '0';
        warningCount.textContent = '0';
        summaryValid.textContent = '0';
        summaryInvalid.textContent = '0';
        summaryWarning.textContent = '0';
        resultsSection.classList.remove('hidden');
        
        // Make sure the invalid accordion is open by default
        document.getElementById('invalid-accordion').classList.add('open');
        document.getElementById('valid-accordion').classList.remove('open');
        
        // Process each URL and validate
        await validateUrls(urls);
    });

    // Close error details
    // closeDetailsBtn.addEventListener('click', () => {
    //     errorDetails.classList.add('hidden');
    // });

    // Lưu kết quả scan để export
    let lastValidUrls = [];
    let lastInvalidUrls = [];
    let warningUrls = [];

    function isScanError(error) {
        const msg = error.message || '';
        return msg.includes('Failed to validate') || msg.includes('proxy') || msg.includes('CORS') || msg.includes('Failed to access');
    }

    function renderWarningUrl(url, result) {
        const urlElement = document.createElement('div');
        urlElement.className = 'url-item warning';
        urlElement.innerHTML = `
            <span class="url-text" title="${url}">${truncateUrl(url)}</span>
            <div class="error-info">
                <span class="error-count">!</span>
            </div>
            <div class="warning-details">${result.errors.map(e => e.message).join('<br>')}</div>
        `;
        warningList.appendChild(urlElement);
        warningUrls.push(url);
        warningCount.textContent = warningUrls.length;
        summaryWarning.textContent = warningUrls.length;
    }

    // Validate URLs using W3C API (with rate limit)
    async function validateUrls(urls) {
        const validUrls = [];
        const invalidUrls = [];
        warningList.innerHTML = '';
        warningUrls = [];
        warningCount.textContent = '0';
        summaryWarning.textContent = '0';
        
        for (let i = 0; i < urls.length; i++) {
            try {
                const url = urls[i];
                const result = await validateUrl(url);
                
                if (result.valid) {
                    validUrls.push({ url, result });
                    renderValidUrl(url);
                    validCount.textContent = validUrls.length;
                    summaryValid.textContent = validUrls.length;
                } else if (isScanError(result.errors[0])) {
                    renderWarningUrl(url, result);
                } else {
                    invalidUrls.push({ url, result });
                    renderInvalidUrl(url, result);
                    invalidCount.textContent = invalidUrls.length;
                    summaryInvalid.textContent = invalidUrls.length;
                }
                
                // Update progress
                const progress = Math.round(((i + 1) / urls.length) * 100);
                progressBar.style.width = `${progress}%`;
                progressText.textContent = `${progress}%`;
                
            } catch (error) {
                console.error(`Error validating ${urls[i]}:`, error);
                const scanErrorResult = { errors: [{ message: `Failed to validate: ${error.message}` }] };
                renderWarningUrl(urls[i], scanErrorResult);
                
                // Update progress
                const progress = Math.round(((i + 1) / urls.length) * 100);
                progressBar.style.width = `${progress}%`;
                progressText.textContent = `${progress}%`;
            }

            // Thêm delay 2000ms giữa các request
            await sleep(1000);
        }
        
        // Lưu lại kết quả để export
        lastValidUrls = validUrls;
        lastInvalidUrls = invalidUrls;
        
        // Return the results
        return { validUrls, invalidUrls };
    }

    // Export report to CSV (mỗi row là 1 URL, lỗi gộp vào 1 cột)
    function exportReportCSV(validUrls, invalidUrls) {
        let csv = 'Type,URL,Error Count,Errors\n';
        validUrls.forEach(item => {
            csv += `Valid,"${item.url}",0,""\n`;
        });
        invalidUrls.forEach(item => {
            // Gộp tất cả lỗi thành 1 chuỗi
            const errorDetails = item.result.errors.map((e, idx) => {
                const msg = (e.message || '').replace(/"/g, "'");
                const extract = (e.extract || '').replace(/"/g, "'").replace(/\n/g, ' ');
                const line = e.lastLine || '';
                const col = e.lastColumn || '';
                return `#${idx + 1}: ${msg}${line ? ` (Line: ${line}` : ''}${col ? `, Col: ${col}` : ''}${(line||col)?')':''}${extract ? ` [HTML: ${extract}]` : ''}`;
            }).join(' | ');
            csv += `Invalid,"${item.url}","${errorDetails}"\n`;
        });

        // Tạo file và trigger download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'w3c_report.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Sự kiện cho nút export
    document.getElementById('export-report-btn').addEventListener('click', function() {
        if (lastValidUrls.length === 0 && lastInvalidUrls.length === 0) {
            alert('No report data to export. Please scan URLs first.');
            return;
        }
        exportReportCSV(lastValidUrls, lastInvalidUrls);
    });

    // Hàm loại bỏ query string và fragment
    function removeParamsAndFragments(url) {
        try {
            const u = new URL(url);
            u.search = '';
            u.hash = '';
            return u.href;
        } catch {
            return url;
        }
    }

    // Function to scan for internal links
    async function scanForInternalLinks(url) {
        try {
            // Check if URL is localhost
            const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');
            let html;
            
            if (isLocalhost) {
                // For localhost, try direct fetch (this will work when running from the same origin)
                try {
                    const response = await fetch(url);
                    html = await response.text();
                } catch (e) {
                    // If direct fetch fails for localhost, inform the user
                    throw new Error('Cannot directly scan localhost URLs from a different origin. Please either: 1) Run this tool from the same localhost server, or 2) Use a public URL.');
                }
            } else {
                // For non-localhost, use the proxy service
                console.log('Scanning URL:', url);
                try {
                    // Try with allorigins.win
                    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
                    const data = await response.json();
                    console.log('Data:', data);
                    if (!data.contents) {
                        throw new Error('No content returned from proxy');
                    }
                    html = data.contents;
                } catch (proxyError) {
                    // Try with alternative proxy if the first one fails
                    try {
                        const response = await fetch(`https://cors-anywhere.herokuapp.com/${url}`);
                        html = await response.text();
                    } catch (e) {
                        // If both proxy services fail, try a direct fetch as last resort
                        try {
                            const response = await fetch(url, { mode: 'no-cors' });
                            html = await response.text();
                        } catch (directError) {
                            throw new Error('Failed to fetch URL through proxy services. You might need to allow CORS for this request.');
                        }
                    }
                }
            }
            
            // Create a DOM parser
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Get all links
            const linkElements = Array.from(doc.querySelectorAll('a[href]'));
            
            const links = linkElements
                .map(a => {
                    // Get href attribute
                    const href = a.getAttribute('href');
                    // Handle relative URLs
                    const abs = ensureAbsoluteUrl(href, url);
                    // Bỏ param và fragment
                    return abs ? removeParamsAndFragments(abs) : null;
                })
                .filter(href => isInternalLink(href, url))
                .filter((href, idx, arr) => href && arr.indexOf(href) === idx); // loại trùng
            
            // Remove duplicates (đã loại ở trên)
            return links;
        } catch (error) {
            console.error('Error scanning for links:', error);
            throw error;
        }
    }

    // Check if a link is internal
    function isInternalLink(href, baseUrl) {
        try {
            // Skip empty links, javascript: links, mailto: links, tel: links, and anchor links
            if (!href || 
                href.startsWith('javascript:') || 
                href.startsWith('mailto:') || 
                href.startsWith('tel:') || 
                href === '#' || 
                href.startsWith('#')) {
                return false;
            }
            
            const url = new URL(href, baseUrl);
            const base = new URL(baseUrl);
            
            // Check if same origin
            return url.hostname === base.hostname;
        } catch (e) {
            // If URL parsing fails, it's likely a malformed URL
            console.warn('Invalid URL:', href);
            return false;
        }
    }

    // Ensure URL is absolute
    function ensureAbsoluteUrl(href, baseUrl) {
        try {
            // Handle empty hrefs
            if (!href) return null;
            
            // Skip javascript:, mailto:, tel: links
            if (href.startsWith('javascript:') || 
                href.startsWith('mailto:') || 
                href.startsWith('tel:')) {
                return null;
            }
            
            // Create absolute URL
            return new URL(href, baseUrl).href;
        } catch (e) {
            console.warn('Error creating absolute URL:', href);
            return null;
        }
    }

    // Render internal links with checkboxes
    function renderInternalLinks(links) {
        internalLinksList.innerHTML = links.map((link, index) => `
            <div class="link-item">
                <input type="checkbox" id="link-${index}" value="${link}" checked>
                <label for="link-${index}" title="${link}">${truncateUrl(link)}</label>
            </div>
        `).join('');
    }

    // Truncate long URLs for display
    function truncateUrl(url) {
        const maxLength = 100;
        return url.length > maxLength ? url.substring(0, maxLength) + '...' : url;
    }

    // Sleep utility for rate limiting
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Validate a single URL using W3C API
    async function validateUrl(url) {
        try {
            // Check if URL is localhost
            const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');
            
            if (isLocalhost) {
                // For localhost, use a different approach or inform the user
                // that W3C validation might not work directly with localhost URLs
                throw new Error('W3C validation service cannot access localhost URLs. Please deploy to a public server for validation.');
            }
            
            console.log('Validating URL:', url);
            // Use W3C validation API
            const apiUrl = `https://validator.w3.org/nu/?doc=${encodeURIComponent(url)}&out=json`;
            
            // We need a CORS proxy for this request
            // Try the first proxy
            try {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`;
                const response = await fetch(proxyUrl);
                console.log('Response:', response);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                
                const data = await response.json();
                
                console.log('Data:', data);
                if (!data.contents) {
                    throw new Error('Failed to fetch validation results');
                }
                
                // Parse the contents as JSON
                const result = JSON.parse(data.contents);
                
                console.log('Result:', result);
                // Check for errors or warnings
                const errors = result.messages.filter(msg => msg.type === 'error');
                const warnings = result.messages.filter(msg => msg.type === 'warning' || msg.type === 'info');
                
                return {
                    valid: errors.length === 0,
                    errors,
                    warnings,
                    url
                };
            } catch (proxyError) {
                // Try alternative proxy if the first one fails
                try {
                    const corsProxy = `https://cors-anywhere.herokuapp.com/${apiUrl}`;
                    const response = await fetch(corsProxy);
                    console.log('Response proxyError:', response);
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    
                    const result = await response.json();
                    
                    // Check for errors or warnings
                    const errors = result.messages.filter(msg => msg.type === 'error');
                    const warnings = result.messages.filter(msg => msg.type === 'warning' || msg.type === 'info');
                    
                    return {
                        valid: errors.length === 0,
                        errors,
                        warnings,
                        url
                    };
                } catch (altProxyError) {
                    throw new Error('Failed to access W3C validation service through proxy. Try again later or use a different URL.');
                }
            }
        } catch (error) {
            console.error('Validation error:', error);
            throw error;
        }
    }

    // Render a valid URL in the results
    function renderValidUrl(url) {
        const urlElement = document.createElement('div');
        urlElement.className = 'url-item valid';
        urlElement.innerHTML = `
            <span class="url-text" title="${url}">${truncateUrl(url)}</span>
        `;
        validList.appendChild(urlElement);
    }

    // Render an invalid URL in the results
    function renderInvalidUrl(url, result) {
        const urlId = 'error-' + url.replace(/[^a-z0-9]/gi, '-');
        const urlElement = document.createElement('div');
        urlElement.className = 'url-item error';
        urlElement.setAttribute('data-target', urlId);
        urlElement.innerHTML = `
            <span class="url-text" title="${url}">${truncateUrl(url)}</span>
            <div class="error-info">
                <span class="error-count">${result.errors.length}</span>
                <span class="toggle-indicator">
                    <i class="fas fa-chevron-down"></i>
                </span>
            </div>
        `;
        
        // Create error details section (collapsed initially)
        const errorDetails = document.createElement('div');
        errorDetails.className = 'error-details';
        errorDetails.id = urlId;
        
        let errorContent = `
            <div class="error-url">
                <h4>URL: ${url}</h4>
            </div>
        `;
        
        if (result.errors.length === 0) {
            errorContent += '<p>No errors found.</p>';
        } else {
            errorContent += `<div class="errors-list">`;
            
            result.errors.forEach((error, index) => {
                errorContent += `
                    <div class="error-message">
                        <div class="error-header">
                            <span class="error-number">Error ${index + 1}</span>
                        </div>
                        <div class="error-details-content">
                            <p class="error-text">${error.message}</p>
                `;
                
                // Build context information
                let contextInfo = '';
                if (error.lastLine) {
                    contextInfo += `<div class="error-location">Line: ${error.lastLine}, Column: ${error.lastColumn}</div>`;
                }
                
                // Add extract with highlighting
                if (error.extract) {
                    const extractHtml = highlightErrorInExtract(error);
                    errorContent += `
                        <div class="error-code-container">
                            ${contextInfo}
                            <pre class="error-code">${extractHtml}</pre>
                        </div>
                    `;
                } else if (contextInfo) {
                    errorContent += `<div class="error-location-container">${contextInfo}</div>`;
                }
                
                errorContent += `
                        </div>
                    </div>
                `;
            });
            
            errorContent += `</div>`;
        }
        
        errorDetails.innerHTML = errorContent;
        
        // Add to the DOM
        invalidList.appendChild(urlElement);
        invalidList.appendChild(errorDetails);
        
        // Add event listener to the entire URL item
        urlElement.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const detailsElement = document.getElementById(targetId);
            const indicator = this.querySelector('.toggle-indicator i');
            
            // Toggle the details visibility
            if (detailsElement.classList.contains('open')) {
                detailsElement.classList.remove('open');
                this.classList.remove('active');
                indicator.className = 'fas fa-chevron-down';
            } else {
                detailsElement.classList.add('open');
                this.classList.add('active');
                indicator.className = 'fas fa-chevron-up';
            }
        });
    }
    
    // Highlight the error portion in the extract
    function highlightErrorInExtract(error) {
        if (!error.extract) return '';
        
        let extract = error.extract;
        // Replace < and > with &lt; and &gt; to display HTML code
        extract = extract.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // If we have hiliteStart and hiliteLength, highlight that portion
        if (error.hiliteStart !== undefined && error.hiliteLength !== undefined) {
            const start = error.hiliteStart;
            const length = error.hiliteLength;
            
            // Highlight by wrapping in a span
            const before = extract.substring(0, start);
            const highlighted = extract.substring(start, start + length);
            const after = extract.substring(start + length);
            
            return `${before}<span class="highlight">${highlighted}</span>${after}`;
        }
        
        return extract;
    }
}); 