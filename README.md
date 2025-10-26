# ACME Insurance Website

![ACME Insurance Website Screenshot](public/Screenshot%202025-10-26%20at%2012.57.59%20PM.png)

A single-page insurance website built according to the product requirements document. This website allows users to learn about insurance services, submit inquiries, and enables the client to receive leads via email.

**Live Demo:** [https://acme-insurance-website-6pblv7o38-venkas-projects.vercel.app](https://acme-insurance-website-6pblv7o38-venkas-projects.vercel.app)

## Features

- Modern, responsive single-page design
- Information about insurance services offered
- Contact/inquiry form with validation
- Email submission system using EmailJS
- reCAPTCHA integration for spam protection
- Mobile-friendly layout

## Project Structure

```
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # CSS styles
├── js/
│   └── main.js         # JavaScript functionality
├── img/
│   └── hero-bg.svg     # Hero section background
├── server.js           # Express server for handling form submissions
├── package.json        # Node.js dependencies and scripts
├── .env                # Environment variables (not committed to git)
├── .env.example        # Example environment variables template
├── .gitignore          # Git ignore file
└── README.md           # This file
```

## Setup Instructions

### 1. Configure Backend

This website uses a Node.js/Express backend to handle form submissions. To set it up:

1. Install dependencies:
   ```
   npm install
   ```

2. Configure environment variables:
   - Rename `.env.example` to `.env` (or create a new `.env` file)
   - Update the reCAPTCHA secret key and other settings in the `.env` file

3. Start the server:
   ```
   npm start
   ```

### 2. Deployment to Vercel

This project is configured for easy deployment to Vercel. Follow these steps to deploy:

#### Option 1: Using the Vercel CLI

1. Install the Vercel CLI globally (if not already installed):
   ```
   npm install -g vercel
   ```

2. Login to Vercel:
   ```
   vercel login
   ```

3. Deploy to production:
   ```
   npm run deploy
   ```
   or
   ```
   vercel --prod
   ```

#### Option 2: Using the Deployment Script

We've included a deployment script to simplify the process:

1. Run the deployment script:
   ```
   ./deploy-to-vercel.sh
   ```

#### Option 3: Using the Vercel Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import your project in the Vercel dashboard: https://vercel.com/import
3. Connect to your Git repository
4. Configure your project settings
5. Deploy

#### Environment Variables

Make sure to set up the following environment variables in your Vercel project:

- `RECAPTCHA_SECRET_KEY`: Your reCAPTCHA secret key
- Any other environment variables from your `.env` file

You can set these in the Vercel dashboard under Project Settings > Environment Variables.
   
   For development with auto-reload:
   ```
   npm run dev
   ```

### 2. Configure reCAPTCHA

To set up Google reCAPTCHA:

1. Register your site at [Google reCAPTCHA](https://www.google.com/recaptcha/)
2. Choose reCAPTCHA v2 ("I'm not a robot" Checkbox)
3. Update the following in `index.html`:
   - Replace `'your-recaptcha-site-key'` with your site key in the div with class `g-recaptcha`

### 3. Deployment

This website can be deployed on any web hosting service. For a simple deployment, you can use:

- [Vercel](https://vercel.com/)
- [Netlify](https://www.netlify.com/)
- [GitHub Pages](https://pages.github.com/)

## Customization

### Changing Colors

To change the color scheme, edit the CSS variables at the top of `css/styles.css`:

```css
:root {
    --primary-color: #0056b3;
    --secondary-color: #00a0e9;
    --accent-color: #ffc107;
    /* other colors */
}
```

### Adding More Services

To add more insurance services, duplicate the service card structure in `index.html` and update the content:

```html
<div class="service-card">
    <div class="service-icon">
        <i class="fas fa-icon-name"></i>
    </div>
    <h3>Service Name</h3>
    <p>Service description</p>
</div>
```

## Browser Compatibility

This website is compatible with:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Android Chrome)

## Future Enhancements

Potential future enhancements as mentioned in the PRD:
- Policy comparison and quote generation
- Online payments
- User account management

## License

This project is licensed under the MIT License.