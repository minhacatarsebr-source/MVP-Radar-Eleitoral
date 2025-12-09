import express from "express";
import cors from "cors";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/", (req, res) => {
  res.json({ ok: true, message: "API is running" });
});

/**
 * GET /mentions
 * Example: /mentions?api_key=MINHA_CHAVE&limit=50
 */
app.get("/mentions", (req, res) => {
  const { api_key, limit } = req.query;

  // Check if API key was provided
  if (!api_key) {
    return res.status(401).json({ error: "Missing API key" });
  }

  // Return mock data for now
  return res.json({
    ok: true,
    endpoint: "mentions",
    limit: limit ?? 20,
    time: new Date().toISOString(),
    data: [
      { id: 1, text: "Exemplo de menção 1", author: "Usuário A" },
      { id: 2, text: "Exemplo de menção 2", author: "Usuário B" }
    ]
  });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server (Vercel ignora esta porta, mas local funciona)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export default for Vercel compatibility
export default app;
