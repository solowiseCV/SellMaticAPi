# SellMatic - WhatsApp Bot API

Sellmatic is an API for auto WhatsApp replies for business owners using AI (OpenAI GPT-4o-mini).

## Features

- **Multi-tenant** - Support multiple businesses with different WhatsApp accounts
- **AI-powered replies** - Uses OpenAI GPT-4o-mini for intelligent responses
- **Persistent conversations** - All conversations and messages stored in PostgreSQL
- **WhatsApp Integration** - Directly integrated with WhatsApp Business API
- **Database-backed context** - Business information (products, personality, delivery info) pulled from database

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 17+
- Docker & Docker Compose (for containerized deployment)
- OpenAI API key
- WhatsApp Business Account with API access

### Local Development

1. **Clone and install**
```bash
npm install
```

2. **Configure environment**
Copy `.env.example` to `.env` and update with your values:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/sellmatic
OPENAI_API_KEY=your_key_here
WHATSAPP_TOKEN=your_token_here
PHONE_NUMBER_ID=your_phone_id
VERIFY_TOKEN=your_verify_token
```

3. **Setup database**
```bash
npx prisma migrate dev
npm run seed
```

4. **Start development server**
```bash
npm run dev
```

Server runs on `http://localhost:1999`

### Docker Deployment

1. **Build and run with Docker Compose**
```bash
docker-compose up --build
```

2. **Seed the database (optional)**
```bash
docker-compose exec app npm run seed
```

See [DOCKER.md](./DOCKER.md) for complete Docker documentation.

## Project Structure

```
src/
  ├── index.ts              # Express server & webhook handler
  ├── db/
  │   ├── pool.ts          # PostgreSQL connection pool
  │   ├── seed.ts          # Seed orchestrator
  │   └── seeders/
  │       ├── business.ts  # Business data seeding
  │       ├── conversation.ts
  │       └── message.ts
  ├── configs/
  ├── controllers/
  ├── repositories/
  ├── routes/
  └── service/
prisma/
  └── schema.prisma        # Database schema
```

## API Endpoints

### Webhook Setup
```
GET /webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=CHALLENGE
```

### Incoming Messages
```
POST /webhook
Content-Type: application/json

{
  "entry": [{
    "changes": [{
      "value": {
        "metadata": { "phone_number_id": "YOUR_PHONE_ID" },
        "messages": [{
          "from": "+234...",
          "type": "text",
          "text": { "body": "User message" }
        }]
      }
    }]
  }]
}
```

## Database

### Models
- **Business** - Business accounts with WhatsApp integration
- **Conversation** - Customer conversations per business
- **Message** - Individual messages in conversations

### Running Migrations
```bash
npx prisma migrate dev
```

### Seeding Data
```bash
npm run seed
```

## Scripts

```bash
npm run dev      # Development with auto-reload
npm run build    # Compile TypeScript
npm start        # Run compiled app
npm run seed     # Seed test data
```

## Technologies

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL + Prisma ORM
- **AI**: OpenAI GPT-4o-mini
- **Messaging**: WhatsApp Graph API
- **Containerization**: Docker & Docker Compose

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| OPENAI_API_KEY | OpenAI API key |
| WHATSAPP_TOKEN | WhatsApp Business Account token |
| PHONE_NUMBER_ID | WhatsApp phone number ID |
| VERIFY_TOKEN | Webhook verification token |
| PORT | Server port (default: 1999) |
| NODE_ENV | Environment (development/production) |

## Testing

Test webhook locally using curl:
```bash
curl -X POST http://localhost:1999/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "metadata": { "phone_number_id": "1116743694855563" },
          "messages": [{
            "from": "2348145559189",
            "type": "text",
            "text": { "body": "Hi what do you sell?" }
          }]
        }
      }]
    }]
  }'
```

## Author

Uche Solomon ALI

## License

ISC
