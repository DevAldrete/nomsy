import app from "./src/app.js";
import { connectDb } from "./src/lib/db.js";

const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("Missing JWT_SECRET");
  process.exit(1);
}
if (!MONGO_URI) {
  console.error("Missing MONGO_URI");
  process.exit(1);
}

async function main() {
  await connectDb(MONGO_URI as string);
  app.listen(Number(PORT), () => {
    console.log(`API running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
