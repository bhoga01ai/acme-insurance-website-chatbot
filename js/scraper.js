// Website content scraper

// Function to scrape website content
async function scrapeWebsiteContent() {
    console.log('Starting website content scraping...');
    const content = [];
    
    // Get all sections
    const sections = document.querySelectorAll('section');
    
    sections.forEach(section => {
        // Get section ID for organization
        const sectionId = section.id || 'unknown';
        content.push(`\n\n=== SECTION: ${sectionId.toUpperCase()} ===\n`);
        
        // Extract headings
        const headings = section.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => {
            if (heading.textContent.trim()) {
                content.push(`# ${heading.textContent.trim()}`);
            }
        });
        
        // Extract paragraphs
        const paragraphs = section.querySelectorAll('p');
        paragraphs.forEach(paragraph => {
            if (paragraph.textContent.trim()) {
                content.push(paragraph.textContent.trim());
            }
        });
        
        // Extract list items
        const lists = section.querySelectorAll('ul, ol');
        lists.forEach(list => {
            const items = list.querySelectorAll('li');
            items.forEach(item => {
                if (item.textContent.trim()) {
                    content.push(`- ${item.textContent.trim()}`);
                }
            });
        });
        
        // Extract service cards
        const serviceCards = section.querySelectorAll('.service-card');
        serviceCards.forEach(card => {
            const title = card.querySelector('h3')?.textContent.trim() || '';
            const description = card.querySelector('p')?.textContent.trim() || '';
            
            if (title && description) {
                content.push(`## ${title}\n${description}`);
            }
        });
    });
    
    // Add footer information
    const footer = document.querySelector('#footer');
    if (footer) {
        content.push(`\n\n=== FOOTER ===\n`);
        
        const footerLogo = footer.querySelector('.footer-logo');
        if (footerLogo) {
            const title = footerLogo.querySelector('h3')?.textContent.trim() || '';
            const subtitle = footerLogo.querySelector('p')?.textContent.trim() || '';
            if (title) content.push(`# ${title}`);
            if (subtitle) content.push(subtitle);
        }
        
        const contactInfo = footer.querySelectorAll('.footer-contact p');
        if (contactInfo.length > 0) {
            content.push('\n## Contact Information');
            contactInfo.forEach(info => {
                if (info.textContent.trim()) {
                    content.push(info.textContent.trim());
                }
            });
        }
    }
    
    console.log('Scraped content from website');
    return content.join('\n');
}

// Function to save content to a file
async function saveContentToFile(content) {
    try {
        console.log('Creating downloadable file...');
        
        // Create a blob with the content
        const blob = new Blob([content], { type: 'text/plain' });
        
        // Create a URL for the blob
        const url = URL.createObjectURL(blob);
        
        // Create a link element
        const a = document.createElement('a');
        a.href = url;
        a.download = 'website_content.txt';
        
        // Append the link to the body
        document.body.appendChild(a);
        
        // Click the link to download the file
        a.click();
        
        // Remove the link from the body
        document.body.removeChild(a);
        
        // Revoke the URL to free up memory
        URL.revokeObjectURL(url);
        
        console.log('Content saved successfully');
        alert('Website content has been scraped and downloaded successfully!');
    } catch (error) {
        console.error('Error saving content:', error);
        alert('An error occurred while saving the scraped content.');
    }
}

// Main function to scrape and save
async function scrapeAndSave() {
    const content = await scrapeWebsiteContent();
    await saveContentToFile(content);
}

// Execute when the script is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Scraper script loaded');
    
    // Create a button to trigger scraping
    const scrapeButton = document.createElement('button');
    scrapeButton.textContent = 'Scrape Website Content';
    scrapeButton.style.position = 'fixed';
    scrapeButton.style.bottom = '20px';
    scrapeButton.style.left = '20px';
    scrapeButton.style.zIndex = '1000';
    scrapeButton.style.padding = '10px 15px';
    scrapeButton.style.backgroundColor = '#3182CE';
    scrapeButton.style.color = 'white';
    scrapeButton.style.border = 'none';
    scrapeButton.style.borderRadius = '5px';
    scrapeButton.style.cursor = 'pointer';
    
    scrapeButton.addEventListener('click', scrapeAndSave);
    document.body.appendChild(scrapeButton);
});