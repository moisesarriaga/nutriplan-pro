<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# NutriPlan Pro

This repository contains the source code for the NutriPlan Pro application.

## Running Locally

**Prerequisites:** Node.js (v18 or later recommended)

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Set up Environment Variables:**
    Create a `.env.local` file in the root directory by copying the `.env.example` file. Populate it with your Supabase and Mercado Pago API keys.

3.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

## Database Migrations

The project uses SQL files in the `database/migrations` directory to manage the database schema. To apply the migrations, execute the SQL content of each file in your Supabase SQL Editor in the correct order.

1.  `001_create_subscriptions.sql`
2.  `002_create_payment_validation.sql`

## Payment and Subscription Flow

The application uses Mercado Pago for handling payments and a webhook to securely confirm subscriptions.

1.  **Payment Initiation:** When a user chooses a paid plan, a payment request is sent to Mercado Pago, and a corresponding record is created in the `payment_validations` table with a `pending` status.

2.  **Webhook Confirmation:** Mercado Pago sends a webhook notification to the `/api/mercadopago-webhook` endpoint upon a change in the payment status.

3.  **Subscription Activation:**
    - If the payment is confirmed (`approved`), the webhook handler updates the `payment_validations` record to `confirmed` and then creates or updates the user's record in the `subscriptions` table to grant them access to the paid plan.
    - If the payment fails, the `payment_validations` record is updated to `failed`, and no changes are made to the `subscriptions` table.

This two-step process ensures that subscriptions are only activated after a valid payment has been successfully processed.
