import express from "express";
import cors from "cors";
import {
  getImgLinks,
  getCreateImageRequestId,
  getRequestIdStatus,
} from "./imgen";
import { sleep } from "./utils";

const app = express();
const port = process.env.PORT || 5300;

const corsOptions = {
  origin: "https://vercel.com/gabrieldev023s-projects/hq-labs-front-deploy",
  credentials:true,            //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.get("/", (_req, res) => {
  res.send("Listening");
});

app.get("/get-image-request-id", async (req, res) => {
  const { _U, prompt } = req.query;
  if (!_U || !prompt || typeof _U !== "string" || typeof prompt !== "string")
    return res.status(200).json({
      error: { message: "Parâmetros inválidos", type: "InvalidQueryParam" },
    });

  let maxRetries = 5;
  let error = "";
  while (maxRetries > 0) {
    try {
      const requestId = await getCreateImageRequestId(_U, prompt);
      return res.status(200).json(requestId);
    } catch (err) {
      console.log(`error: ${err as string}. Retrying...`);
      // return res.status(200).json({ error });
      error = err as string;
    }

    maxRetries -= 1;
    await sleep(2000);
  }
  return res.status(200).json({ error });
});
app.get("/get-imgs-links", async (req, res) => {
  const { _U, prompt } = req.query;
  if (!_U || !prompt || typeof _U !== "string" || typeof prompt !== "string")
    return res.status(200).json({
      error: { message: "Parâmetros inválidos", type: "InvalidQueryParam" },
    });

  try {
    const imgLinks = await getImgLinks(_U, prompt);
    res.status(200).json(imgLinks);
  } catch (error) {
    console.log(error);
    res.status(200).json({ error });
  }
});
app.get("/retry-get-imgs-links", async (req, res) => {
  const { _U, pollingUrl } = req.query;
  if (
    !_U ||
    !pollingUrl ||
    typeof _U !== "string" ||
    typeof pollingUrl !== "string"
  )
    return res.status(200).json({
      error: { message: "Parâmetros inválidos", type: "InvalidQueryParam" },
    });

  try {
    const imgLinks = await getImgLinks(_U, "", pollingUrl);
    res.status(200).json(imgLinks);
  } catch (error) {
    console.log(error);
    res.status(200).json({ error });
  }
});

app.get("/get-request-id-status", async (req, res) => {
  const { _U, requestId } = req.query;
  if (
    !_U ||
    !requestId ||
    typeof _U !== "string" ||
    typeof requestId !== "string"
  )
    return res.status(200).json({
      error: { message: "Parâmetros inválidos", type: "InvalidQueryParam" },
    });

  try {
    const status = await getRequestIdStatus(_U, requestId);
    res.status(200).json(status);
  } catch (error) {
    console.log(error);
    res.status(200).json({ error });
  }
});

app.listen(port, () => {
  console.log(`Server is listening at port ${port}`);
});
