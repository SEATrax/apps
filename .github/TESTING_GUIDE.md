# SEATrax Testing Guide

Quick guide for testing multiple roles with Panna SDK Account Abstraction.

## 🚀 Quick Start

### Problem
Panna SDK uses Account Abstraction and generates new addresses, making it difficult to test different roles since the generated address differs from what's defined in `.env.local`.

### Solutions Implemented

We've implemented **3 complementary solutions** for maximum flexibility:

---

## 1️⃣ Console Logging (Easiest)

**How it works:**
- When you connect your Panna wallet, the generated address is automatically logged to the browser console

**Steps:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Connect wallet with Panna
4. Look for: `🔑 Panna Wallet Address: 0x...`
5. Copy the address
6. Add it to `.env.local`:
   ```env
   ADMIN_ADDRESSES=0xYourPannaAddress
   ```
7. Restart dev server: `npm run dev`

**Best for:** Quick admin testing without blockchain transactions

---

## 2️⃣ Admin Self-Service Panel (Recommended for Hackathon)

**How it works:**
- Admin page where you can grant roles to any address (including your own Panna address)

**Steps:**
1. Make sure you're admin (add your address to `ADMIN_ADDRESSES` in `.env.local`)
2. Connect wallet with Panna
3. Navigate to: **Admin Dashboard → Manage Roles** (or `/admin/roles`)
4. Click "Use My Address" button
5. Choose role to grant (Admin, Exporter, or Investor)
6. Confirm transaction
7. Navigate to the respective dashboard

**Features:**
- ✅ One-click address auto-fill
- ✅ Grant any role to any address
- ✅ Perfect for testing multiple users
- ✅ No need to edit .env or restart server

**Best for:** Testing actual blockchain role verification during demos

---

## 3️⃣ Development Mode (Fastest for Testing)

**How it works:**
- Floating dev mode toggle that bypasses blockchain verification
- Select any role instantly without transactions

**Steps:**
1. Look for the ⚙️ **Settings button** (bottom right corner)
2. Click to open Dev Mode panel
3. Toggle "Enable Dev Mode" ON
4. Select desired role:
   - 🟣 Admin - Full system access
   - 🔵 Exporter - Create & manage invoices
   - 🟢 Investor - Browse & invest in pools
5. Navigate to the respective dashboard

**Features:**
- ✅ Instant role switching
- ✅ No blockchain transactions needed
- ✅ No wallet connection required
- ✅ Persists across page refreshes
- ✅ Visual indicator (pulsing amber button when active)

**Best for:** Rapid UI/UX testing and development

---

## 🎯 Recommended Workflow for Hackathon Demo

### Phase 1: Development & Testing
Use **Dev Mode** for quick iteration and UI testing

### Phase 2: Demo Preparation
1. Use **Admin Self-Service Panel** to grant roles
2. Test the actual blockchain flow
3. Verify all transactions work correctly

### Phase 3: Live Demo
- Start with **Dev Mode OFF** to show real blockchain integration
- Keep **Dev Mode** ready as backup if blockchain is slow
- Use **Admin Panel** to quickly grant roles to judges' addresses if needed

---

## 🔍 Technical Details

### Dev Mode Implementation
- **Storage:** localStorage persistence
- **Context:** React Context API (`DevModeContext`)
- **Hook:** `useRoleCheck()` - automatically checks dev mode vs blockchain
- **Indicator:** Floating button shows dev mode status

### Role Checking Priority
1. **Dev Mode Enabled:** Use `devRole` from localStorage
2. **Dev Mode Disabled:** 
   - Check `ADMIN_ADDRESSES` in `.env.local`
   - Query AccessControl smart contract
   - Check Supabase for exporter/investor profiles

### Console Logs
Monitor these in DevTools Console:
- `🔑 Panna Wallet Address:` - Your generated address
- `🔧 Dev Mode: ENABLED/DISABLED` - Dev mode status
- `👤 Dev Role set to: ROLE` - Selected dev role

---

## 📝 Example Testing Scenarios

### Scenario 1: Test Exporter Flow
```
1. Enable Dev Mode
2. Select "Exporter" role
3. Go to /exporter
4. Create invoice
5. Test withdrawal flow
```

### Scenario 2: Test Investor Flow
```
1. Enable Dev Mode
2. Select "Investor" role  
3. Go to /investor
4. Browse pools
5. Test investment flow
```

### Scenario 3: Test Admin Flow
```
1. Add your Panna address to .env.local OR
2. Use Dev Mode with "Admin" role
3. Go to /admin
4. Verify exporters
5. Create pools
6. Distribute funds
```

### Scenario 4: Switch Between Roles
```
1. Open Dev Mode panel
2. Click different role buttons
3. Instantly switch contexts
4. No logout/login needed
```

---

## 🐛 Troubleshooting

**Issue:** Dev mode not persisting after refresh
- **Solution:** Check browser localStorage isn't being cleared
- **Check:** DevTools → Application → Local Storage

**Issue:** Role not updating after grant
- **Solution:** Refresh the page after granting role
- **Alternative:** Use Dev Mode for instant role switch

**Issue:** Address not showing in console
- **Solution:** Make sure DevTools Console is open before connecting wallet
- **Check:** Console filter isn't hiding logs

**Issue:** Can't access admin panel
- **Solution:** Either:
  1. Add your Panna address to `.env.local` ADMIN_ADDRESSES
  2. Enable Dev Mode and select "Admin" role

---

## 💡 Pro Tips

1. **Keep DevTools Open:** Always have console open to see your Panna address
2. **Use Dev Mode for UI:** Test layouts and flows without blockchain delays
3. **Use Real Roles for Blockchain:** Test actual transactions with granted roles
4. **Bookmark Addresses:** Save your Panna addresses for future testing
5. **Environment File:** Create `.env.local.example` with your test addresses

---

## 🎨 UI Indicators

### Dev Mode Status
- **Inactive:** Gray ⚙️ button (bottom right)
- **Active:** Pulsing amber ⚙️ button
- **Panel Open:** Floating card with role selection

### Current Status Display
In Dev Mode panel, bottom section shows:
- `Status: Dev Mode (admin)` - Dev mode active with admin role
- `Status: Production Mode` - Using blockchain verification

---

## 📦 Files Modified

- `src/hooks/usePanna.ts` - Added console logging
- `src/contexts/DevModeContext.tsx` - Dev mode state management
- `src/hooks/useRoleCheck.ts` - Role verification with dev mode support
- `src/components/DevModeToggle.tsx` - Floating dev mode UI
- `src/app/admin/roles/page.tsx` - Self-service role management
- `src/providers/index.tsx` - DevModeProvider integration
- `src/app/layout.tsx` - DevModeToggle component

---

**Happy Testing! 🎉**

For questions or issues, check the console logs or open DevTools for debugging.
