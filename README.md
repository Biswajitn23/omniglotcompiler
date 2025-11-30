# Omniglot Compiler

A modern frontend web application built using **TypeScript**, **Vite**, **Tailwind CSS**, **Supabase**, **Perplexity API**, and **Judge0** for code compilation.  
This project provides a clean, fast, and scalable setup for building compiler tools or interactive multi-language code execution environments.

🔗 **Live Demo:** https://omniglotcompiler.vercel.app/

---

## 🚀 Features

- ⚡ Vite for ultra-fast development  
- 🎨 Tailwind CSS for a clean UI  
- 🧩 TypeScript for reliability  
- 🗄️ Supabase (Auth, Database, Storage)  
- 🤖 Perplexity API integration  
- 🧮 Judge0 API for code compilation & execution  
- ☁️ Ready for Vercel deployment  
- 📁 Clean, modular folder structure  

---

## 🛠️ Tech Stack

- TypeScript  
- Vite  
- Tailwind CSS  
- Supabase  
- Judge0 API  
- Perplexity API  
- Node.js / npm  

---

## 📁 Project Structure

```
omniglotcompiler/
├── src/                
├── supabase/           
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── vite.config.ts
```

---

## ⚙️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/Biswajitn23/omniglotcompiler.git
cd omniglotcompiler
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create environment variables  
Create a `.env` or `.env.local` file:

```
# Supabase credentials
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key

# Perplexity API
VITE_PERPLEXITY_API_KEY=your-perplexity-api-key

# Judge0 API
VITE_JUDGE0_URL=https://ce.judge0.com
VITE_JUDGE0_API_KEY=your-judge0-api-key
```

> ⚠️ Do not commit `.env` to GitHub.

### 4. Start the development server
```bash
npm run dev
```

### 5. Build for production
```bash
npm run build
```

### 6. Preview production build
```bash
npm run preview
```

---

## ☁️ Deployment (Vercel)

1. Connect the GitHub repo to Vercel  
2. Add environment variables under **Project → Settings → Environment Variables**  
3. Build command:
```
npm run build
```
4. Output directory:
```
dist
```

---

## 🧮 Judge0 Usage (Short Overview)

The app uses the **Judge0 CE API** to compile & run code in multiple languages:

- Send code to Judge0 via `POST /submissions`
- Retrieve results via `GET /submissions/{token}`
- Supports C, C++, Python, JavaScript, Java, Go, and more  

You may use a private Judge0 instance for improved performance.

---

## 🤝 Contributing

1. Fork the repository  
2. Create a feature branch  
3. Commit your changes  
4. Push and open a Pull Request  

---

## 📌 Roadmap

- Add compiler logic documentation  
- Add execution examples  
- Add screenshots / demo GIF  
- Add GitHub Actions CI  
- Add automated tests  

---

## 📄 License

This project currently has **no license**.

---

## 👤 Author

**Biswajit N**  
GitHub: https://github.com/Biswajitn23
