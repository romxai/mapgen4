Below is a **long, detailed, and comprehensive** Technical Product Requirements Document (PRD) that merges the **original architecture** (verbatim in Section 1) with the **updated requirements for Oracle Cloud Always Free Tier, Nginx, Docker, Oracle Queue, minimal concurrency, etc.** (expanded in Section 2). 

It follows the **exact table of contents** you specified. This PRD is designed so that any development team can read it and fully implement the backend architecture for the distributed, world-building game.

---

# **1. Architecture & Implementation Guide**

> Below is a comprehensive architectural guide and reference for designing a scalable, fault-tolerant, low-latency distributed computing system for a world-building game with a blind auction-driven virtual economy. The structure borrows heavily from the patterns and conventions used in the ingestion-worker monorepo architecture (SQS-based job handling, worker/scheduler/provider pattern, shared logging/database/AI-client packages, etc.) and applies them to a distributed gaming scenario.
>
> ---
>
> ### **Distributed World-Building Game: Architecture & Implementation Guide**
>
> #### **1. Overview**
>
> This document describes a **distributed computing architecture** for a virtual world-building game in which:
>
> - **Game Board**:
>   - Thousands of grid squares representing land.
>   - Each square has dynamic resource properties (mines, farms, oil fields).
> - **Auctions**:
>   - Blind and open auctions distribute land among players.
>   - Auctions run daily or on-demand, with no max bid.
> - **Resources & Economy**:
>   - Resources deplete, regenerate, or yield over time.
>   - Players earn income and trade assets on a marketplace.
> - **Fault Tolerance & Scalability**:
>   - Designed for concurrency, scalability, and high availability.
>   - Employs distributed computing techniques (sharding, replication, load balancing, caching).
> - **Real-Time Interaction**:
>   - Players interact in real-time via WebSockets or similar event-driven technologies.
>
> By the end of this guide, you’ll have a high-level understanding of how to build, deploy, and manage the system using AWS (SQS, ECS or EKS, RDS or MongoDB, etc.), shared logger utilities, and a microservice architecture that mirrors the ingestion-worker pattern.
>
> ---
>
> #### **2. Core Services**
>
> Similar to the ingestion-worker’s pattern of **scheduler**, **worker**, and **providers**, our game will have multiple specialized services. Each service is independently deployable, scalable, and communicates via AWS SQS and/or HTTP APIs.
>
> ##### **2.1 Auction Scheduler Service**
>
> - **Responsibilities**:
>   1. **Daily Auction Scheduling**: Checks which auctions must be triggered daily (or at specified intervals).
>   2. **Auction Registration**: Creates auction “jobs” and sends them to the auction worker via SQS.
>   3. **Dynamic Expansion**: Schedules tasks to unlock new regions if demand surpasses certain thresholds.
>   4. **Cron or Event-Driven**: Uses a cron-like service or AWS EventBridge to trigger scheduling logic periodically.
>
> - **Key Methods**:
>   - `checkAndQueueAuctions()`: Looks up upcoming auctions from the database (where each land/region has a nextAuction date) and queues them.
>   - `checkExpansionNeeds()`: Evaluates usage metrics (e.g., land occupancy rates) to decide if new land regions need to be unlocked.
>   - `queueAuction(auctionData)`: Pushes auction-related tasks to the SQS queue.
>
> - **Scalability**:
>   - This service is relatively light on computational load but must handle scheduling logic reliably.
>   - Can be scaled horizontally or run as a single instance with failover if required.
>
> ##### **2.2 Auction Worker Service**
>
> - **Responsibilities**:
>   1. **Polling SQS for Auction Jobs**: Fetches auction jobs posted by the scheduler or on-demand triggers.
>   2. **Auction Orchestration**: Runs the logic for open or blind auctions.
>   3. **Settlement & Distribution**: Allocates grid squares and updates player ownership records upon auction completion.
>   4. **Error Handling & Retries**: If an auction job fails partially, it retries automatically or logs the error for manual review.
>
> - **Key Methods**:
>   - `registerAuctionType(provider)`: Similar to the ingestion-worker’s “registerProvider,” this method registers different types of auction providers (e.g., `openAuction.provider.ts`, `blindAuction.provider.ts`).
>   - `start()`: Begins polling the SQS queue for new auction tasks.
>   - `stop()`: Gracefully shuts down the worker.
>
> - **Auction Providers**:
>   - **BlindAuctionProvider**:
>     - Hides bids until the auction is settled.
>     - Resolves winners and sets final purchase prices.
>   - **OpenAuctionProvider**:
>     - Real-time or iterative bidding.
>     - Possibly uses WebSockets for dynamic updates (though the main finalization might still be done in the worker for consistency).
>
> ##### **2.3 Resource Lifecycle Service**
>
> - **Responsibilities**:
>   1. **Resource Generation & Depletion**: Periodically updates the state of farms, mines, oil fields, etc.
>   2. **Merging & Upgrades**: Processes requests from players to merge adjacent squares or invest in technology improvements.
>   3. **Dynamic Resource Balancing**: Algorithmically decides how new resources appear in the game world.
>
> - **Key Methods**:
>   - `scheduleResourceUpdates()`: Similar to a scheduling mechanism, it checks which resources are due for an update (e.g., once a day or once an hour).
>   - `processResourceUpdate(job)`: Consumes the SQS queue messages for resource updates.
>   - `applyUpgrade(landSquareId, upgradeDetails)`: Applies a technology or structural upgrade.
>
> ##### **2.4 Marketplace Service**
>
> - **Responsibilities**:
>   1. **Trading System**: Allows players to trade land, resources, or other assets.
>   2. **Fixed & Dynamic Pricing**: Certain stable prices for quick liquidity, plus a free-market listing for flexible trades.
>   3. **Order Matching**: Matches buy and sell orders in near-real-time.
>
> - **Key Methods**:
>   - `createListing(listingData)`: Creates a new item listing on the marketplace.
>   - `matchOrders()`: A scheduled or event-driven function that attempts to match buy/sell orders.
>   - `finalizeTrade()`: Transfers ownership, updates player balances, logs the transaction.
>
> ##### **2.5 Realtime Gateway Service (WebSockets)**
>
> - **Responsibilities**:
>   1. **Real-Time Player Interactions**: Maintains open connections to players, broadcasting updates on auctions, resource changes, trades, etc.
>   2. **Subscriptions**: Players can subscribe to events about specific land squares, auctions, or marketplaces.
>   3. **Relays & Notifications**: Forwards relevant updates from the worker services to connected players.
>
> - **Key Methods**:
>   - `subscribe(playerId, topic)`: Subscribes the player’s socket to a certain game event or land square.
>   - `publish(topic, data)`: Broadcasts messages to all subscribers of the topic (e.g., “LandSquare123 updated”).
>   - `handleBidSubmission(bidData)`: Real-time submission of bids that are eventually processed by the Auction Worker (the actual finalization still occurs in the worker).
>
> ---
>
> #### **3. Data Models**
>
> Using a structure similar to Mongoose/TypeORM or any robust ORM, define the core data models. Below are sample interfaces; adapt them to your DB (SQL, NoSQL, or a combination).
>
> ##### **3.1 LandSquare**
>
> ```typescript
> interface LandSquare {
>   _id: string | ObjectId;  
>   location: {
>     x: number;  
>     y: number;  
>   };
>   owner?: string | ObjectId; 
>   resources: {
>     farm?: {
>       level: number;        
>       nextHarvest?: Date;   
>     };
>     mine?: {
>       remainingOre: number; 
>       depletionRate: number;
>     };
>     oilField?: {
>       capacity: number;     
>       extractionRate: number;
>       technologyLevel: number;
>     };
>     // Additional resource types
>   };
>   // Merged squares reference or adjacency info
>   merges?: string[] | ObjectId[];
>   // Auction config
>   nextAuction?: Date; 
>   isLocked?: boolean;      
> }
> ```
>
> ##### **3.2 Auction**
>
> ```typescript
> interface Auction {
>   _id: string | ObjectId;
>   auctionType: 'open' | 'blind';
>   landSquares: (string | ObjectId)[];  
>   startTime: Date;
>   endTime: Date;
>   status: 'scheduled' | 'in-progress' | 'completed' | 'failed';
>   bids: Bid[];
>   winner?: string | ObjectId; 
>   finalPrice?: number;
> }
>
> interface Bid {
>   playerId: string | ObjectId;
>   amount: number;
>   timestamp: Date;
>   // For blind auctions, might store encrypted or hidden amounts
> }
> ```
>
> ##### **3.3 Player**
>
> ```typescript
> interface Player {
>   _id: string | ObjectId;
>   username: string;
>   balance: number;   
>   ownedLand: (string | ObjectId)[];
>   // Inventory or resource holdings
>   resources: {
>     gold: number;
>     wheat: number;
>     oil: number;
>     // ...
>   };
>   lastActive: Date;
> }
> ```
>
> ##### **3.4 Marketplace Listing**
>
> ```typescript
> interface MarketplaceListing {
>   _id: string | ObjectId;
>   itemId: string | ObjectId;
>   itemType: 'land' | 'resource';   
>   sellerId: string | ObjectId;
>   price: number;
>   status: 'active' | 'sold' | 'cancelled';
>   createdAt: Date;
> }
> ```
>
> ##### **3.5 ResourceUpdateRun (similar to IngestionRun)**
>
> Tracks periodic resource updates:
>
> ```typescript
> interface ResourceUpdateRun {
>   _id: ObjectId;
>   runId: string; // e.g., UUID
>   startTime: Date;
>   endTime?: Date;
>   status: 'running' | 'completed' | 'failed';
>   updatedItems: number;
>   failedItems: number;
>   error?: string;
> }
> ```
>
> ---
>
> #### **4. Workflow & Execution**
>
> Below is a bird’s-eye view of how the game’s daily life cycle runs, focusing on distributed techniques for high throughput and reliability.
>
> 1. **Auction Scheduling**  
>    - The **Auction Scheduler Service** runs periodically (using AWS EventBridge or a cron job) to check for land squares whose `nextAuction` date is due.  
>    - For each eligible land square, it creates an **Auction** record and pushes an `auctionJob` message to the **Auction Worker SQS**.
>
> 2. **Auction Processing**  
>    - The **Auction Worker Service** continuously polls the queue.  
>    - Upon receiving `auctionJob`, it determines if it’s an open or blind auction.  
>    - Fetches bids from the database (including real-time bids funneled through the WebSocket layer).  
>    - Conducts the auction logic (in open auctions, it can gather final bids; in blind auctions, it can unseal bids).  
>    - Finalizes the winner, updates `owner` on each land square, updates player balances, etc.  
>    - Logs success/failure to the Auction collection and notifies the RealTime Gateway of results.
>
> 3. **Resource Updates**  
>    - The **Resource Lifecycle Service** checks if the next resource update time for each land square is due.  
>    - Sends `resourceUpdateJob` messages to an **SQS** queue for parallel processing.  
>    - Worker nodes handle each job, update the land squares’ resources, and record the results in a **ResourceUpdateRun**.  
>    - On completion, real-time events are sent for players subscribed to relevant squares.
>
> 4. **Real-Time Interactions**  
>    - The **Realtime Gateway Service** uses WebSockets (or a managed solution like AWS AppSync, or Socket.IO on ECS/EKS) to keep players updated in real time.  
>    - Auction status changes, resource expansions, or merges trigger messages to subscribed players.  
>    - Players can submit bids or merge requests through the gateway, which are packaged into SQS messages or direct REST calls to relevant microservices.
>
> 5. **Marketplace**  
>    - Players create or cancel listings via a Marketplace API.  
>    - The marketplace runs an order matching routine (either continuously or triggered by new orders) to settle trades.  
>    - SQS can be used if the matching logic is complex or must handle large volumes of orders simultaneously, ensuring eventual consistency.
>
> ---
>
> #### **5. Distributed Computing Techniques**
>
> ##### **5.1 Sharding & Partitioning**
>
> - **Land Squares**: Partition data by (x, y) coordinates or region.  
> - **Auctions**: Partition by the region or time.  
> - This ensures each database shard only handles a portion of the game world and associated auctions.
>
> ##### **5.2 Load Balancing**
>
> - **Microservices**: Use AWS Application Load Balancers or a service mesh (e.g., Istio on EKS) to distribute incoming requests.  
> - **Workers**: Multiple worker nodes poll the same SQS queue, automatically scaling horizontally.
>
> ##### **5.3 Data Replication**
>
> - **MongoDB Replica Sets** or **AWS RDS Multi-AZ**: For high availability and read scaling.  
> - Maintain read replicas for analytics or reporting.
>
> ##### **5.4 Caching & Edge Computing**
>
> - **Caching**: Use Redis or AWS ElastiCache for frequently accessed land metadata or real-time scoreboard data.  
> - **Edge**: If the game has a global user base, employ AWS CloudFront or similar for static assets, and possibly maintain partial game state in regional caches for faster reads.
>
> ##### **5.5 Fault Tolerance**
>
> - **SQS Retries**: Automatic re-drive policies if an auction job or resource update fails.  
> - **Circuit Breakers**: In microservices, to handle partial outages gracefully.  
> - **Graceful Shutdown**: On ECS/EKS, properly handle SIGTERM, stop polling SQS, and complete in-flight tasks before shutting down.
>
> ---
>
> #### **6. Logging & Observability**
>
> ##### **6.1 Centralized Logger**
>
> Use a shared logger package (like the `@srmd-internal/logger`) pattern:
>
> - **Features**:
>   - Log levels: info, warn, error, debug.
>   - Metadata: Attach request IDs, land square IDs, or region IDs to logs.
>   - Output: Console for dev, rotating files for production, or external logging service (e.g., Logtail, Datadog, CloudWatch).
>
> ```typescript
> import { logger } from '@myorg/logger';
>
> logger.info('Auction completed', { auctionId, winner, finalPrice });
> ```
>
> ##### **6.2 Monitoring**
>
> - **AWS CloudWatch**: Collect logs, create alarms on error rates, or high queue backlogs.  
> - **Metrics**:
>   - Auction Worker queue size.
>   - Resource update throughput.
>   - Marketplace trades per second.
> - **Tracing**: Use AWS X-Ray or OpenTelemetry for end-to-end request tracing.
>
> ##### **6.3 Health Checks**
>
> - Each service exposes a `/health` or `GET /healthcheck` endpoint for container orchestrators to verify liveness/readiness.
>
> ---
>
> #### **7. Deployment & Infrastructure**
>
> - **AWS SQS**: Primary message queue for asynchronous job dispatch (auctions, resource updates, expansions, merges).  
> - **AWS ECS or EKS**: Container orchestration for running microservices (Scheduler, Worker, Lifecycle, Marketplace, Realtime).  
> - **Databases**:
>   - **MongoDB**: If using Mongoose-like approach, replicate sets and shards for large-scale. 
>   - **PostgreSQL or AWS Aurora**: If you prefer relational schemas, especially for the Auction logic.  
> - **Infrastructure as Code**: Use Terraform or AWS CDK to define SQS queues, ECS tasks, database clusters, etc.
>
> ---
>
> #### **8. Example Monorepo Structure**
>
> Mimicking the ingestion-worker setup, you could organize your code as follows:
>
> ```
> distributed-world-game/
> ├── apps/
> │   ├── auction-scheduler/
> │   ├── auction-worker/
> │   ├── resource-lifecycle/
> │   ├── marketplace/
> │   └── realtime-gateway/
> ├── packages/
> │   ├── logger/             # Shared logging package
> │   ├── database/           # Shared database connection/models
> │   ├── auctions/           # Auction providers (blind, open)
> │   └── ...
> ├── package.json
> ├── turbo.json              # If using Turborepo for orchestrating builds
> └── ...
> ```
>
> - Each **app** is a distinct microservice with its own `Dockerfile`, `.env`, scripts, etc.
> - **Shared packages** handle cross-cutting concerns like logging, DB connections, or utility functions.
>
> ---
>
> #### **9. Implementation Steps**
>
> 1. **Initialize Monorepo**  
>    - Use Turborepo, Yarn Workspaces, or Nx to manage multiple apps/packages.
>
> 2. **Set Up Database & Models**  
>    - Decide on MongoDB vs. PostgreSQL vs. a hybrid approach.
>    - Create schemas for `LandSquare`, `Auction`, `Player`, `MarketplaceListing`, etc.
>
> 3. **Implement Shared Logger**  
>    - Provide a consistent logger interface in `/packages/logger`.
>
> 4. **Auction Scheduler**  
>    - Implement cron-like logic to find auctions that need scheduling.
>    - Send jobs to SQS, capturing relevant land squares and metadata.
>
> 5. **Auction Worker & Providers**  
>    - Create an SQS poller in the `auction-worker` app.
>    - Register `BlindAuctionProvider` and `OpenAuctionProvider`.  
>    - Execute the correct provider based on the job’s type.
>
> 6. **Resource Lifecycle**  
>    - Another SQS poller or CRON-based app that updates resource states, merges squares, applies upgrades, etc.
>
> 7. **Marketplace**  
>    - Build endpoints for listing, purchasing, and a background job to match orders.
>
> 8. **Realtime Gateway**  
>    - Use WebSockets or a managed solution to maintain client connections.
>    - Broadcast updates, handle quick event-driven interactions (like quick bids, merges).
>
> 9. **Configure AWS**  
>    - Create SQS queues for auctions, resource updates, merges, expansions, etc.
>    - Set ECS/EKS tasks for each service.  
>    - Configure autoscaling based on CPU usage, queue depth, or custom CloudWatch metrics.
>
> 10. **Testing & Observability**  
>    - Unit tests for each service.  
>    - Integration tests using local SQS or mocking frameworks.  
>    - Observability with CloudWatch, distributed tracing, logs in a centralized aggregator.
>
> 11. **Security & Secrets**  
>    - Use AWS Parameter Store or Secrets Manager for credentials.  
>    - Lock down IAM roles so each service only has the necessary permissions.
>
> ---
>
> #### **10. Conclusion**
>
> By following this architectural pattern:
>
> - **Scalability**: Each microservice can be scaled horizontally, with SQS decoupling tasks for auctions, resource updates, and expansions.
> - **Fault Tolerance**: Retry logic, replication, and separate worker services ensure partial failures do not collapse the entire system.
> - **Low Latency**: Real-time communication is managed by a dedicated gateway service, while heavy-lift tasks are offloaded to asynchronous workers.
> - **Maintainability**: Clear separation of concerns, monorepo with shared packages, and well-defined data schemas.
> - **Extendibility**: Well-defined interfaces for adding new resource types or new game features (e.g., new auction types) is as straightforward as creating a new provider or microservice and registering it with the existing system.
>
> This approach, heavily inspired by the ingestion-worker pattern (scheduler, worker, providers, shared logger/database, etc.), provides a robust foundation for a large-scale, globally distributed world-building game with real-time auctions and a dynamic economy.
>
> > **Next Steps**  
> >  - Draft a proof-of-concept for a single region with a single auction type, then scale.  
> >  - Incorporate load testing to ensure the system meets performance targets.  
> >  - Iterate on resource modeling and merge logic to match your game’s design goals.
>
> ---
>
> **Happy Building!** Use this guide as your reference for implementing a fault-tolerant, scalable, and performant distributed game backend.

---

# **2. Additional PRD Components**

Below are the **extended** PRD components **with updated requirements** reflecting our **Oracle Cloud Always Free Tier** setup, **MongoDB Atlas**, **OCI Queue** usage, **Nginx** load balancing/SSL, and so on.

## **2.1 Project Goals & Scope**

### **Goals**

1. Implement a **scalable** and **fault-tolerant** backend for a distributed, world-building game on **Oracle Cloud** Always Free Tier.  
2. Use **microservices** (at least: Auction Worker, Resource Lifecycle, Real-Time Gateway, and a combined Game API) to maintain modular architecture while still fitting within resource constraints.  
3. Provide **daily auctions** (blind/open) for distributing land, with no max bid.  
4. Maintain a **real-time** channel for updates (WebSockets).  
5. Employ **Docker** for containerization and **Nginx** for SSL termination + load balancing.  
6. Keep data in **MongoDB Atlas** (Free Tier).  
7. Use **Oracle Cloud Infrastructure Queue** for distributed tasks.

### **Scope**

- **Core Microservices**:  
  - **Game API** (aggregator for REST endpoints)  
  - **Auction & Lifecycle Worker** (background jobs)  
  - **Optional Scheduler** (if separated)  
  - **Realtime Gateway** (WebSockets)  
- **Infrastructure**:  
  - **2 Arm64 Oracle Cloud VMs** (4 vCPUs, ~24GB total RAM)  
  - **Docker** + **Nginx**  
  - **Let’s Encrypt** for SSL  
  - **OCI Queue** for messaging  
  - **MongoDB Atlas** for persistent storage  
- **Constrained** concurrency (~5 players), but built with potential for scaling.

---

## **2.2 Assumptions & Constraints**

1. **Oracle Cloud** provides **two free VMs** that run Docker, Nginx, etc.  
2. **MongoDB Atlas** has a free tier cluster suitable for the small scale.  
3. **OCI Queue** has a free or minimal usage tier for ~1 million requests.  
4. **SSL** is required for secure wss:// connections; we’ll use Let’s Encrypt.  
5. With only **5 test players** initially, large concurrency is not expected.  
6. We have a domain to point to our Oracle VMs or use an **Oracle LB**.  
7. Secrets can be stored in environment variables or Oracle Cloud Vault.

---

## **2.3 High-Level Tech Stack**

- **Node.js v18+** & **TypeScript** for microservices.  
- **Turborepo** for monorepo structure.  
- **Docker** for containerization.  
- **Nginx** for reverse proxy + SSL termination.  
- **OCI Queue** for background tasks.  
- **MongoDB Atlas (Free)** for data.  
- **Ubuntu or Debian** OS on each VM.

---

## **2.4 Game and Microservices Flow**

### **2.4.1 Detailed Flow Description**

1. **Scheduler Microservice:**
   - **Purpose:**  
     - Checks for time-based triggers (e.g., when a land square’s next auction date has arrived, when resources should update, or when a merge opportunity becomes available).
     - Pushes corresponding messages (e.g., “start auction for square XYZ”, “update resources for region ABC”) to the **OCI Queue**.
   - **When is it Used?**  
     - Periodically (using cron jobs or a similar scheduler) to initiate auctions and resource updates.
   - **Outcome:**  
     - Ensures all scheduled events are automatically enqueued for processing.

2. **OCI Queue:**
   - **Purpose:**  
     - Acts as a central task dispatcher.  
     - Holds messages for asynchronous tasks like starting an auction or updating resource values.
   - **Outcome:**  
     - Decouples scheduling from processing, enabling the system to handle tasks asynchronously.

3. **Auction & Resource Worker Microservice:**
   - **Purpose:**  
     - Continuously polls the OCI Queue for new tasks.
     - Processes tasks by:
       - Finalizing auctions (gathering bids, determining winners, updating ownership, deducting balances).
       - Updating resource levels (such as harvesting, mine depletion, or applying upgrades/merges).
     - Reads from and writes to **MongoDB Atlas**.
     - Sends event notifications to the **Realtime Gateway** after completing tasks.
   - **Outcome:**  
     - Actual heavy lifting of the game logic is handled here, ensuring consistency in game state.

4. **MongoDB Atlas:**
   - **Purpose:**  
     - Stores all game data such as land squares, player profiles, auction details, and marketplace listings.
   - **Outcome:**  
     - Acts as the single source of truth for all persistent game information.

5. **Game API Microservice:**
   - **Purpose:**  
     - Exposes RESTful endpoints for the frontend.
     - Allows players to:
       - View available land squares and their status (owned, unowned, or in auction).
       - Retrieve details of current auctions and marketplace listings.
       - Register, log in, and manage their profiles.
       - Initiate actions like placing a bid or merging squares.
     - May also enqueue tasks to OCI Queue when an action requires background processing.
   - **Outcome:**  
     - Serves as the primary interface between the game’s backend and its players’ clients.

6. **Realtime Gateway Microservice:**
   - **Purpose:**  
     - Maintains WebSocket connections with player clients.
     - Broadcasts real-time events, such as:
       - Auction updates (new bid, auction result).
       - Resource updates (e.g., resource yield changes, merge completions).
       - Marketplace updates (new listings, trade completions).
   - **Outcome:**  
     - Provides a near real-time user experience by pushing timely notifications to connected clients.

7. **Player Client (Frontend):**
   - **Purpose:**  
     - The user interface for the players.
     - Interacts with the **Game API** via REST calls for standard queries and transactions.
     - Connects to the **Realtime Gateway** via WebSocket for live updates.
   - **Outcome:**  
     - Ensures players have up-to-date information and can interact with the game seamlessly.

---

### **2.4.2How the Entire Game Flow is Covered**

- **Scheduled Events (via Scheduler):**
  - The scheduler microservice ensures that at predetermined times (e.g., daily at midnight), auctions are initiated and resource updates are scheduled. It acts as the “heartbeat” for time-sensitive game events.

- **Task Processing (via Worker):**
  - Once scheduled tasks are queued, the Auction & Resource Worker takes over. It processes each task, updates the database accordingly, and ensures that all auction or resource-related actions are performed reliably.

- **Data Persistence (via MongoDB Atlas):**
  - All updates to game state (auction results, resource levels, player ownership) are saved in MongoDB Atlas. This ensures that even if a microservice fails, the core game data remains intact.

- **Player Interactions (via Game API):**
  - Players can use the REST endpoints to query the game state, participate in auctions, or check their profiles. Actions initiated here (like bidding) may trigger messages into the queue for background processing.

- **Real-Time Feedback (via Realtime Gateway):**
  - To enhance the player experience, the realtime gateway pushes immediate notifications to the frontend when key events occur (such as an auction finishing or a resource update happening).

- **Secure & Scalable Communication:**
  - With Nginx in front (handling SSL termination and load balancing), all client-server communications are secure, and traffic is evenly distributed across services deployed in Docker containers on Oracle Cloud VMs.



## **2.4 Environment & Infrastructure Setup**

1. **Two Oracle VMs** (Arm64, total 4 vCPUs, ~24GB RAM).  
2. **MongoDB Atlas** free cluster for permanent data storage.  
3. **OCI Queue** for asynchronous job dispatch (like auctions, merges, resource updates).  
4. **DNS** pointing to your Oracle VM IP(s).  
5. **Nginx** installed on each VM for load balancing, SSL termination, and routing to local Docker containers.

---

## **2.5 Turborepo Monorepo Structure**

Below is a recommended structure to keep all microservices in one codebase:

```
distributed-world-game/
├── apps/
│   ├── game-api/
│   │   ├── Dockerfile
│   │   └── src/...
│   ├── worker/
│   │   ├── Dockerfile
│   │   └── src/...
│   ├── realtime-gateway/
│   │   ├── Dockerfile
│   │   └── src/...
│   └── scheduler/  # Optional separate microservice if needed
├── packages/
│   ├── logger/
│   ├── database/
│   ├── auctions/  # Auction logic & providers
│   └── ...
├── turbo.json
├── package.json
├── tsconfig.json
└── ...
```

- `apps/game-api`: Hosts the primary REST endpoints for players, land squares, auctions, marketplace.  
- `apps/worker`: Handles asynchronous tasks from the OCI Queue (auction finalization, resource updates, merges).  
- `apps/realtime-gateway`: WebSocket server for push notifications.  
- `apps/scheduler`: (Optional) If you want a dedicated microservice for daily or timed tasks, separate from the worker.  
- `packages/` for shared code: logger, DB models, etc.

---

## **2.6 Docker & Oracle Cloud Deployment Details**

### **2.6.1 Dockerfile & Docker Compose**

Each `apps/<service>/Dockerfile` might look like:

```dockerfile
FROM node:18-bullseye

WORKDIR /app
COPY package.json yarn.lock ./
COPY turbo.json .
COPY packages ./packages
COPY apps/worker ./apps/worker

RUN yarn install --frozen-lockfile
RUN yarn build  # e.g. yarn turbo run build --filter=worker

EXPOSE 4000
CMD ["node", "apps/worker/dist/index.js"]
```

Optionally, a `docker-compose.yml` can orchestrate multiple containers on each VM:

```yaml
version: "3.9"
services:
  game-api:
    build:
      context: .
      dockerfile: apps/game-api/Dockerfile
    ports:
      - "4000:4000"
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - OCI_QUEUE_ENDPOINT=${OCI_QUEUE_ENDPOINT}
    # ...
  worker:
    build:
      context: .
      dockerfile: apps/worker/Dockerfile
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - OCI_QUEUE_ENDPOINT=${OCI_QUEUE_ENDPOINT}
    # ...
  realtime-gateway:
    build:
      context: .
      dockerfile: apps/realtime-gateway/Dockerfile
    ports:
      - "4001:4001"
    # ...
  # Possibly more
```

### **2.6.2 Running on Oracle VMs**

- **SSH** into each VM, install Docker + Docker Compose.  
- **Pull** your images from a registry (Docker Hub or Oracle Container Registry).  
- **Run** `docker-compose up -d`.  

### **2.6.3 Nginx + SSL**

- Install **Nginx** + **Certbot** on each VM.  
- Generate SSL cert for your domain with Let’s Encrypt.  
- **Proxy** requests:
  - `https://<domain>/api/...` → `localhost:4000` (Game API)  
  - `wss://<domain>/ws` → `localhost:4001` (Realtime Gateway)  

**Example** Nginx config snippet:

```nginx
server {
  listen 443 ssl;
  server_name my-game.example.com;

  ssl_certificate /etc/letsencrypt/live/my-game.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/my-game.example.com/privkey.pem;

  location /api/ {
    proxy_pass http://localhost:4000/;
    # Additional proxy settings
  }

  location /ws/ {
    proxy_pass http://localhost:4001/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

---

## **2.7 Oracle Services & Configuration**

1. **Oracle Cloud Infrastructure Queue**  
   - Create a queue in OCI Console.  
   - Configure your environment with `OCI_QUEUE_ID`, credentials, or instance principal.  
   - Worker service polls the queue for tasks (auction finalization, merges, resource updates).

2. **Oracle Cloud Monitoring** (optional)  
   - Set up custom metrics or logs if you want to track CPU usage, memory, or container logs.  

3. **DNS**  
   - If you want a single domain, either you do round-robin DNS across the two VMs or use Oracle’s Load Balancer to direct traffic to the VMs.

4. **Secrets**  
   - Store MongoDB Atlas credentials, JWT secrets, etc. in environment variables on each VM or use Oracle Cloud Vault.

---

## **2.8 Developer Roadmap & Milestones**

1. **Phase 1: Monorepo Initialization**  
   - Create the Turborepo structure, add minimal code for each service.

2. **Phase 2: Core Features**  
   - **Game API** endpoints: land squares, auctions, marketplace, players.  
   - **Worker** logic: finalizing auctions, resource updates, merges.  
   - **Realtime Gateway**: WebSockets for real-time events.

3. **Phase 3: Oracle Infrastructure**  
   - Provision 2 VMs.  
   - Configure Docker & Nginx with SSL.  
   - Set up **OCI Queue**.  
   - Connect to **MongoDB Atlas**.

4. **Phase 4: CI/CD**  
   - Use GitHub Actions or GitLab CI to build Docker images, push them to a registry.  
   - Deploy via SSH or Oracle Cloud CLI scripts.

5. **Phase 5: Testing & Observability**  
   - Write integration tests using local Docker.  
   - Add logging, watch resource usage, handle concurrency.

6. **Phase 6: Beta Launch**  
   - Test with ~5 concurrent players.  
   - Adjust container memory/CPU usage if needed.

7. **Phase 7: Scale-Out**  
   - If usage grows, upgrade Oracle resources or add more VMs.  
   - Possibly split out the Scheduler microservice.

---

## **2.9 Code Snippets & Dependency Examples**

### **2.9.1 Turborepo `turbo.json` Example**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**"]
    },
    "lint": {},
    "test": {}
  }
}
```

### **2.9.2 Worker Poller (Pseudocode for OCI Queue)**

```typescript
import { pollOracleQueue, deleteMessage } from '@myorg/oracle-queue-utils';
import { logger } from '@myorg/logger';
import { finalizeAuction, updateResource } from './logic';

async function workerLoop() {
  while (true) {
    const messages = await pollOracleQueue({ queueId: process.env.OCI_QUEUE_ID });
    for (const msg of messages) {
      try {
        if (msg.type === 'AUCTION_FINALIZE') {
          await finalizeAuction(msg.payload);
        } else if (msg.type === 'RESOURCE_UPDATE') {
          await updateResource(msg.payload);
        }
        await deleteMessage(msg.id);
      } catch (error) {
        logger.error('Worker error', { error });
        // Possibly re-queue or handle differently
      }
    }
  }
}

workerLoop().catch(err => logger.error("Worker loop error", { err }));
```

### **2.9.3 Example Docker Compose File**

```yaml
version: "3.9"
services:
  game-api:
    build:
      context: .
      dockerfile: apps/game-api/Dockerfile
    container_name: game_api
    ports:
      - "4000:4000"
    environment:
      MONGODB_URI: ${MONGODB_URI}
      OCI_QUEUE_ID: ${OCI_QUEUE_ID}
      # ...
  worker:
    build:
      context: .
      dockerfile: apps/worker/Dockerfile
    container_name: worker
    environment:
      MONGODB_URI: ${MONGODB_URI}
      OCI_QUEUE_ID: ${OCI_QUEUE_ID}
      # ...
  realtime-gateway:
    build:
      context: .
      dockerfile: apps/realtime-gateway/Dockerfile
    container_name: realtime_gateway
    ports:
      - "4001:4001"
    environment:
      # ...
```

---

## **2.10 Testing & QA**

1. **Unit Tests**: Each microservice has a test suite (Jest, Mocha, etc.).  
2. **Integration Tests**:  
   - Launch local Docker Compose with a queue emulator or direct to Oracle Queue.  
   - Ensure auctions, merges, resource updates flow end-to-end.  
3. **Load/Stress Tests**: With **k6** or **Locust**. Even though concurrency is low, verifying no hidden bottlenecks is wise.  
4. **Security Tests**:  
   - Validate JWT logic in Game API.  
   - Lock down inbound ports.  
   - Use TLS for WebSockets.

---

## **2.11 Acceptance Criteria**

1. **Game API** is functional:  
   - `GET /api/land-squares` returns correct data from MongoDB Atlas.  
   - `POST /api/auctions/:auctionId/bid` queues a job in OCI.  
2. **Worker** finalizes auctions properly and updates owners in MongoDB.  
3. **Realtime Gateway** notifies subscribed players when auctions finalize or merges occur.  
4. **Nginx** terminates SSL with Let’s Encrypt, routes traffic to correct containers.  
5. Able to support ~5 concurrent players without performance issues.

---

## **2.12 Risks & Mitigations**

1. **Oracle Free Tier Resource Limits**  
   - **Mitigation**: Keep microservices’ footprints small, possibly combine some if needed.  
2. **MongoDB Atlas Free Tier**  
   - **Mitigation**: Low concurrency usage. Scale up if needed.  
3. **OCI Queue**  
   - **Mitigation**: If queue usage spikes, consider paid tiers or alternative solutions (like RabbitMQ on the VM).  
4. **SSL Renewal**  
   - **Mitigation**: Automate Certbot renewal. Ensure port 80 is open for ACME challenge.

---

## **2.13 Future Improvements**

1. **Auto-Scaling**: If concurrency grows, add more VMs or scale up the existing ones. Possibly use container orchestrators or Oracle OKE.  
2. **Advanced Resource Modeling**: Support more resource types, event-driven expansions, dynamic difficulty.  
3. **CQRS / Event Sourcing**: If you want robust auditing or replay, store game events, separate read/write models.  
4. **Multi-Region**: For a global player base, replicate data or regions to multiple Oracle data centers.  
5. **AI/ML**: Introduce advanced resource distribution or AI-driven NPCs.  
