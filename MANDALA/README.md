# How to Get the Site Running

### Preliminaries

Do the following steps in both the frontend and backend directories:
- Create a .env file with all necessary keys (see appendix for examples).
- Run `npm install` to install all necessary dependencies.
- Open a terminal in both the frontend and backend directories.

### Launching the site

- Run `npm run dev` in both the frontend and backend directories to start both the frontend page and the backend server.

### Visiting the site

- The site should be running at http://localhost:5173/ as hosting has not been configured.
- URLs can be configured in the .env files.


# Basic File Structure Breakdown


### frontend

The frontend directory contains the all the React-based pages and their underlying components.

* [src/](.\frontend\src)
  * [components/](.\frontend\src\components)
    > Contains underlying React Components that pages are built from.
    * [About.tsx](.\frontend\src\components\About.tsx)
      > About page component with company information.
    * [AdminDashboard.tsx](.\frontend\src\components\AdminDashboard.tsx)
      > Admin control panel for managing products and users.
    * [AuthHandler.tsx](.\frontend\src\components\AuthHandler.tsx)
      > Handles user authentication and session management.
    * [CartDropdown.tsx](.\frontend\src\components\CartDropdown.tsx)
      > Shopping cart interface showing selected items.
    * [ContactForm.tsx](.\frontend\src\components\ContactForm.tsx)
      > Contact form for customer inquiries.
    * [FAQ.tsx](.\frontend\src\components\FAQ.tsx)
      > Frequently asked questions section.
    * [Footer.tsx](.\frontend\src\components\Footer.tsx)
      > Website footer with navigation and contact info.
    * [Gallery.tsx](.\frontend\src\components\Gallery.tsx)
      > Product gallery display.
    * [GalleryPreview.tsx](.\frontend\src\components\GalleryPreview.tsx)
      > Preview component for gallery items on home page.
    * [Hero.tsx](.\frontend\src\components\Hero.tsx)
      > Main landing page banner.
    * [Navbar.tsx](.\frontend\src\components\Navbar.tsx)
      > Navigation bar with menu items.
    * [ProductCard.tsx](.\frontend\src\components\ProductCard.tsx)
      > Individual product display card.
    * [ProductManagement.tsx](.\frontend\src\components\ProductManagement.tsx)
      > Admin interface for managing products.
    * [ProductPage.tsx](.\frontend\src\components\ProductPage.tsx)
      > Detailed product view page.
    * [StripeCheckoutForm.tsx](.\frontend\src\components\StripeCheckoutForm.tsx)
      > Payment processing form using Stripe.
    * [Testimonials.tsx](.\frontend\src\components\Testimonials.tsx)
      > Customer testimonials display.
    * [UserManagement.tsx](.\frontend\src\components\UserManagement.tsx)
      > Admin interface for managing users.
      
  * [images/](.\frontend\src\images)
    > Contains product images.
    * [art1.jpeg](.\frontend\src\images\art1.jpeg)
    * [art2.jpeg](.\frontend\src\images\art2.jpeg)
    * [art3.jpeg](.\frontend\src\images\art3.jpeg)
    * [art4.jpeg](.\frontend\src\images\art4.jpeg)
    * [art4.jpg](.\frontend\src\images\art4.jpg)
    * [art5.jpeg](.\frontend\src\images\art5.jpeg)
    * [art6.jpeg](.\frontend\src\images\art6.jpeg)
  * [pages/](.\frontend\src\pages)
    > Contains page layouts.
    * [Account.tsx](.\frontend\src\pages\Account.tsx)
      > User account management page.
    * [Checkout.tsx](.\frontend\src\pages\Checkout.tsx)
      > Shopping cart checkout page.
    * [CheckoutCompletePage.tsx](.\frontend\src\pages\CheckoutCompletePage.tsx)
      > Order confirmation page.
    * [gallery.tsx](.\frontend\src\pages\gallery.tsx)
      > Product gallery page.
    * [home.tsx](.\frontend\src\pages\home.tsx)
      > Main landing page with hero section, about section, gallery preview, testimonials, and FAQ.
    * [productPages.tsx](.\frontend\src\pages\productPages.tsx)
      > Individual product pages.
  * [utils/](.\frontend\src\utils)
    > Contains guestStorage logic for non-logged in users.
    * [guestStorage.ts](.\frontend\src\utils\guestStorage.ts)
  * [App.tsx](.\frontend\src\App.tsx)
    > Main application component.
  * [index.css](.\frontend\src\index.css)
  * [main.tsx](.\frontend\src\main.tsx)
  * [routes.tsx](.\frontend\src\routes.tsx)
    > Application routing configuration.
* [.env](.\frontend\.env)
* [index.html](.\frontend\index.html)

## backend

The backend directory contains the server-side logic, database interactions, and API endpoints.

* [controllers/](.\backend\controllers)
  > Contains business logic for different features.
  * [email.js](.\backend\controllers\email.js)
    > Handles email notifications and communications.
  * [payment.js](.\backend\controllers\payment.js)
    > Processes payments through Stripe.
  * [products.js](.\backend\controllers\products.js)
    > Manages product data and operations in the database.
  * [tags.js](.\backend\controllers\tags.js)
    > Handles product categorization and tags in the database.
  * [users.js](.\backend\controllers\users.js)
    > Manages user accounts and authentication in the database.
* [middleware/](.\backend\middleware)
    > Contains request processing middleware.
  * [auth.js](.\backend\middleware\auth.js)
    > Authentication verification.
  * [authMiddleware.js](.\backend\middleware\authMiddleware.js)
  * [errorMiddleware.js](.\backend\middleware\errorMiddleware.js)
* [models/](.\backend\models)
  > Contains database models and schemas.
  * [products.js](.\backend\models\products.js)
    > Product data structure.
  * [tags.js](.\backend\models\tags.js)
    > Tag data structure.
  * [users.js](.\backend\models\users.js)
    > User data structure.
* [routes/](.\backend\routes)
  > Contains API endpoint definitions.
  * [email.js](.\backend\routes\email.js)
    > Email-related endpoints.
  * [payment.js](.\backend\routes\payment.js)
    > Payment processing endpoints.
  * [products.js](.\backend\routes\products.js)
    > Product management endpoints.
  * [tags.js](.\backend\routes\tags.js)
    > Tag management endpoints.
  * [users.js](.\backend\routes\users.js)
    > User management endpoints.
* [.env](.\backend\.env)
* [index.js](.\backend\index.js)
  > Main server entry point.


# Appendix

## Sample .env files
Email a.bettencourt002@umb.edu for additional information.

### Frontend

```
EMAIL_USER=
EMAIL_PASS=
RECIPIENT_EMAIL=
VITE_CLERK_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
```

### backend

```
# Backend Port number
PORT=3000

# URL of the Mongo DB
MONGODB_URL=<CONNECTION_STRING>MANDALA?retryWrites=true&w=majority&appName=Cluster0

# JWT
# JWT secret key
JWT_SECRET=thisisasamplesecret
# Number of minutes after which an access token expires
JWT_ACCESS_EXPIRATION_MINUTES=30
# Number of days after which a refresh token expires
JWT_REFRESH_EXPIRATION_DAYS=30
# Number of minutes after which a reset password token expires
JWT_RESET_PASSWORD_EXPIRATION_MINUTES=10
# Number of minutes after which a verify email token expires
JWT_VERIFY_EMAIL_EXPIRATION_MINUTES=10

# Firebase configuration
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=

EMAIL_USER=
EMAIL_PASS=
RECIPIENT_EMAIL=
VITE_CLERK_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=

FRONTEND_URL=http://localhost:5173
```
