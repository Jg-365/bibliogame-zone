# Deployment Guide

This guide covers various deployment options for BiblioGame Zone.

## 🚀 Deployment Options

### Vercel (Recommended)

Vercel provides the easiest deployment experience for React applications with
automatic builds and deployments.

#### Prerequisites

- Vercel account
- GitHub repository connected

#### Steps

1. **Connect Repository**

   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login to Vercel
   vercel login

   # Deploy
   vercel
   ```

2. **Environment Variables** Add these variables in Vercel dashboard:

   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Build Configuration** Vercel auto-detects Vite projects. No additional
   configuration needed.

### Netlify

Great option for JAMstack deployments with excellent form handling.

#### Steps

1. **Build Settings**

   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 18

2. **Environment Variables**

   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **\_redirects file**
   ```
   /*    /index.html   200
   ```

### AWS S3 + CloudFront

Enterprise-level hosting with global CDN distribution.

#### Prerequisites

- AWS account
- AWS CLI configured

#### Steps

1. **Build Application**

   ```bash
   npm run build
   ```

2. **Create S3 Bucket**

   ```bash
   aws s3 mb s3://your-bucket-name
   aws s3 website s3://your-bucket-name --index-document index.html
   ```

3. **Upload Files**

   ```bash
   aws s3 sync dist/ s3://your-bucket-name
   ```

4. **CloudFront Distribution**
   - Origin: S3 bucket
   - Default root object: `index.html`
   - Error pages: 404 → `/index.html` (for SPA routing)

### Docker

Containerized deployment for any environment.

#### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

#### Build and Run

```bash
# Build image
docker build -t bibliogame-zone .

# Run container
docker run -p 8080:80 bibliogame-zone
```

## 🔧 Environment Configuration

### Production Environment Variables

```bash
# Required
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key

# Optional
VITE_APP_TITLE="BiblioGame Zone"
VITE_APP_DESCRIPTION="Gamified Reading Management Platform"
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_SOCIAL_FEATURES=true
VITE_ENABLE_ACHIEVEMENTS=true
```

### Build Optimization

```bash
# Build with type checking
npm run type-check && npm run build

# Build with lint checking
npm run lint && npm run build

# Build with all checks
npm run lint && npm run test && npm run type-check && npm run build
```

## 📊 Performance Monitoring

### Web Vitals

Monitor Core Web Vitals in production:

```typescript
// src/utils/vitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";

function sendToAnalytics(metric: any) {
  // Send to your analytics service
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### Bundle Analysis

Analyze bundle size after deployment:

```bash
# Generate bundle report
npm run build
npx vite-bundle-analyzer dist

# Check bundle size
npm run analyze
```

## 🔒 Security Considerations

### Environment Variables

- Never commit sensitive keys to version control
- Use different keys for development/staging/production
- Rotate API keys regularly

### Content Security Policy

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:;"
/>
```

### HTTPS

- Always deploy with HTTPS in production
- Use HSTS headers
- Implement proper CORS policies

## 🔍 Monitoring & Logging

### Error Tracking

```typescript
// src/utils/errorTracking.ts
export const logError = (error: Error, context?: any) => {
  // Send to error tracking service (Sentry, LogRocket, etc.)
  console.error("Application Error:", error, context);
};
```

### Analytics

```typescript
// src/utils/analytics.ts
export const trackEvent = (event: string, properties?: any) => {
  // Send to analytics service (Google Analytics, Mixpanel, etc.)
  console.log("Analytics Event:", event, properties);
};
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**

   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Environment Variables Not Loading**

   - Ensure variables start with `VITE_`
   - Check deployment platform variable configuration
   - Verify `.env` file is not committed to git

3. **Routing Issues in Production**

   - Configure server to serve `index.html` for all routes
   - Check `_redirects` or nginx configuration

4. **Supabase Connection Issues**
   - Verify Supabase URL and keys
   - Check CORS settings in Supabase dashboard
   - Ensure RLS policies are correctly configured

### Debug Mode

Enable debug mode for troubleshooting:

```bash
# Development
VITE_DEBUG=true npm run dev

# Production build with source maps
npm run build -- --sourcemap
```

## 📈 Scaling Considerations

### CDN Configuration

- Enable gzip compression
- Set appropriate cache headers
- Use CDN for static assets

### Database Optimization

- Implement connection pooling
- Use read replicas for queries
- Optimize database queries

### Monitoring

- Set up uptime monitoring
- Monitor database performance
- Track user analytics

---

For more deployment options and advanced configurations, consult the specific
platform documentation.
