# SEATrax Documentation Hub

This folder contains all project documentation, development guides, and technical references for the SEATrax platform.

## 📋 Documentation Structure

### Core Documentation
- [**copilot-instructions.md**](copilot-instructions.md) - Complete development guide and coding instructions
- [**business-process-documentation.md**](business-process-documentation.md) - Business logic and workflows
- [**implementation-checklist.md**](implementation-checklist.md) - Development tasks and progress tracking

### Development Phases & Status
- [**docs/DEVELOPMENT_PHASES.md**](docs/DEVELOPMENT_PHASES.md) - Project roadmap and phases
- [**docs/PROJECT_STATUS_NOVEMBER_2025.md**](docs/PROJECT_STATUS_NOVEMBER_2025.md) - Current project status
- [**docs/CURRENT_STATUS_AND_NEXT_PHASE.md**](docs/CURRENT_STATUS_AND_NEXT_PHASE.md) - Progress updates
- [**docs/PHASE1_COMPLETE.md**](docs/PHASE1_COMPLETE.md) - Phase 1 completion summary
- [**docs/MVP_DEVELOPMENT.md**](docs/MVP_DEVELOPMENT.md) - MVP requirements and progress

### Setup & Deployment
- [**docs/QUICKSTART.md**](docs/QUICKSTART.md) - Quick setup guide
- [**docs/DEPLOYMENT_GUIDE.md**](docs/DEPLOYMENT_GUIDE.md) - Production deployment instructions
- [**docs/BUILD_SYSTEM_FIX.md**](docs/BUILD_SYSTEM_FIX.md) - Build system configuration
- [**docs/HARDHAT_UPDATE.md**](docs/HARDHAT_UPDATE.md) - Hardhat setup and configuration

### Technical References
- [**docs/QUICK_FIX.md**](docs/QUICK_FIX.md) - Common issues and solutions
- [**PROMPTS.md**](PROMPTS.md) - Development prompts and commands
- [**new-information.md**](new-information.md) - Latest updates and changes

## 🏗️ Project Structure Reference

```
SEATrax/
├── src/app/                    # Next.js App Router pages
│   ├── (auth)/login/          # Role selection
│   ├── onboarding/            # User registration flows
│   ├── exporter/              # Exporter dashboard & features
│   ├── investor/              # Investor dashboard & features
│   ├── admin/                 # Admin management interface
│   └── pay/[invoiceId]/       # Payment interface for importers
├── contracts/                 # Smart contracts
├── src/components/            # React components
├── src/hooks/                 # Custom React hooks
├── src/lib/                   # Utility libraries
└── docs/                      # Additional documentation
```

## 🚀 Quick Links

- **Getting Started**: [QUICKSTART.md](docs/QUICKSTART.md)
- **Development Guide**: [copilot-instructions.md](copilot-instructions.md)
- **Business Logic**: [business-process-documentation.md](business-process-documentation.md)
- **Current Status**: [PROJECT_STATUS_NOVEMBER_2025.md](docs/PROJECT_STATUS_NOVEMBER_2025.md)
- **Deployment**: [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)

## 📊 Platform Overview

SEATrax is a blockchain-based shipping invoice funding platform that:
- Tokenizes shipping invoices as NFTs
- Enables early funding access for exporters (70% threshold)
- Provides investment opportunities for investors (4% returns)
- Uses Lisk Sepolia blockchain with Panna SDK integration
- Built with Next.js 15, TypeScript, and Supabase