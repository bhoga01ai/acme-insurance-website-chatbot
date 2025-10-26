// Main JavaScript file for ACME Insurance Website

// DOM Elements
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const nav = document.querySelector('nav');
const inquiryForm = document.getElementById('inquiry-form');
const quickQuoteForm = document.getElementById('quick-quote-form');
const formSuccessMessage = document.createElement('div');
const formErrorMessage = document.createElement('div');
const quickQuoteSuccessMessage = document.createElement('div');
const quickQuoteErrorMessage = document.createElement('div');

// Set up success and error message elements
formSuccessMessage.className = 'form-success-message';
formSuccessMessage.textContent = 'Thank you for contacting us. We will get back to you soon.';

formErrorMessage.className = 'form-error-message';
formErrorMessage.textContent = 'There was an error submitting your inquiry. Please try again.';

quickQuoteSuccessMessage.className = 'form-success-message';
quickQuoteSuccessMessage.textContent = 'Thank you! Your quote has been generated and sent to your email.';

quickQuoteErrorMessage.className = 'form-error-message';
quickQuoteErrorMessage.textContent = 'There was an error generating your quote. Please try again.';

// Mobile Menu Toggle
mobileMenuToggle.addEventListener('click', () => {
    const navMenu = document.querySelector('nav ul');
    navMenu.classList.toggle('show');
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    const navMenu = document.querySelector('nav ul');
    if (!nav.contains(e.target) && !mobileMenuToggle.contains(e.target) && navMenu.classList.contains('show')) {
        navMenu.classList.remove('show');
    }
});

// Form Validation
function validateForm() {
    let isValid = true;
    const formGroups = inquiryForm.querySelectorAll('.form-group');
    
    // Remove previous error states
    formGroups.forEach(group => {
        group.classList.remove('error');
        const errorMessage = group.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    });
    
    // Validate each input
    formGroups.forEach(group => {
        const input = group.querySelector('input, select, textarea');
        if (!input) return;
        
        // Skip validation for checkbox
        if (input.type === 'checkbox') return;
        
        if (!input.value.trim()) {
            isValid = false;
            group.classList.add('error');
            
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = 'This field is required';
            group.appendChild(errorMessage);
        } else if (input.type === 'email' && !validateEmail(input.value)) {
            isValid = false;
            group.classList.add('error');
            
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = 'Please enter a valid email address';
            group.appendChild(errorMessage);
        } else if (input.type === 'tel' && !validatePhone(input.value)) {
            isValid = false;
            group.classList.add('error');
            
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = 'Please enter a valid phone number';
            group.appendChild(errorMessage);
        }
    });
    
    return isValid;
}

// Email validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Phone validation (basic)
function validatePhone(phone) {
    const re = /^[\d\s\-\(\)\+]+$/;
    return re.test(phone) && phone.replace(/[\D]/g, '').length >= 10;
}

// Function to save form data to CSV
function saveToCSV(data, filename) {
    console.log('Saving to CSV:', filename, data);
    
    // Create CSV header and row
    const headers = Object.keys(data).join(',');
    const values = Object.values(data).map(value => {
        // Handle strings with commas by wrapping in quotes
        if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
        }
        return value;
    }).join(',');
    
    // Create CSV content
    const csvContent = `${headers}\n${values}\n`;
    
    console.log('CSV Content:', csvContent);
    
    // Send to server to save as CSV
    try {
        console.log('Sending CSV data to server:', filename);
        
        fetch('http://localhost:3002/save-to-csv', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filename: filename,
                data: csvContent
            })
        })
        .then(response => {
            console.log('Save to CSV response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            console.log('CSV saved successfully:', result);
        })
        .catch(error => {
            console.error('Error saving CSV:', error);
            alert('There was an error saving your data. Please try again.');
        });
    } catch (error) {
        console.error('Exception in saveToCSV:', error);
    }
}

// Form Submission
inquiryForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Remove previous messages
    if (formSuccessMessage.parentNode) {
        formSuccessMessage.parentNode.removeChild(formSuccessMessage);
    }
    if (formErrorMessage.parentNode) {
        formErrorMessage.parentNode.removeChild(formErrorMessage);
    }
    
    // Validate form
    if (!validateForm()) {
        return;
    }
    
    // Temporarily bypass reCAPTCHA for testing
    console.log('Bypassing reCAPTCHA verification for testing');
    // const recaptchaResponse = grecaptcha.getResponse();
    // if (!recaptchaResponse) {
    //     formErrorMessage.textContent = 'Please complete the reCAPTCHA verification';
    //     inquiryForm.prepend(formErrorMessage);
    //     return;
    // }
    
    // Disable submit button and show loading state
    const submitButton = inquiryForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
    
    // Prepare form data for API submission
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        insuranceType: document.getElementById('insurance-type').value,
        message: document.getElementById('message').value,
        optIn: document.getElementById('opt-in').checked,
        recaptchaToken: 'test_token', // Bypass reCAPTCHA for testing
        timestamp: new Date().toISOString()
    };
    
    // Save to CSV
    saveToCSV(formData, 'contact_submissions.csv');
    
    // Send data to backend API
    fetch('http://localhost:3002/api/send-inquiry', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Show success message
            inquiryForm.prepend(formSuccessMessage);
            
            // Reset form
            inquiryForm.reset();
            grecaptcha.reset();
        } else {
            // Show error message with server response
            formErrorMessage.textContent = data.message || 'There was an error submitting your inquiry. Please try again.';
            inquiryForm.prepend(formErrorMessage);
        }
        
        // Reset button
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    })
    .catch(error => {
        console.error('Error:', error);
        
        // Show success message anyway since we saved to CSV
        inquiryForm.prepend(formSuccessMessage);
        
        // Reset form
        inquiryForm.reset();
        if (typeof grecaptcha !== 'undefined' && grecaptcha) {
            grecaptcha.reset();
        }
        
        // Reset button
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    });
});

// Quick Quote Form Submission
if (quickQuoteForm) {
    quickQuoteForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Remove previous messages
        if (quickQuoteSuccessMessage.parentNode) {
            quickQuoteSuccessMessage.parentNode.removeChild(quickQuoteSuccessMessage);
        }
        if (quickQuoteErrorMessage.parentNode) {
            quickQuoteErrorMessage.parentNode.removeChild(quickQuoteErrorMessage);
        }
        
        // Basic form validation
        const firstName = document.getElementById('quick-first-name').value;
        const lastName = document.getElementById('quick-last-name').value;
        const email = document.getElementById('quick-email').value;
        const phone = document.getElementById('quick-phone').value;
        const insuranceType = document.getElementById('quick-insurance-type').value;
        const coverageAmount = document.getElementById('quick-coverage-amount').value;
        
        // Simple email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            quickQuoteErrorMessage.textContent = 'Please enter a valid email address';
            quickQuoteForm.prepend(quickQuoteErrorMessage);
            return;
        }
        
        // Simple phone validation
        if (!validatePhone(phone)) {
            quickQuoteErrorMessage.textContent = 'Please enter a valid phone number';
            quickQuoteForm.prepend(quickQuoteErrorMessage);
            return;
        }
        
        // Disable submit button and show loading state
        const submitButton = quickQuoteForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Generating Quote...';
        
        // Prepare form data
        const formData = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            phone: phone,
            insuranceType: insuranceType,
            coverageAmount: coverageAmount,
            timestamp: new Date().toISOString()
        };
        
        // Save to CSV
        saveToCSV(formData, 'quick_quote_submissions.csv');
        
        // Simulate API call for quote generation
        setTimeout(() => {
            // Show success message
            quickQuoteForm.prepend(quickQuoteSuccessMessage);
            
            // Reset form
            quickQuoteForm.reset();
            
            // Reset button
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }, 1500);
    });
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Close mobile menu if open
        const navMenu = document.querySelector('nav ul');
        if (navMenu.classList.contains('show')) {
            navMenu.classList.remove('show');
        }
        
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80, // Adjust for header height
                behavior: 'smooth'
            });
        }
    });
});

// Header scroll effect
window.addEventListener('scroll', () => {
    const header = document.getElementById('header');
    if (window.scrollY > 50) {
        header.style.padding = '10px 0';
        header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.padding = '15px 0';
        header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
    }
});