import express from "express"

import { matchesRouter } from "@/routes/matches.js"

const app = express()
const PORT = process.env.PORT || 8000

app.use(express.json())
app.use("/matches", matchesRouter)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})