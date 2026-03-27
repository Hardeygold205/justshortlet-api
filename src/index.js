import app from "./app.js";
import ENV from "./config/env.js";

const PORT = ENV.PORT;

if (!PORT) {
  console.error("Port not found");
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
