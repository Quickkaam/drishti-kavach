# 🚀 Drishti Kavach - Quick Start Guide

## ✅ **EVERYTHING IS READY!**

### **Step 1: Run the Installation Script**
Double-click: `INSTALL_AND_RUN.bat`

This will:
1. ✅ Install backend dependencies
2. ✅ Install frontend dependencies  
3. ✅ Set up database tables
4. ✅ Create super admin account

### **Step 2: Start the Servers**
**Open TWO terminals:**

**Terminal 1 - Backend:**
```bash
cd "Drishti Kavach\backend"
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd "Drishti Kavach\frontend"
npm run dev
```

### **Step 3: Login & Test**
1. **Open browser**: `http://localhost:5173`
2. **Login with**:
   - Email: `whitehatwolf22@gmail.com`
   - Password: `Coco@22/07/2001`

3. **Test these features**:
   - ✅ Click theme toggle (top right) - switches dark/light mode
   - ✅ Resize to mobile - hamburger menu appears
   - ✅ Go to IP Management - new cyber-noir design
   - ✅ Navigate to `/404` - custom error page shows

## 📊 **WHAT TO EXPECT**

### **When Backend Starts:**
```
🕉️  Drishti Kavach API running on port 3000
   दृष्टिः रक्षति, रक्षा दृश्यते
   "Vision protects, and protection is seen."
```

### **When Frontend Starts:**
```
VITE v5.x.x ready in xxx ms
➜  Local:   http://localhost:5173/
```

## 🔧 **TROUBLESHOOTING**

### **If Database Setup Fails:**
1. Check Supabase project is active
2. Check service key is correct
3. Try manually: `cd backend && node src/db/setup.js`

### **If Servers Won't Start:**
1. Check ports 3000 and 5173 are free
2. Try: `netstat -ano | findstr :3000` (kill process if needed)
3. Try: `netstat -ano | findstr :5173` (kill process if needed)

### **If Login Fails:**
1. Check backend is running on port 3000
2. Check `.env` files have correct values
3. Try restarting both servers

## 🎨 **DESIGN FEATURES TO TEST**

✅ **Theme Toggle**: Sun/moon icon in top right  
✅ **Mobile Menu**: Resize to phone size, click hamburger  
✅ **Skeleton Loaders**: Slow API calls show loading states  
✅ **Error Pages**: Navigate to `/404`  
✅ **Responsive Design**: Resize browser, layout adapts  
✅ **Cyber-Noir Effects**: Neural networks, scanlines, hex corners  

## 📁 **FILES I CREATED FOR YOU**

1. ✅ `backend/.env` - Environment variables with your Supabase keys
2. ✅ `frontend/.env` - Frontend configuration
3. ✅ `INSTALL_AND_RUN.bat` - One-click installation script
4. ✅ `QUICK_START_GUIDE.md` - This guide

## ⏱️ **ESTIMATED TIMELINE**

**Installation**: 5-10 minutes  
**Database Setup**: 2-5 minutes  
**Testing**: 5-10 minutes  
**Total**: 15-25 minutes

## 🎯 **START NOW:**

1. **Double-click** `INSTALL_AND_RUN.bat`
2. **Open two terminals** when prompted
3. **Start both servers**
4. **Login and test!**

---

**दृष्टिः रक्षति, रक्षा दृश्यते**  
*Vision protects, and protection is seen.*